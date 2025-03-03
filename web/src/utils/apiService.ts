import { Feed, Item } from '../types';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:7766';

interface FetchItemsParams {
  feed_id: string;
  unread?: boolean;
  starred?: boolean;
  liked?: boolean;
  today?: boolean;
  refresh?: boolean;
}

// 获取所有 feeds
export const fetchFeeds = async (): Promise<Feed[]> => {
  const response = await fetch(`${API_URL}/feeds`);
  const data = await response.json();
  return data.feeds;
};

// 添加新 feed
export const addFeed = async (url: string, cron: string, desc?: string): Promise<Feed> => {
  const response = await fetch(`${API_URL}/feed`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url, cron, desc }),
  });
  const data = await response.json();
  return data.feed;
};

// 删除 feed
export const deleteFeed = async (feedId: string): Promise<boolean> => {
  const response = await fetch(`${API_URL}/feed/${feedId}`, {
    method: 'DELETE',
  });
  return response.ok;
};

// 获取 feed 的 items
export const fetchItems = async (params: FetchItemsParams): Promise<Item[]> => {
  const { feed_id, unread, starred, liked, today, refresh } = params;
  
  const urlParams = new URLSearchParams();
  if (unread !== undefined) urlParams.append('unread', unread.toString());
  if (starred !== undefined) urlParams.append('starred', starred.toString());
  if (liked !== undefined) urlParams.append('liked', liked.toString());
  if (today !== undefined) urlParams.append('today', today.toString());
  if (refresh !== undefined) urlParams.append('refresh', refresh.toString());
  
  let effectiveFeedId = feed_id;
  if (["unread", "starred", "liked", "today"].includes(feed_id)) {
    effectiveFeedId = "all";
  }
  
  const url = `${API_URL}/feed/${effectiveFeedId}?${urlParams.toString()}`;
  const response = await fetch(url);
  const data = await response.json();
  
  // 处理 items 数据
  return data.items.map((item: Item) => ({
    ...item,
    read: item.read !== undefined ? item.read : false,
    description: item.description || ""
  }));
};

// 获取 item
export const getItem = async (itemId: string): Promise<Item> => {
  const response = await fetch(`${API_URL}/item/${itemId}`);
  const data = await response.json();
  return data.item;
};

// 更新 item 状态
export const updateItemStatus = async (
  itemId: string, 
  field: 'read' | 'starred' | 'liked', 
  value: boolean
): Promise<boolean> => {
  const response = await fetch(`${API_URL}/item/${itemId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ [field]: value }),
  });
  return response.ok;
}; 