import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useInvokeEdge } from '@/lib/invoke-edge';

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  attachment_url: string | null;
  attachment_type: string | null;
  attachment_name: string | null;
  created_at: string;
}

export interface ConversationSummary {
  id: string;
  other_user_id: string;
  other_name: string;
  other_avatar: string | null;
  other_role: string | null;
  last_message_at: string;
  last_message_preview: string;
  unread_count: number;
}

export function useConversations() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data: myParts } = await supabase
      .from('conversation_participants')
      .select('conversation_id, last_read_at')
      .eq('user_id', user.id);

    const convIds = (myParts ?? []).map((p) => p.conversation_id);
    if (convIds.length === 0) {
      setConversations([]);
      setLoading(false);
      return;
    }

    const lastReadMap = new Map<string, string>(
      (myParts ?? []).map((p) => [p.conversation_id, p.last_read_at]),
    );

    const [{ data: convs }, { data: allParts }, { data: profiles }, { data: roles }] =
      await Promise.all([
        supabase.from('conversations').select('*').in('id', convIds).order('last_message_at', { ascending: false }),
        supabase.from('conversation_participants').select('*').in('conversation_id', convIds),
        supabase.from('profiles').select('user_id, full_name, avatar_url'),
        supabase.from('user_roles').select('user_id, role'),
      ]);

    const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p]));
    const roleMap = new Map((roles ?? []).map((r) => [r.user_id, r.role as string]));

    const summaries: ConversationSummary[] = await Promise.all(
      (convs ?? []).map(async (c) => {
        const otherPart = (allParts ?? []).find(
          (p) => p.conversation_id === c.id && p.user_id !== user.id,
        );
        const otherId = otherPart?.user_id ?? '';
        const profile = profileMap.get(otherId);
        const lastReadAt = lastReadMap.get(c.id) ?? c.created_at;

        const [{ data: lastMsg }, { count }] = await Promise.all([
          supabase
            .from('messages')
            .select('content, attachment_name')
            .eq('conversation_id', c.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', c.id)
            .neq('sender_id', user.id)
            .gt('created_at', lastReadAt),
        ]);

        return {
          id: c.id,
          other_user_id: otherId,
          other_name: profile?.full_name || 'Unknown',
          other_avatar: profile?.avatar_url || null,
          other_role: roleMap.get(otherId) ?? null,
          last_message_at: c.last_message_at,
          last_message_preview: lastMsg?.content || (lastMsg?.attachment_name ? `📎 ${lastMsg.attachment_name}` : 'No messages yet'),
          unread_count: count ?? 0,
        };
      }),
    );

    setConversations(summaries);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  // Realtime: refresh when any message lands in one of my conversations
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('conversations-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversation_participants' }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, load]);

  return { conversations, loading, reload: load };
}

export function useConversation(conversationId: string | null) {
  const { user } = useAuth();
  const invoke = useInvokeEdge();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [otherTyping, setOtherTyping] = useState(false);
  const [otherLastReadAt, setOtherLastReadAt] = useState<string | null>(null);
  const typingTimer = useRef<number | null>(null);

  const load = useCallback(async () => {
    if (!conversationId || !user) return;
    setLoading(true);

    const [{ data: msgs }, { data: parts }] = await Promise.all([
      supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true }),
      supabase
        .from('conversation_participants')
        .select('user_id, last_read_at')
        .eq('conversation_id', conversationId),
    ]);

    setMessages((msgs ?? []) as ChatMessage[]);
    const other = (parts ?? []).find((p) => p.user_id !== user.id);
    setOtherLastReadAt(other?.last_read_at ?? null);
    setLoading(false);

    // Mark as read
    await invoke('chat-send', { action: 'mark_read', conversation_id: conversationId });
  }, [conversationId, user, invoke]);

  useEffect(() => {
    load();
  }, [load]);

  // Realtime subscriptions
  useEffect(() => {
    if (!conversationId || !user) return;

    const channel = supabase
      .channel(`conv-${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        async (payload) => {
          const newMsg = payload.new as ChatMessage;
          setMessages((prev) => (prev.some((m) => m.id === newMsg.id) ? prev : [...prev, newMsg]));
          if (newMsg.sender_id !== user.id) {
            await invoke('chat-send', { action: 'mark_read', conversation_id: conversationId });
          }
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'typing_indicators', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const row = (payload.new || payload.old) as { user_id: string; updated_at?: string };
          if (row.user_id === user.id) return;
          if (payload.eventType === 'DELETE') {
            setOtherTyping(false);
          } else {
            const updated = new Date((payload.new as { updated_at: string }).updated_at).getTime();
            if (Date.now() - updated < 5000) setOtherTyping(true);
          }
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'conversation_participants', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const row = payload.new as { user_id: string; last_read_at: string };
          if (row.user_id !== user.id) setOtherLastReadAt(row.last_read_at);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, user, invoke]);

  // Auto-clear typing indicator if stale
  useEffect(() => {
    if (!otherTyping) return;
    const t = window.setTimeout(() => setOtherTyping(false), 5000);
    return () => clearTimeout(t);
  }, [otherTyping]);

  const sendMessage = useCallback(
    async (content: string, attachment?: { url: string; name: string; type: string }) => {
      if (!conversationId) return;
      await invoke('chat-send', {
        action: 'send',
        conversation_id: conversationId,
        content,
        attachment_url: attachment?.url,
        attachment_name: attachment?.name,
        attachment_type: attachment?.type,
      });
    },
    [conversationId, invoke],
  );

  const sendTyping = useCallback(() => {
    if (!conversationId) return;
    invoke('chat-send', { action: 'typing', conversation_id: conversationId, is_typing: true });
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = window.setTimeout(() => {
      invoke('chat-send', { action: 'typing', conversation_id: conversationId, is_typing: false });
    }, 3000);
  }, [conversationId, invoke]);

  const uploadFile = useCallback(
    async (file: File): Promise<{ url: string; name: string; type: string } | null> => {
      if (!conversationId) return null;
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File must be under 10MB');
      }
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1] ?? '');
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const res = await invoke<{ url: string; name: string; type: string }>('chat-send', {
        action: 'upload',
        conversation_id: conversationId,
        file_name: file.name,
        file_type: file.type,
        file_base64: base64,
      });
      if (res.error || !res.data) throw res.error ?? new Error('Upload failed');
      return res.data;
    },
    [conversationId, invoke],
  );

  return {
    messages,
    loading,
    otherTyping,
    otherLastReadAt,
    sendMessage,
    sendTyping,
    uploadFile,
    reload: load,
  };
}

export function useStartConversation() {
  const invoke = useInvokeEdge();
  return useCallback(
    async (otherUserId: string): Promise<string | null> => {
      const res = await invoke<{ conversation_id: string }>('chat-send', {
        action: 'start',
        other_user_id: otherUserId,
      });
      if (res.error || !res.data) return null;
      return res.data.conversation_id;
    },
    [invoke],
  );
}
