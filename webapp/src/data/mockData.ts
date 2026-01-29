import { Category, Article, User } from '@/types';

export const mockCategories: Category[] = [
  {
    id: 'tech',
    name: 'Technology',
    slug: 'technology',
    subcategories: [
      { id: 'tech-ai', name: 'Artificial Intelligence', slug: 'ai' },
      { id: 'tech-web', name: 'Web Development', slug: 'web-dev' },
      { id: 'tech-mobile', name: 'Mobile', slug: 'mobile' },
    ],
  },
  {
    id: 'business',
    name: 'Business',
    slug: 'business',
    subcategories: [
      { id: 'biz-startups', name: 'Startups', slug: 'startups' },
      { id: 'biz-finance', name: 'Finance', slug: 'finance' },
      { id: 'biz-markets', name: 'Markets', slug: 'markets' },
    ],
  },
  {
    id: 'science',
    name: 'Science',
    slug: 'science',
    subcategories: [
      { id: 'sci-space', name: 'Space', slug: 'space' },
      { id: 'sci-health', name: 'Health', slug: 'health' },
      { id: 'sci-environment', name: 'Environment', slug: 'environment' },
    ],
  },
  {
    id: 'culture',
    name: 'Culture',
    slug: 'culture',
    subcategories: [
      { id: 'cult-books', name: 'Books', slug: 'books' },
      { id: 'cult-film', name: 'Film & TV', slug: 'film-tv' },
      { id: 'cult-music', name: 'Music', slug: 'music' },
    ],
  },
  {
    id: 'world',
    name: 'World',
    slug: 'world',
    subcategories: [
      { id: 'world-politics', name: 'Politics', slug: 'politics' },
      { id: 'world-economics', name: 'Economics', slug: 'economics' },
    ],
  },
];

export const mockArticles: Article[] = [
  {
    id: '1',
    title: 'OpenAI Announces GPT-5 with Revolutionary Reasoning Capabilities',
    summary: 'The latest iteration of the GPT series demonstrates unprecedented reasoning abilities, marking a significant milestone in artificial intelligence development.',
    url: 'https://example.com/gpt5',
    publishedAt: new Date('2025-01-29T08:00:00'),
    categoryId: 'tech-ai',
    source: 'TechCrunch',
    isRead: false,
  },
  {
    id: '2',
    title: 'React 20 Introduces Server Components as Default',
    summary: 'The new React version makes server components the default rendering strategy, promising faster page loads and improved SEO.',
    url: 'https://example.com/react20',
    publishedAt: new Date('2025-01-29T07:30:00'),
    categoryId: 'tech-web',
    source: 'Dev.to',
    isRead: false,
  },
  {
    id: '3',
    title: 'SpaceX Successfully Lands Starship on Mars Surface',
    summary: 'Historic moment as the first crewed spacecraft from Earth touches down on the Martian surface, opening new chapter in space exploration.',
    url: 'https://example.com/starship-mars',
    publishedAt: new Date('2025-01-29T06:00:00'),
    categoryId: 'sci-space',
    source: 'Space.com',
    isRead: false,
  },
  {
    id: '4',
    title: 'Stripe Acquires Major Fintech Startup for $2.8 Billion',
    summary: 'The payment giant expands its portfolio with a strategic acquisition aimed at strengthening its position in emerging markets.',
    url: 'https://example.com/stripe-acquisition',
    publishedAt: new Date('2025-01-28T15:00:00'),
    categoryId: 'biz-startups',
    source: 'Bloomberg',
    isRead: true,
  },
  {
    id: '5',
    title: 'Climate Summit Reaches Historic Agreement on Emissions',
    summary: 'World leaders commit to unprecedented carbon reduction targets, signaling a major shift in global environmental policy.',
    url: 'https://example.com/climate-summit',
    publishedAt: new Date('2025-01-28T12:00:00'),
    categoryId: 'sci-environment',
    source: 'The Guardian',
    isRead: true,
  },
  {
    id: '6',
    title: 'New Study Reveals Benefits of Intermittent Fasting',
    summary: 'Research from Stanford University shows significant health improvements in participants following structured fasting protocols.',
    url: 'https://example.com/fasting-study',
    publishedAt: new Date('2025-01-28T10:00:00'),
    categoryId: 'sci-health',
    source: 'Science Daily',
    isRead: false,
  },
  {
    id: '7',
    title: 'Apple Vision Pro 2 Launches with Neural Interface',
    summary: 'The next generation of spatial computing introduces subtle neural feedback for more immersive experiences.',
    url: 'https://example.com/vision-pro-2',
    publishedAt: new Date('2025-01-28T09:00:00'),
    categoryId: 'tech',
    source: 'The Verge',
    isRead: false,
  },
  {
    id: '8',
    title: 'Federal Reserve Signals Interest Rate Cut in March',
    summary: 'Markets rally as central bank indicates accommodative monetary policy ahead amid cooling inflation data.',
    url: 'https://example.com/fed-rates',
    publishedAt: new Date('2025-01-27T16:00:00'),
    categoryId: 'biz-markets',
    source: 'Reuters',
    isRead: true,
  },
];

export const mockUser: User = {
  id: 'user-1',
  name: 'Alex Chen',
  email: 'alex.chen@example.com',
  avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=96&h=96&fit=crop&crop=face',
  subscribedCategories: ['tech', 'tech-ai', 'sci-space'],
};

export const getAllCategoryIds = (): string[] => {
  const ids: string[] = [];
  mockCategories.forEach((cat) => {
    ids.push(cat.id);
    cat.subcategories?.forEach((sub) => ids.push(sub.id));
  });
  return ids;
};

export const getCategoryById = (id: string): Category | undefined => {
  for (const cat of mockCategories) {
    if (cat.id === id) return cat;
    const sub = cat.subcategories?.find((s) => s.id === id);
    if (sub) return sub;
  }
  return undefined;
};

export const getArticlesByCategory = (categoryId: string | null): Article[] => {
  if (!categoryId) return mockArticles;
  
  // Find if it's a parent category
  const parentCat = mockCategories.find((c) => c.id === categoryId);
  if (parentCat) {
    const subIds = parentCat.subcategories?.map((s) => s.id) || [];
    return mockArticles.filter(
      (a) => a.categoryId === categoryId || subIds.includes(a.categoryId)
    );
  }
  
  return mockArticles.filter((a) => a.categoryId === categoryId);
};
