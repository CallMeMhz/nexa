import { Feed, Item, ItemsResponse, Tag } from '../types';
import { getAuthHeaders } from './authService';
import { fetchClient } from './fetchClient';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

interface FetchItemsParams {
  feed_id: string;
  tags?: string[];
  unread?: boolean;
  starred?: boolean;
  liked?: boolean;
  today?: boolean;
  refresh?: boolean;
  page?: number;
  size?: number;
  q?: string;
}

export const fetchFeeds = async (): Promise<{ feeds: Feed[], tags: Tag[] }> => {
  const data = await fetchClient<{ feeds: Feed[], tags: Tag[] }>(`${API_URL}/api/feeds`, {
    headers: getAuthHeaders()
  });
  return data;
};

// 添加新 feed
export const addFeed = async (url: string, cron: string, desc?: string, tags?: string[]): Promise<Feed> => {
  const data = await fetchClient<{ feed: Feed }>(`${API_URL}/api/feed`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify({ url, cron, desc, tags }),
  });
  return data.feed;
};

// 删除 feed
export const deleteFeed = async (feedId: string): Promise<boolean> => {
  try {
    await fetchClient<{ success: boolean }>(`${API_URL}/api/feed/${feedId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return true;
  } catch (error) {
    console.error('Failed to delete feed:', error);
    return false;
  }
};

export const fetchTags = async (): Promise<string[]> => {
  const data = await fetchClient<{ tags: string[] }>(`${API_URL}/api/tags`, {
    headers: getAuthHeaders()
  });
  return data.tags;
};

export const fetchItems = async (params: FetchItemsParams): Promise<ItemsResponse> => {
  const { feed_id, tags, unread, starred, liked, today, refresh, page, size, q } = params;
  
  const urlParams = new URLSearchParams();
  if (tags && tags.length > 0) tags.forEach(tag => urlParams.append('tags', tag));
  if (unread !== undefined) urlParams.append('unread', unread.toString());
  if (starred !== undefined) urlParams.append('starred', starred.toString());
  if (liked !== undefined) urlParams.append('liked', liked.toString());
  if (today !== undefined) urlParams.append('today', today.toString());
  if (refresh !== undefined) urlParams.append('refresh', refresh.toString());
  if (page !== undefined) urlParams.append('page', page.toString());
  if (size !== undefined) urlParams.append('size', size.toString());
  if (q !== undefined && q !== '') urlParams.append('q', q);
  
  let effectiveFeedId = feed_id;
  if (["unread", "starred", "liked", "today"].includes(feed_id)) {
    effectiveFeedId = "all";
  }
  
  const data = await fetchClient<{ items: Item[], pagination: any }>(`${API_URL}/api/feed/${effectiveFeedId}?${urlParams.toString()}`, {
    headers: getAuthHeaders()
  });
  
  // 处理 items 数据
  const items = data.items.map((item: Item) => ({
    ...item,
    read: item.read !== undefined ? item.read : false,
    description: item.description || ""
  }));

  return {
    items,
    pagination: data.pagination || { total: items.length, page: 1, size: items.length }
  };
};

// 搜索 items
export const searchItems = async (query: string, page: number = 1, size: number = 10): Promise<ItemsResponse> => {
  const urlParams = new URLSearchParams();
  urlParams.append('q', query);
  urlParams.append('page', page.toString());
  urlParams.append('size', size.toString());
  
  const data = await fetchClient<{ items: Item[], pagination: any }>(`${API_URL}/api/search?${urlParams.toString()}`, {
    headers: getAuthHeaders()
  });
  
  // 处理 items 数据
  const items = data.items.map((item: Item) => ({
    ...item,
    read: item.read !== undefined ? item.read : false,
    description: item.description || ""
  }));

  return {
    items,
    pagination: data.pagination || { total: items.length, page: 1, size: items.length }
  };
};

// 获取 item
export const getItem = async (itemId: string): Promise<Item> => {
  const data = await fetchClient<{ item: Item }>(`${API_URL}/api/item/${itemId}`, {
    headers: getAuthHeaders()
  });
  return data.item;
};

// 更新 item 状态
export const updateItemStatus = async (
  itemId: string, 
  field: 'read' | 'starred' | 'liked', 
  value: boolean
): Promise<boolean> => {
  try {
    await fetchClient<{ success: boolean }>(`${API_URL}/api/item/${itemId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ [field]: value }),
    });
    return true;
  } catch (error) {
    console.error(`Failed to update ${field} status:`, error);
    return false;
  }
};

// 更新 feed
export const updateFeed = async (feedId: string, url: string, cron: string, desc?: string, tags?: string[], suspended?: boolean): Promise<Feed> => {
  const data = await fetchClient<{ feed: Feed }>(`${API_URL}/api/feed/${feedId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify({ url, cron, desc, tags, suspended }),
  });
  return data.feed;
}; 