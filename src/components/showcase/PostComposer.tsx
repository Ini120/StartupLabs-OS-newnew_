import { useState } from 'react';
import { ImageIcon, Send, X, Rocket } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useCreatePost } from '@/hooks/use-social-feed';
import { useMyStartups } from '@/hooks/use-startups';

export function PostComposer() {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showImage, setShowImage] = useState(false);
  const [startupId, setStartupId] = useState<string>('');
  const { data: myStartups = [] } = useMyStartups();
  const createPost = useCreatePost();

  if (!user) return null;
  const initials = user.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() ?? '?';

  const submit = async () => {
    if (!content.trim() && !imageUrl.trim()) return;
    await createPost.mutateAsync({
      content: content.trim(),
      image_url: imageUrl.trim() || undefined,
      startup_id: startupId || null,
    });
    setContent(''); setImageUrl(''); setShowImage(false); setStartupId('');
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10 ring-2 ring-primary/10">
            {user.avatar_url && <AvatarImage src={user.avatar_url} />}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <Textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Share an update, milestone, or insight…"
            maxLength={2000}
            className="resize-none border-0 bg-muted/40 focus-visible:ring-1 min-h-[60px]"
          />
        </div>

        {showImage && (
          <div className="flex gap-2">
            <Input
              placeholder="Paste image URL"
              value={imageUrl}
              onChange={e => setImageUrl(e.target.value)}
              className="h-9"
            />
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => { setShowImage(false); setImageUrl(''); }}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {imageUrl && showImage && (
          <img src={imageUrl} alt="" className="w-full max-h-64 object-cover rounded-lg border" />
        )}

        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost" size="sm"
              className="gap-1.5 h-8"
              onClick={() => setShowImage(s => !s)}
            >
              <ImageIcon className="h-4 w-4" /> Image
            </Button>
            {myStartups.length > 0 && (
              <Select value={startupId || 'none'} onValueChange={v => setStartupId(v === 'none' ? '' : v)}>
                <SelectTrigger className="h-8 text-xs w-[160px]">
                  <Rocket className="h-3 w-3 mr-1" />
                  <SelectValue placeholder="Tag a startup" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No startup</SelectItem>
                  {myStartups.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <Button
            size="sm"
            disabled={(!content.trim() && !imageUrl.trim()) || createPost.isPending}
            onClick={submit}
            className="gap-1.5"
          >
            <Send className="h-3.5 w-3.5" />
            Post
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
