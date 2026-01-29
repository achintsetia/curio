import { Category, Article } from '@/types';

export interface Feed {
  id: string;
  name: string;
  url: string;
  type: 'rss' | 'api';
  categoryId: string;
  enabled: boolean;
  lastRefreshed: Date | null;
  articleCount: number;
}

export interface AdminNotification {
  id: string;
  title: string;
  body: string;
  targetCategoryId: string | null;
  sentAt: Date;
  recipientCount: number;
}

export const mockFeeds: Feed[] = [
  {
    id: 'feed-1',
    name: 'TechCrunch AI',
    url: 'https://techcrunch.com/category/ai/feed/',
    type: 'rss',
    categoryId: 'tech-ai',
    enabled: true,
    lastRefreshed: new Date('2025-01-29T08:00:00'),
    articleCount: 45,
  },
  {
    id: 'feed-2',
    name: 'Dev.to Web Dev',
    url: 'https://dev.to/feed/tag/webdev',
    type: 'rss',
    categoryId: 'tech-web',
    enabled: true,
    lastRefreshed: new Date('2025-01-29T07:30:00'),
    articleCount: 120,
  },
  {
    id: 'feed-3',
    name: 'Space.com RSS',
    url: 'https://www.space.com/feeds/all',
    type: 'rss',
    categoryId: 'sci-space',
    enabled: true,
    lastRefreshed: new Date('2025-01-29T06:00:00'),
    articleCount: 89,
  },
  {
    id: 'feed-4',
    name: 'Bloomberg Markets API',
    url: 'https://api.bloomberg.com/markets',
    type: 'api',
    categoryId: 'biz-markets',
    enabled: false,
    lastRefreshed: new Date('2025-01-28T12:00:00'),
    articleCount: 234,
  },
  {
    id: 'feed-5',
    name: 'Reuters World News',
    url: 'https://www.reuters.com/rssFeed/worldNews',
    type: 'rss',
    categoryId: 'world',
    enabled: true,
    lastRefreshed: new Date('2025-01-29T05:00:00'),
    articleCount: 167,
  },
];

export const mockNotifications: AdminNotification[] = [
  {
    id: 'notif-1',
    title: 'Breaking: GPT-5 Released',
    body: 'OpenAI has just announced GPT-5 with revolutionary capabilities. Check out our coverage in the AI section.',
    targetCategoryId: 'tech-ai',
    sentAt: new Date('2025-01-29T08:30:00'),
    recipientCount: 1250,
  },
  {
    id: 'notif-2',
    title: 'Weekly Science Digest',
    body: 'Your weekly roundup of the most important science news is now available.',
    targetCategoryId: 'science',
    sentAt: new Date('2025-01-28T09:00:00'),
    recipientCount: 890,
  },
  {
    id: 'notif-3',
    title: 'Market Alert: Fed Decision',
    body: 'The Federal Reserve has announced a major policy change. Read the full analysis.',
    targetCategoryId: 'biz-markets',
    sentAt: new Date('2025-01-27T16:30:00'),
    recipientCount: 456,
  },
];
