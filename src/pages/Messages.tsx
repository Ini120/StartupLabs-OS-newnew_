import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useConversations, useConversation, useStartConversation } from '@/hooks/use-chat';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  MessageSquarePlus, Send, Paperclip, Search, CheckCheck, Check,
  ImageIcon, FileText, X, Loader2, Smile, Phone, Video, MoreHorizontal,
} from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  if (isToday(d)) return format(d, 'HH:mm');
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'MMM d');
}

function formatFullTime(dateStr: string) {
  return format(new Date(dateStr), 'MMM d, HH:mm');
}

function initialsOf(name: string) {
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || '?';
}

const roleColor: Record<string, string> = {
  admin: 'bg-primary/15 text-primary border-primary/30',
  mentor: 'bg-success/15 text-success border-success/30',
  student: 'bg-warning/15 text-warning border-warning/30',
};

const roleEmoji: Record<string, string> = {
  admin: '⚡',
  mentor: '🎓',
  student: '📚',
};

// Stable styles injected once at module level — never re-renders
if (typeof document !== 'undefined' && !document.getElementById('messages-styles')) {
  const el = document.createElement('style');
  el.id = 'messages-styles';
  el.textContent = `
    @keyframes msgSlideUp {
      from { opacity: 0; transform: translateY(5px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes pulseOnline {
      0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.45); }
      50%       { box-shadow: 0 0 0 4px rgba(34,197,94,0); }
    }
    .msg-new {
      animation: msgSlideUp 0.2s ease both;
    }
    .online-dot {
      animation: pulseOnline 2.5s ease-in-out infinite;
    }
    .composer-input:focus-within {
      box-shadow: 0 0 0 2px hsl(var(--primary) / 0.2);
    }
  `;
  document.head.appendChild(el);
}

export default function Messages() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeId = searchParams.get('c');
  const setActive = (id: string | null) => {
    if (id) setSearchParams({ c: id });
    else setSearchParams({});
  };

  const { conversations, loading: convsLoading, reload } = useConversations();
  const [search, setSearch] = useState('');
  const [newChatOpen, setNewChatOpen] = useState(false);

  // Only show skeleton on the very first load — not on real-time re-fetches
  const hasLoadedConvs = useRef(false);
  if (!convsLoading) hasLoadedConvs.current = true;
  const showSkeleton = convsLoading && !hasLoadedConvs.current;

  const filtered = useMemo(
    () => conversations.filter((c) => c.other_name.toLowerCase().includes(search.toLowerCase())),
    [conversations, search],
  );

  const active = conversations.find((c) => c.id === activeId) ?? null;

  const totalUnread = useMemo(
    () => conversations.reduce((sum, c) => sum + (c.unread_count ?? 0), 0),
    [conversations],
  );

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1
              className="text-2xl md:text-3xl font-semibold tracking-tight"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Messages
            </h1>
            {totalUnread > 0 && (
              <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full text-[10px] font-bold bg-gradient-aurora text-white shadow-glow">
                {totalUnread}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Chat live with mentors, students, and admins.
          </p>
        </div>
        <Dialog open={newChatOpen} onOpenChange={setNewChatOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-glow rounded-xl hover-lift">
              <MessageSquarePlus className="h-4 w-4" /> New chat
            </Button>
          </DialogTrigger>
          <NewChatDialog
            onClose={() => setNewChatOpen(false)}
            onStarted={(id) => {
              setActive(id);
              reload();
              setNewChatOpen(false);
            }}
          />
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-4 h-[calc(100vh-220px)] min-h-[500px]">
        {/* Sidebar */}
        <div
          className={cn(
            "rounded-2xl border border-border/60 bg-card/70 backdrop-blur-sm flex flex-col overflow-hidden",
            active && "hidden md:flex",
          )}
        >
          {/* Sidebar header */}
          <div className="px-3 pt-3 pb-2 border-b border-border/60 space-y-2.5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search conversations"
                className="pl-8 h-8 text-sm rounded-xl bg-accent/40 border-transparent focus:border-primary/30 transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            {conversations.length > 0 && (
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground px-1">
                {filtered.length} {filtered.length === 1 ? 'conversation' : 'conversations'}
              </p>
            )}
          </div>

          <ScrollArea className="flex-1">
            {showSkeleton ? (
              <div className="flex flex-col gap-2 p-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl animate-pulse">
                    <div className="h-10 w-10 rounded-full bg-muted shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-muted rounded-full w-2/3" />
                      <div className="h-2.5 bg-muted rounded-full w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center">
                <div className="h-12 w-12 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto mb-3">
                  <MessageSquarePlus className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground/70">
                  {search ? 'No results found' : 'No conversations yet'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {search ? `Nothing matches "${search}"` : 'Start a new chat above'}
                </p>
              </div>
            ) : (
              <ul className="p-2 space-y-0.5">
                {filtered.map((c) => (
                  <li key={c.id}>
                    <button
                      onClick={() => setActive(c.id)}
                      className={cn(
                        "w-full text-left p-2.5 rounded-xl transition-colors duration-100 flex items-start gap-3 group relative",
                        activeId === c.id
                          ? "bg-gradient-to-r from-primary/15 via-primary-glow/10 to-transparent shadow-sm"
                          : "hover:bg-accent/60",
                      )}
                    >
                      {/* Active indicator bar */}
                      {activeId === c.id && (
                        <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-primary" />
                      )}

                      {/* Avatar with online dot */}
                      <div className="relative shrink-0">
                        <Avatar className="h-10 w-10 ring-2 ring-background">
                          {c.other_avatar && <AvatarImage src={c.other_avatar} />}
                          <AvatarFallback className="bg-gradient-aurora text-white text-xs font-semibold">
                            {initialsOf(c.other_name)}
                          </AvatarFallback>
                        </Avatar>
                        {/* Online dot — always shown, can be wired to presence later */}
                        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-background" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-sm truncate">{c.other_name}</p>
                          <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">
                            {formatTime(c.last_message_at)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-0.5">
                          <p
                            className={cn(
                              "text-xs truncate",
                              c.unread_count > 0 ? "text-foreground font-medium" : "text-muted-foreground",
                            )}
                          >
                            {c.last_message_preview}
                          </p>
                          {c.unread_count > 0 && (
                            <Badge className="h-4.5 min-w-4.5 px-1.5 rounded-full text-[10px] bg-gradient-aurora text-white shrink-0 shadow-glow">
                              {c.unread_count}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </ScrollArea>
        </div>

        {/* Chat panel */}
        <div
          className={cn(
            "rounded-2xl border border-border/60 bg-card/70 backdrop-blur-sm flex flex-col overflow-hidden",
            !active && "hidden md:flex",
          )}
        >
          {active ? (
            <ChatPanel
              key={active.id}
              conversationId={active.id}
              otherName={active.other_name}
              otherAvatar={active.other_avatar}
              otherRole={active.other_role}
              onBack={() => setActive(null)}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="relative mb-5">
                <div className="h-20 w-20 rounded-3xl bg-gradient-aurora flex items-center justify-center shadow-glow">
                  <MessageSquarePlus className="h-9 w-9 text-primary-foreground" />
                </div>
                {/* Decorative rings */}
                <div className="absolute inset-0 rounded-3xl border-2 border-primary/20 scale-110 opacity-60" />
                <div className="absolute inset-0 rounded-3xl border border-primary/10 scale-125 opacity-40" />
              </div>
              <h3 className="text-lg font-semibold">Pick a conversation</h3>
              <p className="text-sm text-muted-foreground mt-1.5 max-w-xs leading-relaxed">
                Select someone from the list, or start a new chat with anyone in the program.
              </p>
              <div className="flex gap-1.5 mt-5">
                {['💬', '🎓', '⚡'].map((e, i) => (
                  <span
                    key={i}
                    className="h-8 w-8 rounded-xl bg-muted/60 flex items-center justify-center text-base"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    {e}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ChatPanel({
  conversationId,
  otherName,
  otherAvatar,
  otherRole,
  onBack,
}: {
  conversationId: string;
  otherName: string;
  otherAvatar: string | null;
  otherRole: string | null;
  onBack: () => void;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { messages, loading, otherTyping, otherLastReadAt, sendMessage, sendTyping, uploadFile } =
    useConversation(conversationId);
  const [text, setText] = useState('');
  const [pending, setPending] = useState<{ url: string; name: string; type: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length, otherTyping]);

  const lastMineId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].sender_id === user?.id) return messages[i].id;
    }
    return null;
  }, [messages, user]);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const res = await uploadFile(file);
      if (res) setPending(res);
    } catch (e: any) {
      toast({ title: 'Upload failed', description: e.message, variant: 'destructive' });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleSend = async () => {
    if (!text.trim() && !pending) return;
    setSending(true);
    try {
      await sendMessage(text.trim(), pending ?? undefined);
      setText('');
      setPending(null);
    } catch (e: any) {
      toast({ title: 'Failed to send', description: e.message, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-border/60 flex items-center gap-3 bg-card/50 backdrop-blur-sm">
        <button
          onClick={onBack}
          className="md:hidden text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-accent"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative shrink-0">
          <Avatar className="h-9 w-9 ring-2 ring-primary/20">
            {otherAvatar && <AvatarImage src={otherAvatar} />}
            <AvatarFallback className="bg-gradient-aurora text-white text-xs font-semibold">
              {initialsOf(otherName)}
            </AvatarFallback>
          </Avatar>
          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-background" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm truncate">{otherName}</p>
            {otherRole && (
              <Badge
                variant="outline"
                className={cn("text-[10px] uppercase tracking-wider gap-1", roleColor[otherRole])}
              >
                {roleEmoji[otherRole]} {otherRole}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {otherTyping ? (
              <span className="text-primary font-medium">typing…</span>
            ) : (
              <span className="text-green-500">Online</span>
            )}
          </p>
        </div>

        {/* Header actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors" title="Voice call">
            <Phone className="h-4 w-4" />
          </button>
          <button className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors" title="Video call">
            <Video className="h-4 w-4" />
          </button>
          <button className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors" title="More options">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-gradient-mesh">
        {loading ? (
          <div className="flex flex-col gap-3 pt-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className={cn("flex gap-2", i % 2 === 0 ? "justify-start" : "justify-end")}>
                {i % 2 === 0 && <div className="h-7 w-7 rounded-full bg-muted animate-pulse shrink-0" />}
                <div
                  className="h-9 rounded-2xl bg-muted animate-pulse"
                  style={{ width: `${100 + (i % 3) * 60}px` }}
                />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-3xl mb-3">👋</div>
            <p className="text-sm font-medium text-foreground/70">Say hi to {otherName}!</p>
            <p className="text-xs text-muted-foreground mt-1">Be the first to send a message.</p>
          </div>
        ) : (
          messages.map((m, idx) => {
            const mine = m.sender_id === user?.id;
            const seen =
              mine &&
              m.id === lastMineId &&
              otherLastReadAt &&
              new Date(otherLastReadAt) >= new Date(m.created_at);
            const isNewest = idx === messages.length - 1;

            // Date separator
            const prevDate = idx > 0 ? new Date(messages[idx - 1].created_at).toDateString() : null;
            const thisDate = new Date(m.created_at).toDateString();
            const showDateSep = prevDate !== thisDate;

            return (
              <div key={m.id}>
                {showDateSep && (
                  <div className="flex items-center gap-2 my-3">
                    <div className="flex-1 h-px bg-border/50" />
                    <span className="text-[10px] font-medium text-muted-foreground px-2 py-0.5 rounded-full bg-muted/50">
                      {isToday(new Date(m.created_at))
                        ? 'Today'
                        : isYesterday(new Date(m.created_at))
                        ? 'Yesterday'
                        : format(new Date(m.created_at), 'MMMM d, yyyy')}
                    </span>
                    <div className="flex-1 h-px bg-border/50" />
                  </div>
                )}
                <div className={cn("flex", mine ? "justify-end" : "justify-start", isNewest && "msg-new")}>
                  <div className={cn("max-w-[75%] flex flex-col", mine ? "items-end" : "items-start")}>
                    <div
                      className={cn(
                        "rounded-2xl px-3.5 py-2 shadow-sm",
                        mine
                          ? "bg-gradient-aurora text-white rounded-br-sm"
                          : "bg-card border border-border/60 rounded-bl-sm",
                      )}
                    >
                      {m.attachment_url && (
                        <AttachmentPreview
                          url={m.attachment_url}
                          name={m.attachment_name ?? 'file'}
                          type={m.attachment_type ?? ''}
                          mine={mine}
                        />
                      )}
                      {m.content && (
                        <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{m.content}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5 px-1 text-[10px] text-muted-foreground">
                      <span>{formatFullTime(m.created_at)}</span>
                      {mine && (
                        seen
                          ? <CheckCheck className="h-3 w-3 text-primary" />
                          : <Check className="h-3 w-3" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Typing indicator */}
        {otherTyping && (
          <div className="flex items-center gap-2 justify-start msg-enter">
            <Avatar className="h-6 w-6 shrink-0">
              {otherAvatar && <AvatarImage src={otherAvatar} />}
              <AvatarFallback className="bg-gradient-aurora text-white text-[9px] font-semibold">
                {initialsOf(otherName)}
              </AvatarFallback>
            </Avatar>
            <div className="bg-card border border-border/60 rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-sm">
              <div className="flex gap-1 items-center">
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-border/60 p-3 bg-card/50 space-y-2">
        {pending && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/5 border border-primary/20">
            {pending.type.startsWith('image/') ? (
              <ImageIcon className="h-4 w-4 text-primary" />
            ) : (
              <FileText className="h-4 w-4 text-primary" />
            )}
            <span className="text-xs flex-1 truncate font-medium">{pending.name}</span>
            <button
              onClick={() => setPending(null)}
              className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded-md hover:bg-accent"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <div className="flex items-center gap-1.5">
          <input
            ref={fileRef}
            type="file"
            accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-xl shrink-0 h-9 w-9 text-muted-foreground hover:text-foreground"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            title="Attach file"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
          </Button>

          <div className="relative flex-1 composer-input rounded-full border border-border/60 bg-background/80 overflow-hidden transition-all">
            <Input
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                sendTyping();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Type a message…"
              className="rounded-full border-0 bg-transparent pr-10 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <button
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              title="Emoji"
            >
              <Smile className="h-4 w-4" />
            </button>
          </div>

          <Button
            type="button"
            onClick={handleSend}
            disabled={sending || (!text.trim() && !pending)}
            size="icon"
            className="rounded-full bg-gradient-aurora shadow-glow shrink-0 h-9 w-9 transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:scale-100"
            title="Send"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>
    </>
  );
}

function AttachmentPreview({
  url, name, type, mine,
}: { url: string; name: string; type: string; mine: boolean }) {
  if (type.startsWith('image/')) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="block mb-1.5 rounded-xl overflow-hidden">
        <img
          src={url}
          alt={name}
          className="rounded-xl max-h-60 max-w-full object-cover transition-opacity hover:opacity-90"
        />
      </a>
    );
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-xl mb-1.5 transition-all",
        mine ? "bg-primary-foreground/10 hover:bg-primary-foreground/20" : "bg-accent/60 hover:bg-accent",
      )}
    >
      <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <FileText className="h-3.5 w-3.5 text-primary" />
      </div>
      <span className="text-xs underline truncate">{name}</span>
    </a>
  );
}

function NewChatDialog({
  onClose,
  onStarted,
}: {
  onClose: () => void;
  onStarted: (conversationId: string) => void;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const startConversation = useStartConversation();
  const [search, setSearch] = useState('');
  const [starting, setStarting] = useState<string | null>(null);

  const { data: people = [], isLoading } = useQuery({
    queryKey: ['chat-people'],
    queryFn: async () => {
      const [{ data: profiles }, { data: roles }] = await Promise.all([
        supabase.from('profiles').select('user_id, full_name, avatar_url').eq('profile_completed', true),
        supabase.from('user_roles').select('user_id, role'),
      ]);
      const roleMap = new Map((roles ?? []).map((r) => [r.user_id, r.role as string]));
      return (profiles ?? [])
        .filter((p) => p.user_id !== user?.id)
        .map((p) => ({ ...p, role: roleMap.get(p.user_id) ?? null }));
    },
  });

  const filtered = people.filter((p) =>
    p.full_name?.toLowerCase().includes(search.toLowerCase()),
  );

  const handleStart = async (otherUserId: string) => {
    setStarting(otherUserId);
    const id = await startConversation(otherUserId);
    setStarting(null);
    if (id) onStarted(id);
    else toast({ title: 'Could not start chat', variant: 'destructive' });
  };

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-xl bg-gradient-aurora flex items-center justify-center shadow-glow">
            <MessageSquarePlus className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          Start a new chat
        </DialogTitle>
      </DialogHeader>
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search people…"
            className="pl-9 rounded-xl"
            autoFocus
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {!isLoading && filtered.length > 0 && (
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground px-1">
            {filtered.length} {filtered.length === 1 ? 'person' : 'people'}
          </p>
        )}

        <ScrollArea className="h-72">
          {isLoading ? (
            <div className="space-y-1 py-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-xl animate-pulse">
                  <div className="h-9 w-9 rounded-full bg-muted shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-muted rounded-full w-2/3" />
                    <div className="h-2 bg-muted rounded-full w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10">
              <div className="text-2xl mb-2">🔍</div>
              <p className="text-sm text-muted-foreground">
                {search ? `No results for "${search}"` : 'No one found.'}
              </p>
            </div>
          ) : (
            <ul className="space-y-0.5 pr-1">
              {filtered.map((p) => (
                <li key={p.user_id}>
                  <button
                    onClick={() => handleStart(p.user_id)}
                    disabled={starting === p.user_id}
                    className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-accent transition-all text-left disabled:opacity-50 group"
                  >
                    <div className="relative shrink-0">
                      <Avatar className="h-9 w-9">
                        {p.avatar_url && <AvatarImage src={p.avatar_url} />}
                        <AvatarFallback className="bg-gradient-aurora text-white text-xs font-semibold">
                          {initialsOf(p.full_name || '?')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-green-500 ring-2 ring-background" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.full_name || 'Unnamed'}</p>
                      {p.role && (
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                          {roleEmoji[p.role]} {p.role}
                        </p>
                      )}
                    </div>
                    {starting === p.user_id ? (
                      <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
                    ) : (
                      <span className="text-[10px] text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        Chat →
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </div>
    </DialogContent>
  );
}