import { create } from 'zustand';
import { Category } from '@/types';
import { mockCategories } from '@/data/mockData';
import { Feed, AdminNotification, mockFeeds, mockNotifications } from '@/data/adminMockData';

interface AdminState {
  // Categories
  categories: Category[];
  addCategory: (name: string, parentId?: string) => void;
  updateCategory: (id: string, name: string) => void;
  deleteCategory: (id: string) => void;

  // Feeds
  feeds: Feed[];
  addFeed: (feed: Omit<Feed, 'id' | 'lastRefreshed' | 'articleCount'>) => void;
  updateFeed: (id: string, updates: Partial<Feed>) => void;
  deleteFeed: (id: string) => void;
  toggleFeed: (id: string) => void;
  refreshFeed: (id: string) => void;

  // Notifications
  notifications: AdminNotification[];
  sendNotification: (notification: Omit<AdminNotification, 'id' | 'sentAt' | 'recipientCount'>) => void;
}

export const useAdminStore = create<AdminState>((set) => ({
  categories: mockCategories,

  addCategory: (name, parentId) =>
    set((state) => {
      const newCategory: Category = {
        id: `cat-${Date.now()}`,
        name,
        slug: name.toLowerCase().replace(/\s+/g, '-'),
      };

      if (parentId) {
        return {
          categories: state.categories.map((cat) =>
            cat.id === parentId
              ? { ...cat, subcategories: [...(cat.subcategories || []), newCategory] }
              : cat
          ),
        };
      }

      return { categories: [...state.categories, { ...newCategory, subcategories: [] }] };
    }),

  updateCategory: (id, name) =>
    set((state) => ({
      categories: state.categories.map((cat) => {
        if (cat.id === id) {
          return { ...cat, name, slug: name.toLowerCase().replace(/\s+/g, '-') };
        }
        return {
          ...cat,
          subcategories: cat.subcategories?.map((sub) =>
            sub.id === id ? { ...sub, name, slug: name.toLowerCase().replace(/\s+/g, '-') } : sub
          ),
        };
      }),
    })),

  deleteCategory: (id) =>
    set((state) => ({
      categories: state.categories
        .filter((cat) => cat.id !== id)
        .map((cat) => ({
          ...cat,
          subcategories: cat.subcategories?.filter((sub) => sub.id !== id),
        })),
    })),

  feeds: mockFeeds,

  addFeed: (feed) =>
    set((state) => ({
      feeds: [
        ...state.feeds,
        {
          ...feed,
          id: `feed-${Date.now()}`,
          lastRefreshed: null,
          articleCount: 0,
        },
      ],
    })),

  updateFeed: (id, updates) =>
    set((state) => ({
      feeds: state.feeds.map((feed) =>
        feed.id === id ? { ...feed, ...updates } : feed
      ),
    })),

  deleteFeed: (id) =>
    set((state) => ({
      feeds: state.feeds.filter((feed) => feed.id !== id),
    })),

  toggleFeed: (id) =>
    set((state) => ({
      feeds: state.feeds.map((feed) =>
        feed.id === id ? { ...feed, enabled: !feed.enabled } : feed
      ),
    })),

  refreshFeed: (id) =>
    set((state) => ({
      feeds: state.feeds.map((feed) =>
        feed.id === id ? { ...feed, lastRefreshed: new Date() } : feed
      ),
    })),

  notifications: mockNotifications,

  sendNotification: (notification) =>
    set((state) => ({
      notifications: [
        {
          ...notification,
          id: `notif-${Date.now()}`,
          sentAt: new Date(),
          recipientCount: Math.floor(Math.random() * 1000) + 100,
        },
        ...state.notifications,
      ],
    })),
}));
