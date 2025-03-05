export interface Feed {
  id: string;
  title: string;
  desc: string;
  link: string;
  description: string;
  tags: string[];
  unread_count: number;
  cron?: string;
  suspended?: boolean;
}

export interface Item {
  id: string;
  feed_id: string;
  title: string;
  content: string;
  description: string;
  link: string;
  guid: string;
  pub_date?: string;
  image: string;
  read: boolean;
  starred: boolean;
  liked: boolean;
}

export interface Pagination {
  total: number;
  page: number;
  size: number;
}

export interface ItemsResponse {
  items: Item[];
  pagination: Pagination;
}

export interface AuthState {
  token: string;
  isAuthenticated: boolean;
  authRequired: boolean;
}

export interface LoginResponse {
  token: string;
  auth_required: boolean;
}
