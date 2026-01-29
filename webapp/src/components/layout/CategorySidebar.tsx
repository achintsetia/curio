import { ChevronRight, ChevronDown, Folder, FileText, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Category } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

interface CategoryItemProps {
  category: Category;
  level?: number;
}

function CategoryItem({ category, level = 0 }: CategoryItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { selectedCategoryId, setSelectedCategory, isSubscribed, sidebarOpen } = useAppStore();
  const hasSubcategories = category.subcategories && category.subcategories.length > 0;
  const isSelected = selectedCategoryId === category.id;
  const subscribed = isSubscribed(category.id);

  const handleClick = () => {
    setSelectedCategory(category.id);
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="animate-slide-in" style={{ animationDelay: `${level * 30}ms` }}>
      <button
        onClick={handleClick}
        className={cn(
          'group flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-soft',
          'hover:bg-sidebar-accent',
          isSelected
            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
            : 'text-sidebar-foreground/80',
          level > 0 && 'ml-4'
        )}
      >
        {hasSubcategories ? (
          <button
            onClick={handleToggle}
            className="flex h-4 w-4 items-center justify-center text-muted-foreground hover:text-foreground"
          >
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </button>
        ) : (
          <FileText className="h-4 w-4 text-muted-foreground" />
        )}

        <span className="flex-1 truncate text-left">{category.name}</span>

        {subscribed && sidebarOpen && (
          <span className="h-2 w-2 rounded-full bg-primary" />
        )}
      </button>

      {hasSubcategories && isExpanded && (
        <div className="mt-1 space-y-1">
          {category.subcategories?.map((sub) => (
            <CategoryItem key={sub.id} category={sub} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function CategorySidebar() {
  const { sidebarOpen, selectedCategoryId, setSelectedCategory, categories, fetchCategoriesTree, isCategoriesLoading } = useAppStore();

  useEffect(() => {
    fetchCategoriesTree();
  }, [fetchCategoriesTree]);

  const selectedCategory = selectedCategoryId
    ? categories.find((c) => c.id === selectedCategoryId) ||
    categories.flatMap((c) => c.subcategories || []).find((s) => s.id === selectedCategoryId)
    : null;

  if (!sidebarOpen) {
    return null;
  }

  return (
    <aside className="flex h-[calc(100vh-4rem)] w-64 flex-col border-r border-sidebar-border bg-sidebar">
      {/* Current selection header */}
      <div className="border-b border-sidebar-border p-4">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Reading
        </p>
        <h2 className="mt-1 font-display text-lg font-semibold text-sidebar-foreground">
          {selectedCategory?.name || 'All Articles'}
        </h2>
      </div>

      {/* Category tree */}
      <ScrollArea className="flex-1 scrollbar-thin">
        <div className="p-3">
          <Button
            variant="ghost"
            onClick={() => setSelectedCategory(null)}
            className={cn(
              'mb-2 w-full justify-start gap-2 text-sm font-medium',
              !selectedCategoryId
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-sidebar-foreground/80'
            )}
          >
            <Folder className="h-4 w-4" />
            All Articles
          </Button>

          {isCategoriesLoading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-1">
              {categories.map((category) => (
                <CategoryItem key={category.id} category={category} />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-4">
        <p className="text-xs text-muted-foreground">
          Curious, curated
        </p>
      </div>
    </aside>
  );
}
