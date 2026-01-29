import { useMemo } from 'react';
import { Inbox, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { getArticlesByCategory } from '@/data/mockData';
import { ArticleCard } from './ArticleCard';
import { ScrollArea } from '@/components/ui/scroll-area';

export function ArticleFeed() {
  const { selectedCategoryId, articles } = useAppStore();

  const filteredArticles = useMemo(() => {
    const categoryArticles = getArticlesByCategory(selectedCategoryId);
    // Get updated read status from store
    return categoryArticles.map((article) => {
      const storeArticle = articles.find((a) => a.id === article.id);
      return storeArticle || article;
    });
  }, [selectedCategoryId, articles]);

  const unreadArticles = filteredArticles.filter((a) => !a.isRead);
  const readArticles = filteredArticles.filter((a) => a.isRead);

  if (filteredArticles.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
        <Inbox className="mb-4 h-12 w-12 text-muted-foreground/50" />
        <h3 className="font-display text-lg font-medium text-foreground">
          No articles yet
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Articles in this category will appear here
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 scrollbar-thin">
      <div className="mx-auto max-w-3xl p-6">
        {/* Unread Section */}
        {unreadArticles.length > 0 && (
          <section className="mb-8">
            <div className="mb-4 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Unread ({unreadArticles.length})
              </h2>
            </div>
            <div className="space-y-4">
              {unreadArticles.map((article, index) => (
                <div
                  key={article.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <ArticleCard article={article} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Read Section */}
        {readArticles.length > 0 && (
          <section>
            <div className="mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Read ({readArticles.length})
              </h2>
            </div>
            <div className="space-y-3">
              {readArticles.map((article, index) => (
                <div
                  key={article.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${(unreadArticles.length + index) * 50}ms` }}
                >
                  <ArticleCard article={article} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* All read state */}
        {unreadArticles.length === 0 && readArticles.length > 0 && (
          <div className="mb-6 rounded-lg border border-border bg-muted/30 p-4 text-center">
            <CheckCircle2 className="mx-auto mb-2 h-6 w-6 text-primary" />
            <p className="text-sm font-medium text-foreground">All caught up!</p>
            <p className="text-xs text-muted-foreground">
              You've read all articles in this category
            </p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
