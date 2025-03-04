import { Feed, Item, ItemsResponse } from '../types';
import { getAuthHeaders } from './authService';
import { fetchClient } from './fetchClient';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:7766';

interface FetchItemsParams {
  feed_id: string;
  unread?: boolean;
  starred?: boolean;
  liked?: boolean;
  today?: boolean;
  refresh?: boolean;
  page?: number;
  size?: number;
}

// 获取所有 feeds
export const fetchFeeds = async (): Promise<Feed[]> => {
  const data = await fetchClient<{ feeds: Feed[] }>('/feeds', {
    headers: getAuthHeaders()
  });
  return data.feeds;
};

// 添加新 feed
export const addFeed = async (url: string, cron: string, desc?: string): Promise<Feed> => {
  const data = await fetchClient<{ feed: Feed }>('/feed', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify({ url, cron, desc }),
  });
  return data.feed;
};

// 删除 feed
export const deleteFeed = async (feedId: string): Promise<boolean> => {
  try {
    await fetchClient<{ success: boolean }>(`/feed/${feedId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return true;
  } catch (error) {
    console.error('Failed to delete feed:', error);
    return false;
  }
};

// 获取 feed 的 items
export const fetchItems = async (params: FetchItemsParams): Promise<ItemsResponse> => {
  const { feed_id, unread, starred, liked, today, refresh, page, size } = params;
  
  const urlParams = new URLSearchParams();
  if (unread !== undefined) urlParams.append('unread', unread.toString());
  if (starred !== undefined) urlParams.append('starred', starred.toString());
  if (liked !== undefined) urlParams.append('liked', liked.toString());
  if (today !== undefined) urlParams.append('today', today.toString());
  if (refresh !== undefined) urlParams.append('refresh', refresh.toString());
  if (page !== undefined) urlParams.append('page', page.toString());
  if (size !== undefined) urlParams.append('size', size.toString());
  
  let effectiveFeedId = feed_id;
  if (["unread", "starred", "liked", "today"].includes(feed_id)) {
    effectiveFeedId = "all";
  }
  
  const data = await fetchClient<{ items: Item[], pagination: any }>(`/feed/${effectiveFeedId}?${urlParams.toString()}`, {
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
  const data = await fetchClient<{ item: Item }>(`/item/${itemId}`, {
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
    await fetchClient<{ success: boolean }>(`/item/${itemId}`, {
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