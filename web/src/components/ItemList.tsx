import { Feed, Item, Pagination } from '../types';
import { getFaviconUrl, getFeedDisplayName, formatTimestamp, getDomain } from '../utils/feedUtils';
import { useState, useEffect, useRef, useCallback } from 'react';

interface Props {
  items: Item[];
  feed: Feed;
  selectedItem: Item | null;
  onSelectItem: (item: Item) => void;
  onRefresh: (feedID: string, unread: boolean, refresh: boolean) => void;
  isLoading: boolean;
  onDeleteClick?: (feed: Feed) => void;
  feeds: Feed[];
  pagination: Pagination;
  onLoadMore: () => void;
}

const ItemList = ({ 
  items, 
  feed, 
  selectedItem, 
  onSelectItem, 
  onRefresh, 
  isLoading, 
  onDeleteClick, 
  feeds,
  pagination,
  onLoadMore
}: Props) => {
  const filteredItems = items;  // TODO: implement feed filtering
  const [isHeaderHovered, setIsHeaderHovered] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  // 处理滚动事件，实现无限滚动
  const handleScroll = useCallback(() => {
    if (!listRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = listRef.current;
    // 当滚动到距离底部100px时触发加载更多
    if (scrollHeight - scrollTop - clientHeight < 100 && !isLoading && pagination.page * pagination.size < pagination.total) {
      onLoadMore();
    }
  }, [isLoading, onLoadMore, pagination]);

  // 监听滚动事件
  useEffect(() => {
    const listElement = listRef.current;
    if (listElement) {
      listElement.addEventListener('scroll', handleScroll);
      return () => listElement.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  // 根据 feed_id 获取对应的 feed 的 favicon URL
  const getFeedFaviconUrl = (feedId: string): string => {
    const itemFeed = feeds.find(f => f.id === feedId);
    if (itemFeed && itemFeed.link) {
      return getFaviconUrl(itemFeed.link);
    }
    // 如果找不到对应的 feed，则返回空字符串
    return '';
  };

  // 检查是否是系统内置的 feed
  const isSystemFeed = feed && feed.id && ["all", "unread", "starred", "liked", "today"].includes(feed.id);

  return (
    <div ref={listRef} className="w-96 bg-white border-r border-gray-200 overflow-y-auto">
      <div className="p-4">
        {/* 标题栏 - 显示当前源信息 */}
        <div 
          className="flex items-center mb-4 relative group"
          onMouseEnter={() => setIsHeaderHovered(true)}
          onMouseLeave={() => setIsHeaderHovered(false)}
        >
          {feed && (
            <img 
              src={getFaviconUrl(feed.link)} 
              alt=""
              className="w-6 h-6 mr-2"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          )}
          <h2 className="text-lg font-semibold flex-1 truncate">
            {getFeedDisplayName(feed)}
            {feed.desc && (
              <div className="text-xs text-gray-500 mb-2 truncate" title={feed.desc}>
                {feed.desc}
              </div>
            )}
            <div className="text-xs text-gray-600 mt-1">
              共 {pagination.total} 条
            </div>
          </h2>
          
          {/* 操作按钮区域 */}
          <div className="flex items-center">
            {/* 删除按钮 - 只在自定义 feed 上且鼠标悬停时显示 */}
            {!isSystemFeed && onDeleteClick && isHeaderHovered && (
              <button
                onClick={() => onDeleteClick(feed)}
                className="mr-2 p-1 rounded-full hover:bg-gray-100 text-red-600 transition-opacity"
                title="删除订阅"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
            
            {/* 刷新按钮 */}
            <button 
              onClick={() => onRefresh(feed.id, feed.id === "unread", true)}
              className={`mr-2 p-1 rounded-full hover:bg-gray-100 text-gray-600 ${isLoading ? 'animate-spin' : ''}`}
              title="刷新"
              disabled={isLoading}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {filteredItems.map(item => (
            <div
              key={item.guid}
              className={`cursor-pointer p-3 rounded flex ${
                selectedItem?.guid === item.guid ? 'bg-blue-100' : 'hover:bg-gray-100'
              }`}
              onClick={() => onSelectItem(item)}
            >
              {/* Feed icon or thumbnail */}
              <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0 mr-3">
                {item.image ? (
                  <img src={item.image} alt="" className="w-full h-full object-cover" />
                ) : (
                  <img src={getFeedFaviconUrl(item.feed_id)} alt="" className="w-full h-full object-cover" />
                )}
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Title and indicators */}
                <div className="flex items-start">
                  <h3 className="font-medium text-sm leading-tight line-clamp-2 flex-1 pr-1">
                    {item.title}
                  </h3>
                  <div className="flex flex-col items-center space-y-1 flex-shrink-0 ml-1">
                    {!item.read && (
                      <div className="w-2 h-2 bg-red-500 rounded-full" aria-label="Unread"></div>
                    )}
                    {item.starred && (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-yellow-500">
                        <title>Starred</title>
                        <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                      </svg>
                    )}
                    {item.liked && (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-pink-500">
                        <title>Liked</title>
                        <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                      </svg>
                    )}
                  </div>
                </div>
                
                {/* Description */}
                {item.description && (
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2 leading-snug">
                    {item.description.replace(/<[^>]*>/g, '')}
                  </p>
                )}
                
                {/* Source and timestamp */}
                <div className="flex justify-between items-center mt-1 text-xs text-gray-500">
                  <span className="truncate font-bold">{getDomain(item.link)}</span>
                  <span className="flex-shrink-0 ml-2">
                    {item.pub_date ? formatTimestamp(new Date(item.pub_date)) : ''}
                  </span>
                </div>
              </div>
            </div>
          ))}
          
          {/* 加载状态指示器 */}
          {isLoading && (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
            </div>
          )}
          
          {/* 加载完成提示 */}
          {!isLoading && pagination.page * pagination.size >= pagination.total && items.length > 0 && (
            <div className="text-center text-gray-500 py-4">
              已加载全部内容
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ItemList;
