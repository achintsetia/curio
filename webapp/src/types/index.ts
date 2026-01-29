export interface Category {
  id: string;
  name: string;
  slug: string;
  subcategories?: Category[];
}

export interface Article {
  id: string;
  title: string;
  summary: string;
  url: string;
  publishedAt: Date;
  categoryId: string;
  source: string;
  isRead: boolean;
  imageUrl?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  subscribedCategories: string[];
  is_admin: boolean;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  categoryId?: string;
  articleId?: string;
  createdAt: Date;
  isRead: boolean;
}
