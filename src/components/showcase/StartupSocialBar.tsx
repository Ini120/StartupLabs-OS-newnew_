import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Heart, MessageCircle, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  useStartupLikes, useToggleStartupLike, useCreateComment, useDeleteComment,
} from '@/hooks/use-social-feed';

export function StartupSocialBar({ startupId }: { startupId: string }) {
  const { user } = useAuth();
  const { data: likes = [] } = useStartupLikes();
  const toggle = useToggleStartupLike();
  const createComment = useCreateComment();
  const deleteComment = useDeleteComment();
  const [draft, setDraft] = useState('');

  const startupLikes = likes.filter(l => l.startup_id === startupId);
  const liked = startupLikes.some(l => l.user_id === user?.id);

  const { data: comments = [] } = useQuery({
    queryKey: ['startup-comments', startupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('post_comments')
        .select('*')
        .eq('startup_id', startupId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    createComment.mutate({ content: draft.trim(), startup_id: startupId });
    setDraft('');
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 border-y border-border/50 py-2">
        <Button
          variant="ghost" size="sm"
          className={cn('gap-1.5 h-8', liked && 'text-destructive')}
          onClick={(e) => { e.stopPropagation(); user && toggle.mutate(startupId); }}
          disabled={!user}
        >
          <Heart className={cn('h-4 w-4', liked && 'fill-current')} />
          <span className="text-xs font-medium">{startupLikes.length}</span>
        </Button>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground px-2">
          <MessageCircle className="h-4 w-4" /> {comments.length}
        </div>
      </div>

      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
        {comments.map(c => (
          <StartupCommentRow
            key={c.id}
            comment={c}
            canDelete={user?.id === c.user_id}
            onDelete={() => deleteComment.mutate(c.id)}
          />
        ))}
        {comments.length === 0 && (
          <p className="text-xs text-muted-foreground italic">Be the first to comment.</p>
        )}
      </div>

      {user && (
        <form onSubmit={submit} className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <Input
            value={draft}
            onChange={e => setDraft(e.target.value)}
            placeholder="Add a comment…"
            className="h-9"
            maxLength={1000}
          />
          <Button type="submit" size="icon" className="h-9 w-9 shrink-0" disabled={!draft.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      )}
    </div>
  );
}

function StartupCommentRow({ comment, canDelete, onDelete }: {
  comment: { id: string; user_id: string; content: string };
  canDelete: boolean;
  onDelete: () => void;
}) {
  const { data: author } = useQuery({
    queryKey: ['profile', comment.user_id],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('full_name, avatar_url')
        .eq('user_id', comment.user_id).maybeSingle();
      return data;
    },
  });
  return (
    <div className="flex items-start gap-2 group">
      <Avatar className="h-6 w-6 shrink-0">
        <AvatarImage src={author?.avatar_url || undefined} />
        <AvatarFallback className="text-[9px]">{(author?.full_name || '??').slice(0,2).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="flex-1 rounded-xl bg-muted/50 px-2.5 py-1.5 text-xs">
        <div className="flex items-center justify-between gap-2">
          <Link
            to={`/profile/${comment.user_id}`}
            className="font-semibold hover:text-primary"
            onClick={(e) => e.stopPropagation()}
          >
            {author?.full_name || 'Anonymous'}
          </Link>
          {canDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
            >
              ×
            </button>
          )}
        </div>
        <p className="mt-0.5 leading-snug whitespace-pre-wrap">{comment.content}</p>
      </div>
    </div>
  );
}
