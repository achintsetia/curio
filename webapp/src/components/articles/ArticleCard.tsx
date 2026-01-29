import { ExternalLink, Check, Clock, Share2, RotateCcw } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Article } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ArticleCardProps {
  article: Article;
}

export function ArticleCard({ article }: ArticleCardProps) {
  const { markAsRead, markAsUnread } = useAppStore();

  const handleMarkAsRead = () => {
    markAsRead(article.id);
    toast.success('Marked as read');
  };

  const handleMarkAsUnread = () => {
    markAsUnread(article.id);
    toast.success('Marked as unread');
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(article.url);
      toast.success('Link copied to clipboard');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const timeAgo = formatDistanceToNow(article.publishedAt, { addSuffix: true });
  const fullDate = format(article.publishedAt, 'PPpp');

  return (
    <article
      className={cn(
        'group relative rounded-xl border border-border p-5 transition-soft',
        article.isRead
          ? 'bg-muted/30 opacity-75 hover:opacity-100'
          : 'border-l-4 border-l-primary bg-card shadow-card hover:shadow-card-hover'
      )}
    >
      {/* Unread indicator */}
      {!article.isRead && (
        <div className="absolute -left-0.5 top-6 h-2 w-2 rounded-full bg-primary" />
      )}

      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-4">
        <div className="flex-1">
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group/link inline-flex items-start gap-2"
          >
            <h3
              className={cn(
                'font-display text-lg leading-snug transition-soft',
                article.isRead
                  ? 'font-medium text-foreground/80'
                  : 'font-semibold text-foreground',
                'group-hover/link:text-primary'
              )}
            >
              {article.title}
            </h3>
            <ExternalLink className="mt-1 h-4 w-4 flex-shrink-0 text-muted-foreground opacity-0 transition-soft group-hover/link:opacity-100" />
          </a>
        </div>
      </div>

      {/* Summary */}
      <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
        {article.summary}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="font-medium text-foreground/70">{article.source}</span>
          <span className="h-1 w-1 rounded-full bg-border" />
          <span className="flex items-center gap-1" title={fullDate}>
            <Clock className="h-3 w-3" />
            {timeAgo}
          </span>
        </div>

        <div className="flex items-center gap-1 opacity-0 transition-soft group-hover:opacity-100">
          {article.isRead ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAsUnread}
              className="h-8 gap-1.5 text-xs"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Mark unread
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAsRead}
              className="h-8 gap-1.5 text-xs"
            >
              <Check className="h-3.5 w-3.5" />
              Mark read
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleShare}
            className="h-8 w-8"
          >
            <Share2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </article>
  );
}
