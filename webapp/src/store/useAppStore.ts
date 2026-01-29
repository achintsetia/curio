import { create } from 'zustand';
import { Article, User } from '@/types';
import { mockArticles, mockUser } from '@/data/mockData';

interface AppState {
  // User
  user: User | null;
  isAuthenticated: boolean;
  
  // Navigation
  selectedCategoryId: string | null;
  sidebarOpen: boolean;
  
  // Articles
  articles: Article[];
  
  // Actions
  login: () => void;
  logout: () => void;
  setSelectedCategory: (id: string | null) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  markAsRead: (articleId: string) => void;
  markAsUnread: (articleId: string) => void;
  toggleSubscription: (categoryId: string) => void;
  isSubscribed: (categoryId: string) => boolean;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  user: null,
  isAuthenticated: false,
  selectedCategoryId: null,
  sidebarOpen: true,
  articles: mockArticles,
  
  // Actions
  login: () => set({ user: mockUser, isAuthenticated: true }),
  
  logout: () => set({ user: null, isAuthenticated: false }),
  
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
