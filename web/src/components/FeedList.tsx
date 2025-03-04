import { Feed } from '../types';
import { getFaviconUrl, getFeedDisplayName } from '../utils/feedUtils';
import LanguageSwitcher from './LanguageSwitcher';
import { useTranslation } from 'react-i18next';

interface Props {
  feeds: Feed[];
  selectedFeed: Feed | null;
  onSelectFeed: (feed: Feed) => void;
  onAddClick: () => void;
  showLogout?: boolean;
  onLogout?: () => void;
}

const FeedList = ({ 
  feeds, 
  selectedFeed, 
  onSelectFeed, 
  onAddClick,
  showLogout = false,
  onLogout
}: Props) => {
  const { t } = useTranslation();
  // 计算所有未读数量的总和
  const totalUnreadCount = feeds?.reduce((sum, feed) => sum + (feed.unread_count || 0), 0);
  
  return (
    <div className="w-64 bg-white border-r border-gray-200 p-4 flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <div className="relative">
            <h2 className="text-xl font-extrabold tracking-tight">
              <span className="text-blue-600">N</span>
              <span className="text-gray-800">exa</span>
            </h2>
            <div className="absolute -top-1 -right-1.5 w-2 h-2 bg-purple-500 rounded-full"></div>
          </div>
          <div className="ml-1.5 flex items-center justify-center px-1.5 py-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded text-xs font-medium text-white">
            RSS
          </div>
        </div>
        <button
          onClick={onAddClick}
          className="p-2 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="url(#add-gradient)">
            <defs>
              <linearGradient id="add-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#8B5CF6" />
              </linearGradient>
            </defs>
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      <ul className="space-y-2 flex-grow overflow-y-auto">
        <li 
          className={`cursor-pointer p-2 rounded flex items-center ${selectedFeed?.id === 'all' ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
          onClick={() => onSelectFeed({ id: 'all', title: "All" } as Feed)}
        >
          <div className="w-5 h-5 mr-2 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="url(#all-gradient)">
              <defs>
                <linearGradient id="all-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#8B5CF6" />
                </linearGradient>
              </defs>
              <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </div>
          <span>{t('nav.all')}</span>
        </li>
        <li
          className={`cursor-pointer p-2 rounded flex items-center ${selectedFeed?.id === 'today' ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
          onClick={() => onSelectFeed({ id: 'today', title: "Today" } as Feed)}
        >
          <div className="w-5 h-5 mr-2 flex items-center justify-center relative">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="url(#today-gradient)">
              <defs>
                <linearGradient id="today-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#8B5CF6" />
                </linearGradient>
              </defs>
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
          </div>
          <span>{t('nav.today')}</span>
        </li>
        <li 
          className={`cursor-pointer p-2 rounded flex items-center ${selectedFeed?.id === 'unread' ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
          onClick={() => onSelectFeed({ id: 'unread', title: "Unread" } as Feed)}
        >
          <div className="w-5 h-5 mr-2 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="url(#unread-gradient)">
              <defs>
                <linearGradient id="unread-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#8B5CF6" />
                </linearGradient>
              </defs>
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd" />
            </svg>
          </div>
          <span>{t('nav.unread')}</span>
          {totalUnreadCount > 0 && (
            <span className="ml-auto bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
              {totalUnreadCount}
            </span>
          )}
        </li>
        <li 
          className={`cursor-pointer p-2 rounded flex items-center ${selectedFeed?.id === 'starred' ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
          onClick={() => onSelectFeed({ id: 'starred', title: "Starred" } as Feed)}
        >
          <div className="w-5 h-5 mr-2 flex items-center justify-center relative">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="url(#star-gradient)">
              <defs>
                <linearGradient id="star-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#8B5CF6" />
                </linearGradient>
              </defs>
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
          <span>{t('nav.starred')}</span>
        </li>
        <li 
          className={`cursor-pointer p-2 rounded flex items-center ${selectedFeed?.id === 'liked' ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
          onClick={() => onSelectFeed({ id: 'liked', title: "Liked" } as Feed)}
        >
          <div className="w-5 h-5 mr-2 flex items-center justify-center relative">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="url(#heart-gradient)">
              <defs>
                <linearGradient id="heart-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#8B5CF6" />
                </linearGradient>
              </defs>
              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
            </svg>
          </div>
          <span>{t('nav.liked')}</span>
        </li>
        <li className="py-2">
          <div className="border-t border-gray-200"></div>
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
              
              {/* 后备图标（初始隐藏）- 更新为渐变背景 */}
              <div className="fallback-icon hidden w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold absolute top-0 left-0">
                {getFeedDisplayName(feed).charAt(0).toUpperCase()}
              </div>
            </div>
            <span className="truncate flex-1 mr-2">{getFeedDisplayName(feed)}</span>
            
            {/* 未读数量徽章 - 更新为渐变背景 */}
            {feed.unread_count > 0 && (
              <span className="flex-shrink-0 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                {feed.unread_count}
              </span>
            )}
          </li>
        ))}
      </ul>
      
      {/* 设置部分 */}
      <div className="mt-auto pt-3">
        <div className="flex items-center text-xs text-gray-500 mb-2 px-2">
          <span className="font-medium">{t('settings.title')}</span>
          <div className="flex-grow mx-2 border-t border-gray-200"></div>
        </div>
        
        {/* 语言切换器 */}
        <div className="mb-2 px-2">
          <LanguageSwitcher />
        </div>
        
        {/* 登出按钮 */}
        {showLogout && onLogout && (
          <button 
            onClick={onLogout}
            className="w-full flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-all duration-200"
            title={t('nav.logout')}
          >
            <div className="relative mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="url(#logout-gradient)" strokeWidth={1.5}>
                <defs>
                  <linearGradient id="logout-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3B82F6" />
                    <stop offset="100%" stopColor="#8B5CF6" />
                  </linearGradient>
                </defs>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            <span>{t('nav.logout')}</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default FeedList;
