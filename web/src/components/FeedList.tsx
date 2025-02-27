import { Feed } from '../types';
import { getFaviconUrl, getFeedDisplayName } from '../utils/feedUtils';

interface Props {
  feeds: Feed[];
  selectedFeed: Feed | null;
  onSelectFeed: (feed: Feed | null) => void;
  onAddClick: () => void;
}

const FeedList = ({ feeds, selectedFeed, onSelectFeed, onAddClick }: Props) => {
  // 计算所有未读数量的总和
  const totalUnreadCount = feeds.reduce((sum, feed) => sum + (feed.unread_count || 0), 0);
  
  return (
    <div className="w-64 bg-white border-r border-gray-200 p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Feeds</h2>
        <button
          onClick={onAddClick}
          className="p-2 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      <ul className="space-y-2">
        <li 
          className={`cursor-pointer p-2 rounded flex items-center ${!selectedFeed ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
          onClick={() => onSelectFeed(null)}
        >
          <div className="w-5 h-5 mr-2 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
              <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </div>
          <span>ALL</span>
          {totalUnreadCount > 0 && (
            <span className="ml-auto bg-blue-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
              {totalUnreadCount}
            </span>
          )}
        </li>
        <li 
          className={`cursor-pointer p-2 rounded flex items-center ${selectedFeed?.id === 'unread' ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
          onClick={() => onSelectFeed({ id: 'unread' } as Feed)}
        >
          <div className="w-5 h-5 mr-2 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
            </svg>
          </div>
          <span>Unread</span>
          {totalUnreadCount > 0 && (
            <span className="ml-auto bg-blue-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
              {totalUnreadCount}
            </span>
          )}
        </li>
        {feeds.map(feed => (
          <li
            key={feed.id}
            className={`cursor-pointer p-2 rounded flex items-center ${selectedFeed?.id === feed.id ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
            onClick={() => onSelectFeed(feed)}
          >
            <div className="mr-2 flex-shrink-0 relative w-5 h-5">
              {/* Favicon */}
              <img 
                src={getFaviconUrl(feed.link)} 
                alt="" 
                className="w-5 h-5 rounded absolute top-0 left-0" 
                onError={(e) => {
                  // 如果favicon加载失败，隐藏图片并显示后备图标
                  e.currentTarget.style.display = 'none';
                  const fallbackEl = e.currentTarget.parentElement?.querySelector('.fallback-icon');
                  if (fallbackEl) {
                    fallbackEl.classList.remove('hidden');
                  }
                }}
              />
              
              {/* 后备图标（初始隐藏） */}
              <div className="fallback-icon hidden w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold absolute top-0 left-0">
                {getFeedDisplayName(feed).charAt(0).toUpperCase()}
              </div>
            </div>
            <span className="truncate flex-1 mr-2">{getFeedDisplayName(feed)}</span>
            
            {/* 未读数量徽章 */}
            {feed.unread_count > 0 && (
              <span className="flex-shrink-0 bg-blue-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                {feed.unread_count}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FeedList;
