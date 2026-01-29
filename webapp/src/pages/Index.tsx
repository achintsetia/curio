import { TopNavBar } from '@/components/layout/TopNavBar';
import { CategorySidebar } from '@/components/layout/CategorySidebar';
import { ArticleFeed } from '@/components/articles/ArticleFeed';

const Index = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <TopNavBar />
      <div className="flex flex-1">
        <CategorySidebar />
        <main className="flex flex-1 flex-col">
          <ArticleFeed />
        </main>
      </div>
    </div>
  );
};

export default Index;
