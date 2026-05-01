import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Trash2, Send, Rocket } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import {
  ShowcasePost, useTogglePostLike, useDeletePost, useCreateComment,
  useDeleteComment, useComments, usePostLikes,
} from '@/hooks/use-social-feed';

interface Props {
  post: ShowcasePost;
}

export function PostCard({ post }: Props) {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');

  const { data: likes = [] } = usePostLikes();
  const { data: allComments = [] } = useComments();
  const toggleLike = useTogglePostLike();
  const createComment = useCreateComment();
  const deletePost = useDeletePost();
  const deleteComment = useDeleteComment();

  const postLikes = likes.filter(l => l.post_id === post.id);
  const liked = postLikes.some(l => l.user_id === user?.id);
  const comments = allComments.filter(c => c.post_id === post.id);

  const { data: author } = useQuery({
    queryKey: ['profile', post.user_id],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('full_name, avatar_url, headline')
        .eq('user_id', post.user_id).maybeSingle();
      return data;
    },
  });

  const { data: linkedStartup } = useQuery({
    queryKey: ['startup', post.startup_id],
    enabled: !!post.startup_id,
    queryFn: async () => {
      const { data } = await supabase.from('Startups').select('id, name')
        .eq('id', post.startup_id!).maybeSingle();
      return data;
    },
  });

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    createComment.mutate({ content: commentText.trim(), post_id: post.id });
    setCommentText('');
  };

  const initials = (author?.full_name || post.user_id).slice(0, 2).toUpperCase();

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <Link to={`/profile/${post.user_id}`} className="flex items-center gap-3 group">
            <Avatar className="h-10 w-10 ring-2 ring-primary/10">
              <AvatarImage src={author?.avatar_url || undefined} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm group-hover:text-primary transition-smooth">
                {author?.full_name || 'Anonymous'}
              </p>
              <p className="text-xs text-muted-foreground">
                {author?.headline || formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </p>
            </div>
          </Link>
          {user?.id === post.user_id && (
            <Button
              variant="ghost" size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => deletePost.mutate(post.id)}
              title="Delete post"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Content */}
        {post.content && (
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{post.content}</p>
        )}

        {post.image_url && (
          <img
            src={post.image_url}
            alt=""
            className="w-full rounded-lg border border-border/60 max-h-96 object-cover"
            loading="lazy"
          />
        )}

        {linkedStartup && (
          <Link
            to={`/showcase`}
            className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/15 transition-smooth"
          >
            <Rocket className="h-3 w-3" /> {linkedStartup.name}
          </Link>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1 pt-2 border-t border-border/50">
          <Button
            variant="ghost" size="sm"
            className={cn('gap-1.5 h-8 px-2', liked && 'text-destructive')}
            onClick={() => user && toggleLike.mutate(post.id)}
            disabled={!user}
          >
            <Heart className={cn('h-4 w-4', liked && 'fill-current')} />
            <span className="text-xs font-medium">{postLikes.length}</span>
          </Button>
          <Button
            variant="ghost" size="sm"
            className="gap-1.5 h-8 px-2"
            onClick={() => setShowComments(s => !s)}
          >
            <MessageCircle className="h-4 w-4" />
            <span className="text-xs font-medium">{comments.length}</span>
          </Button>
        </div>

        {/* Comments */}
        {showComments && (
          <div className="space-y-3 pt-2">
            {comments.map(c => (
              <CommentRow key={c.id} comment={c} onDelete={() => deleteComment.mutate(c.id)} />
            ))}
            {user && (
              <form onSubmit={handleComment} className="flex gap-2">
                <Input
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  placeholder="Write a comment…"
                  maxLength={1000}
                  className="h-9"
                />
                <Button type="submit" size="icon" className="h-9 w-9 shrink-0" disabled={!commentText.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CommentRow({ comment, onDelete }: { comment: { id: string; user_id: string; content: string; created_at: string }, onDelete: () => void }) {
  const { user } = useAuth();
  const { data: author } = useQuery({
    queryKey: ['profile', comment.user_id],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('full_name, avatar_url')
        .eq('user_id', comment.user_id).maybeSingle();
      return data;
    },
  });
  return (
    <div className="flex items-start gap-2.5 group">
      <Avatar className="h-7 w-7 shrink-0">
        <AvatarImage src={author?.avatar_url || undefined} />
        <AvatarFallback className="text-[10px]">{(author?.full_name || comment.user_id).slice(0,2).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="flex-1 rounded-2xl bg-muted/60 px-3 py-2 text-sm">
        <div className="flex items-center justify-between gap-2">
          <Link to={`/profile/${comment.user_id}`} className="font-semibold text-xs hover:text-primary">
            {author?.full_name || 'Anonymous'}
          </Link>
          {user?.id === comment.user_id && (
            <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 text-xs text-muted-foreground hover:text-destructive">
              Delete
            </button>
          )}
        </div>
        <p className="mt-0.5 text-foreground/90 leading-snug whitespace-pre-wrap">{comment.content}</p>
      </div>
    </div>
  );
}
