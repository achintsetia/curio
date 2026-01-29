import { create } from 'zustand';
import { collection, doc, getDocs, setDoc, updateDoc, deleteDoc, onSnapshot, writeBatch } from 'firebase/firestore';
import { db, functions } from '@/firebase';
import { httpsCallable } from 'firebase/functions';
import { Category } from '@/types';
import { Feed, AdminNotification, mockNotifications } from '@/data/adminMockData';

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
  feedsLoading: boolean;
  subscribeToFeeds: () => () => void;
  addFeed: (feed: Omit<Feed, 'id' | 'last_runtime' | 'fresh_articles_count' | 'status'>) => Promise<void>;
  updateFeed: (id: string, updates: Partial<Feed>) => Promise<void>;
  deleteFeed: (id: string) => Promise<void>;
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
      const getCategoryTree = httpsCallable(functions, 'getCategoryTree');
      const result = await getCategoryTree();
      const data = result.data as { categories: Category[] };
      set({ categories: data.categories || [], categoriesLoading: false });
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

  feeds: [],
  feedsLoading: true,

  subscribeToFeeds: () => {
    const feedsRef = collection(db, 'feeds');
    const unsubscribe = onSnapshot(feedsRef, (snapshot) => {
      const feeds: Feed[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          name: data.name || '',
          url: data.url || '',
          type: (data.type as 'rss' | 'api') || 'rss',
          categoryId: data.categoryId || '',
          fresh_articles_count: data.fresh_articles_count || 0,
          last_runtime: data.last_runtime?.toDate?.() || null,
          status: data.status || 'unknown',
        };
      });
      set({ feeds, feedsLoading: false });
    }, (error) => {
      console.error('Error fetching feeds:', error);
      set({ feedsLoading: false });
    });
    return unsubscribe;
  },

  addFeed: async (feed) => {
    try {
      const feedsRef = collection(db, 'feeds');
      const newFeedRef = doc(feedsRef);
      await setDoc(newFeedRef, {
        ...feed,
        fresh_articles_count: 0,
        last_runtime: null,
        status: 'pending',
        createdAt: new Date(),
      });
    } catch (error) {
      console.error('Error adding feed:', error);
      throw error;
    }
  },

  updateFeed: async (id, updates) => {
    try {
      const feedRef = doc(db, 'feeds', id);
      await updateDoc(feedRef, { ...updates, updatedAt: new Date() });
    } catch (error) {
      console.error('Error updating feed:', error);
      throw error;
    }
  },

  deleteFeed: async (id) => {
    try {
      const feedRef = doc(db, 'feeds', id);
      await deleteDoc(feedRef);
    } catch (error) {
      console.error('Error deleting feed:', error);
      throw error;
    }
  },

  refreshFeed: (id) => {
    // This could trigger a cloud function in the future
    console.log('Refresh feed:', id);
  },

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

