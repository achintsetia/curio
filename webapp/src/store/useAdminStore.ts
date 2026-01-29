import { create } from 'zustand';
import { collection, doc, getDocs, setDoc, updateDoc, deleteDoc, onSnapshot, writeBatch } from 'firebase/firestore';
import { db } from '@/firebase';
import { Category } from '@/types';
import { Feed, AdminNotification, mockFeeds, mockNotifications } from '@/data/adminMockData';

interface AdminState {
  // Categories
  categories: Category[];
  categoriesLoading: boolean;
  fetchCategories: () => Promise<void>;
  subscribeToCategories: () => () => void;
  addCategory: (name: string, parentId?: string) => Promise<void>;
  updateCategory: (id: string, name: string, parentId?: string) => Promise<void>;
  deleteCategory: (id: string, parentId?: string) => Promise<void>;

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

export const useAdminStore = create<AdminState>((set, get) => ({
  categories: [],
  categoriesLoading: true,

  fetchCategories: async () => {
    set({ categoriesLoading: true });
    try {
      const categoriesRef = collection(db, 'categories');
      const snapshot = await getDocs(categoriesRef);
      const categories: Category[] = [];

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const category: Category = {
          id: docSnap.id,
          name: data.name,
          slug: data.slug || data.name.toLowerCase().replace(/\s+/g, '-'),
          subcategories: [],
        };

        // Fetch subcategories
        const subcategoriesRef = collection(db, 'categories', docSnap.id, 'subcategories');
        const subSnapshot = await getDocs(subcategoriesRef);
        category.subcategories = subSnapshot.docs.map(subDoc => ({
          id: subDoc.id,
          name: subDoc.data().name,
          slug: subDoc.data().slug || subDoc.data().name.toLowerCase().replace(/\s+/g, '-'),
        }));

        categories.push(category);
      }

      set({ categories, categoriesLoading: false });
    } catch (error) {
      console.error('Error fetching categories:', error);
      set({ categoriesLoading: false });
    }
  },

  subscribeToCategories: () => {
    const categoriesRef = collection(db, 'categories');
    const unsubscribe = onSnapshot(categoriesRef, async (snapshot) => {
      const categories: Category[] = [];

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const category: Category = {
          id: docSnap.id,
          name: data.name,
          slug: data.slug || data.name.toLowerCase().replace(/\s+/g, '-'),
          subcategories: [],
        };

        // Fetch subcategories
        const subcategoriesRef = collection(db, 'categories', docSnap.id, 'subcategories');
        const subSnapshot = await getDocs(subcategoriesRef);
        category.subcategories = subSnapshot.docs.map(subDoc => ({
          id: subDoc.id,
          name: subDoc.data().name,
          slug: subDoc.data().slug || subDoc.data().name.toLowerCase().replace(/\s+/g, '-'),
        }));

        categories.push(category);
      }

      set({ categories, categoriesLoading: false });
    });

    return unsubscribe;
  },

  addCategory: async (name, parentId) => {
    try {
      const slug = name.toLowerCase().replace(/\s+/g, '-');
      const id = `cat-${Date.now()}`;

      if (parentId) {
        // Add as subcategory
        const subCategoryRef = doc(db, 'categories', parentId, 'subcategories', id);
        await setDoc(subCategoryRef, { name, slug, createdAt: new Date() });
      } else {
        // Add as main category
        const categoryRef = doc(db, 'categories', id);
        await setDoc(categoryRef, { name, slug, createdAt: new Date() });
      }

      // Refresh categories
      await get().fetchCategories();
    } catch (error) {
      console.error('Error adding category:', error);
      throw error;
    }
  },

  updateCategory: async (id, name, parentId) => {
    try {
      const slug = name.toLowerCase().replace(/\s+/g, '-');

      if (parentId) {
        // Update subcategory
        const subCategoryRef = doc(db, 'categories', parentId, 'subcategories', id);
        await updateDoc(subCategoryRef, { name, slug, updatedAt: new Date() });
      } else {
        // Update main category
        const categoryRef = doc(db, 'categories', id);
        await updateDoc(categoryRef, { name, slug, updatedAt: new Date() });
      }

      // Refresh categories
      await get().fetchCategories();
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  },

  deleteCategory: async (id, parentId) => {
    try {
      if (parentId) {
        // Delete subcategory
        const subCategoryRef = doc(db, 'categories', parentId, 'subcategories', id);
        await deleteDoc(subCategoryRef);
      } else {
        // Delete main category and its subcategories
        const subcategoriesRef = collection(db, 'categories', id, 'subcategories');
        const subSnapshot = await getDocs(subcategoriesRef);

        const batch = writeBatch(db);
        subSnapshot.docs.forEach(subDoc => {
          batch.delete(subDoc.ref);
        });

        const categoryRef = doc(db, 'categories', id);
        batch.delete(categoryRef);

        await batch.commit();
      }

      // Refresh categories
      await get().fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  },

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

