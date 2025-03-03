import { useState, useEffect, useCallback } from 'react';
import { Feed, Item, Pagination } from '../types';
import * as apiService from '../utils/apiService';

export const useFeedManager = () => {
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, size: 10 });
  const [selectedFeed, setSelectedFeed] = useState<Feed>({id: "all", title: "All"} as Feed);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 获取所有 feeds
  const fetchFeeds = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedFeeds = await apiService.fetchFeeds();
      setFeeds(fetchedFeeds);
    } catch (error) {
      console.error('Failed to fetch feeds:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 获取 items
  const fetchItems = useCallback(async (params: {
    feed_id: string,
    unread?: boolean,
    starred?: boolean,
    liked?: boolean,
    today?: boolean,
    refresh?: boolean,
    page?: number,
    size?: number
  }) => {
    setIsLoading(true);
    try {
      const response = await apiService.fetchItems(params);
      setItems(response.items);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Failed to fetch items:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 添加新 feed
  const addFeed = useCallback(async (url: string, cron: string, desc?: string) => {
    try {
      const newFeed = await apiService.addFeed(url, cron, desc);
      await fetchFeeds();
      setSelectedFeed(newFeed);
    } catch (error) {
      console.error('Failed to add feed:', error);
      throw error;
    }
  }, [fetchFeeds]);

  // 删除 feed
  const deleteFeed = useCallback(async (feedId: string) => {
    try {
      const success = await apiService.deleteFeed(feedId);
      if (success) {
        // 如果当前选中的是被删除的 feed，则切换到 "all"
        if (selectedFeed.id === feedId) {
          setSelectedFeed({id: "all", title: "All"} as Feed);
        }
        await fetchFeeds();
      }
      return success;
    } catch (error) {
      console.error('Failed to delete feed:', error);
      return false;
    }
  }, [fetchFeeds, selectedFeed]);

  // 更新 item 状态
  const updateItemStatus = useCallback(async (item: Item, field: 'read' | 'starred' | 'liked', value: boolean) => {
    try {
      // 先更新本地状态，提供即时反馈
      const updatedItems = items.map(i => 
        i.id === item.id ? { ...i, [field]: value } : i
      );
      setItems(updatedItems);
      
      // 如果当前选中的 item 被更新，也更新它
      if (selectedItem && selectedItem.id === item.id) {
        setSelectedItem({ ...selectedItem, [field]: value });
      }
      
      // 发送更新到服务器
      const success = await apiService.updateItemStatus(item.id, field, value);
      
      // 如果是更新已读状态，还需要更新 feeds 的未读计数
      if (field === 'read' && success) {
        const updatedFeeds = feeds.map(feed => 
          (feed.id === item.feed_id || feed.id === "unread") ?
          { ...feed, unread_count: feed.unread_count - (value ? 1 : -1) } : feed
        );
        setFeeds(updatedFeeds);
      }
      
      return success;
    } catch (error) {
      console.error(`Failed to update ${field} status:`, error);
      // 如果更新失败，重新获取数据
      const unread = selectedFeed?.id === "unread" ? true : undefined;
      fetchItems({feed_id: selectedFeed?.id === "unread" ? "all" : selectedFeed?.id, unread});
      return false;
    }
  }, [items, selectedItem, feeds, selectedFeed, fetchItems]);

  // 加载更多项目，用于分页
  const loadMoreItems = useCallback(async () => {
    if (isLoading || pagination.page * pagination.size >= pagination.total) {
      return;
    }
    
    const nextPage = pagination.page + 1;
    const unread = selectedFeed.id === "unread" ? true : undefined;
    const starred = selectedFeed.id === "starred" ? true : undefined;
    const liked = selectedFeed.id === "liked" ? true : undefined;
    const today = selectedFeed.id === "today" ? true : undefined;
    
    setIsLoading(true);
    try {
      const response = await apiService.fetchItems({
        feed_id: selectedFeed.id, 
        unread, 
        starred, 
        liked, 
        today,
        page: nextPage,
        size: pagination.size
      });
      
      // 合并项目
      setItems(prevItems => [...prevItems, ...response.items]);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Failed to load more items:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, pagination, selectedFeed, setItems]);

  // 当组件挂载时获取 feeds
  useEffect(() => {
    fetchFeeds();
  }, [fetchFeeds]);

  // 当选中的 feed 变化时获取对应的 items
  useEffect(() => {
    setItems([]);
    setPagination({ total: 0, page: 1, size: 10 });
    const unread = selectedFeed.id === "unread" ? true : undefined;
    const starred = selectedFeed.id === "starred" ? true : undefined;
    const liked = selectedFeed.id === "liked" ? true : undefined;
    const today = selectedFeed.id === "today" ? true : undefined;
    fetchItems({feed_id: selectedFeed.id, unread, starred, liked, today, page: 1, size: 10});
  }, [selectedFeed, fetchItems]);

  return {
    feeds,
    items,
    pagination,
    selectedFeed,
    selectedItem,
    isLoading,
    setSelectedFeed,
    setSelectedItem,
    fetchFeeds,
    fetchItems,
    loadMoreItems,
    addFeed,
    deleteFeed,
    updateItemStatus
  };
}; 