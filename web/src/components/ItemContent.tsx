import { Item } from '../types';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  item: Item | null;
  onToggleRead?: (item: Item, read: boolean) => void;
  onToggleStar?: (item: Item, star: boolean) => void;
  onToggleLike?: (item: Item, like: boolean) => void;
}

const ItemContent = ({ item, onToggleRead, onToggleStar, onToggleLike }: Props) => {
  const { t } = useTranslation();
  const currentItemIdRef = useRef<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // 如果有新的文章被选中
    if (item && item.id !== currentItemIdRef.current) {
      // 更新当前正在查看的文章 ID
      currentItemIdRef.current = item.id;
      
      // 如果文章未读，自动标记为已读
      if (!item.read && onToggleRead) {
        onToggleRead(item, true);
      }
      
      // 滚动内容区域回到顶部
      if (contentRef.current) {
        contentRef.current.scrollTop = 0;
      }
    }
  }, [item, onToggleRead]);

  // 添加自定义样式，限制内容中图片的最大尺寸
  const contentStyle = `
    .prose img {
      max-width: 100%;
      max-height: 500px;
      object-fit: contain;
      margin: 1rem auto;
      display: block;
    }
    
    .prose iframe {
      max-width: 100%;
      max-height: 500px;
      margin: 1rem auto;
      display: block;
    }
    
    .prose pre {
      max-width: 100%;
      overflow-x: auto;
    }
  `;

  if (!item) {
    return (
      <div className="flex-1 p-8 bg-white flex h-full items-center justify-center text-gray-400">
        Select an item to read
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white flex flex-col h-full">
      {/* 添加自定义样式 */}
      <style>{contentStyle}</style>
      
      {/* 固定的顶部区域 */}
      <div className="p-6 shadow-sm flex-shrink-0" style={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
        <div className="flex flex-col max-w-3xl mx-auto">
          <div className="mb-2">
            {item.link ? (
              <a href={item.link} target="_blank" rel="noopener noreferrer" className="no-underline">
                <h1 className="text-2xl font-bold hover:text-blue-600">{item.title}</h1>
              </a>
            ) : (
              <h1 className="text-2xl font-bold">{item.title}</h1>
            )}
          </div>
          
          <div className="flex items-center space-x-3 mt-2">
            <button 
              className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center ${
                item.read 
                  ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' 
                  : 'bg-red-50 text-blue-600 hover:bg-blue-100'
              }`}
              onClick={() => onToggleRead && onToggleRead(item, !item.read)}
            >
              <span className={`w-2 h-2 rounded-full mr-2 ${item.read ? 'bg-gray-400' : 'bg-gradient-to-r from-blue-500 to-purple-500'}`}></span>
              {item.read ? t('read') : t('unread')}
            </button>
            <button 
              className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center ${
                item.starred 
                  ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              onClick={() => onToggleStar && onToggleStar(item, !item.starred)}
            >
              <div className="mr-2">
                {item.starred ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="url(#star-gradient)">
                    <defs>
                      <linearGradient id="star-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#3B82F6" />
                        <stop offset="100%" stopColor="#8B5CF6" />
                      </linearGradient>
                    </defs>
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                )}
              </div>
              {item.starred ? t('starred') : t('star')}
            </button>
            <button 
              className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center ${
                item.liked 
                  ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              onClick={() => onToggleLike && onToggleLike(item, !item.liked)}
            >
              <div className="mr-2">
                {item.liked ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="url(#heart-gradient)">
                    <defs>
                      <linearGradient id="heart-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#3B82F6" />
                        <stop offset="100%" stopColor="#8B5CF6" />
                      </linearGradient>
                    </defs>
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                )}
              </div>
              {item.liked ? t('liked') : t('like')}
            </button>
            {item.pub_date && (
              <p className="text-gray-500 text-sm ml-2">{new Date(item.pub_date).toLocaleString()}</p>
            )}
          </div>
        </div>
      </div>

      {/* 可滚动的内容区域 */}
      <div ref={contentRef} className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto">
          <div className="pt-2">
            {item.description && !item.content && (
              <p className="text-gray-600 mb-4" dangerouslySetInnerHTML={{ __html: item.description }} />
            )}
            
            {item.image && (
              <img 
                src={item.image} 
                alt="" 
                className="max-w-full h-auto max-h-96 mb-4 rounded mx-auto object-contain" 
              />
            )}
            <div 
              className="prose max-w-none text-base leading-relaxed"
              dangerouslySetInnerHTML={{ __html: item.content }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemContent;
