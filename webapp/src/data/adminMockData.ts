import { Category, Article } from '@/types';

export interface Feed {
  id: string;
  name: string;
  url: string;
  type: 'rss' | 'api';
  categoryId?: string;
  fresh_articles_count: number;
  last_runtime: Date | null;
  status: string;
}

export interface AdminNotification {
  id: string;
  title: string;
  body: string;
  targetCategoryId: string | null;
  sentAt: Date;
  recipientCount: number;
}

// Feeds are now fetched from Firestore

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
