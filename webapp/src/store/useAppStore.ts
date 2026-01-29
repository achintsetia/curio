import { create } from 'zustand';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Article, User } from '@/types';
import { mockArticles } from '@/data/mockData';
import { auth, db, functions } from '@/firebase';
import { httpsCallable } from 'firebase/functions';
import { Category } from '@/types';

const googleProvider = new GoogleAuthProvider();

interface AppState {
  // User
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Navigation
  selectedCategoryId: string | null;
  sidebarOpen: boolean;

  // Articles
  // Articles
  articles: Article[];

  // Categories
  categories: Category[];
  isCategoriesLoading: boolean;
  fetchCategoriesTree: () => Promise<void>;

  // Actions
  login: () => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  initializeAuth: () => () => void;
  setSelectedCategory: (id: string | null) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  markAsRead: (articleId: string) => void;
  markAsUnread: (articleId: string) => void;
  toggleSubscription: (categoryId: string) => void;
  isSubscribed: (categoryId: string) => boolean;
}

// Helper function to create or get user profile from Firestore
async function getOrCreateUserProfile(firebaseUser: {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}): Promise<User> {
  const email = firebaseUser.email || '';
  const userProfileRef = doc(db, 'user_profile', email);

  try {
    const userProfileSnap = await getDoc(userProfileRef);

    if (userProfileSnap.exists()) {
      // User profile exists, return it
      const profileData = userProfileSnap.data();
      return {
        id: firebaseUser.uid,
        name: profileData.name || firebaseUser.displayName || 'User',
        email: email,
        avatarUrl: profileData.avatarUrl || firebaseUser.photoURL || '',
        subscribedCategories: profileData.subscribedCategories || [],
        is_admin: profileData.is_admin || false,
      };
    } else {
      // Create new user profile
      const newProfile: User = {
        id: firebaseUser.uid,
        name: firebaseUser.displayName || 'User',
        email: email,
        avatarUrl: firebaseUser.photoURL || '',
        subscribedCategories: [],
        is_admin: false,
      };

      await setDoc(userProfileRef, {
        name: newProfile.name,
        email: newProfile.email,
        avatarUrl: newProfile.avatarUrl,
        subscribedCategories: newProfile.subscribedCategories,
        is_admin: newProfile.is_admin,
        createdAt: new Date(),
      });

      return newProfile;
    }
  } catch (error) {
    console.error('Error getting/creating user profile:', error);
    // Return a basic user object if Firestore fails
    return {
      id: firebaseUser.uid,
      name: firebaseUser.displayName || 'User',
      email: email,
      avatarUrl: firebaseUser.photoURL || '',
      subscribedCategories: [],
      is_admin: false,
    };
  }
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  user: null,
  isAuthenticated: false,
  isLoading: true,
  selectedCategoryId: null,
  sidebarOpen: true,
  articles: mockArticles,
  categories: [],
  isCategoriesLoading: false,

  fetchCategoriesTree: async () => {
    set({ isCategoriesLoading: true });
    try {
      const getCategoryTree = httpsCallable(functions, 'getCategoryTree');
      const result = await getCategoryTree();
      const data = result.data as { categories: Category[] };
      set({ categories: data.categories || [], isCategoriesLoading: false });
    } catch (error) {
      console.error('Error fetching categories tree:', error);
      set({ categories: [], isCategoriesLoading: false });
    }
  },

  // Actions
  login: async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      const user = await getOrCreateUserProfile(firebaseUser);
      set({ user, isAuthenticated: true });
    } catch (error) {
      console.error('Google Sign-in error:', error);
    }
  },

  logout: async () => {
    try {
      await signOut(auth);
      set({ user: null, isAuthenticated: false });
    } catch (error) {
      console.error('Sign-out error:', error);
    }
  },

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  setLoading: (loading) => set({ isLoading: loading }),

  // Initialize auth state listener for persistence
  initializeAuth: () => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const user = await getOrCreateUserProfile(firebaseUser);
        set({ user, isAuthenticated: true, isLoading: false });
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    });
    return unsubscribe;
  },

  setSelectedCategory: (id) => set({ selectedCategoryId: id }),

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  markAsRead: (articleId) =>
    set((state) => ({
      articles: state.articles.map((a) =>
        a.id === articleId ? { ...a, isRead: true } : a
      ),
    })),

  markAsUnread: (articleId) =>
    set((state) => ({
      articles: state.articles.map((a) =>
        a.id === articleId ? { ...a, isRead: false } : a
      ),
    })),

  toggleSubscription: (categoryId) =>
    set((state) => {
      if (!state.user) return state;
      const isCurrentlySubscribed = state.user.subscribedCategories.includes(categoryId);
      return {
        user: {
          ...state.user,
          subscribedCategories: isCurrentlySubscribed
            ? state.user.subscribedCategories.filter((id) => id !== categoryId)
            : [...state.user.subscribedCategories, categoryId],
        },
      };
    }),

  isSubscribed: (categoryId) => {
    const user = get().user;
    return user?.subscribedCategories.includes(categoryId) ?? false;
  },
}));

