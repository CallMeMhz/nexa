import { Item } from '../types';
import { useEffect, useRef } from 'react';

interface Props {
  item: Item | null;
  onToggleRead?: (item: Item, read: boolean) => void;
  onToggleStar?: (item: Item, star: boolean) => void;
  onToggleLike?: (item: Item, like: boolean) => void;
}

const ItemContent = ({ item, onToggleRead, onToggleStar, onToggleLike }: Props) => {
  // 使用 ref 来跟踪当前正在查看的文章 ID
  const currentItemIdRef = useRef<string | null>(null);
  
  useEffect(() => {
    // 如果有新的文章被选中
    if (item && item.id !== currentItemIdRef.current) {
      // 更新当前正在查看的文章 ID
      currentItemIdRef.current = item.id;
      
      // 如果文章未读，自动标记为已读
      if (!item.read && onToggleRead) {
        onToggleRead(item, true);
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
      <div className="flex-1 p-8 bg-white flex items-center justify-center text-gray-400">
        Select an item to read
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 bg-white overflow-y-auto flex justify-center">
      {/* 添加自定义样式 */}
      <style>{contentStyle}</style>
      
      {/* 使用一个容器来限制内容宽度 */}
      <div className="w-full max-w-3xl">
        <div className="flex flex-col mb-4">
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
                  : 'bg-red-50 text-red-600 hover:bg-red-100'
              }`}
              onClick={() => onToggleRead && onToggleRead(item, !item.read)}
            >
              <span className={`w-2 h-2 rounded-full mr-2 ${item.read ? 'bg-gray-400' : 'bg-red-500'}`}></span>
              {item.read ? '已读' : '未读'}
            </button>
            <button 
              className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center ${
                item.starred 
                  ? 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              onClick={() => onToggleStar && onToggleStar(item, !item.starred)}
            >
              <span className="mr-2">{item.starred ? '★' : '☆'}</span>
              {item.starred ? '已收藏' : '收藏'}
            </button>
            <button 
              className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center ${
                item.liked 
                  ? 'bg-red-50 text-pink-600 hover:bg-pink-100' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              onClick={() => onToggleLike && onToggleLike(item, !item.liked)}
            >
              <span className="mr-2">{item.liked ? '♥' : '♡'}</span>
              {item.liked ? '已喜欢' : '喜欢'}
            </button>
            {item.pub_date && (
              <p className="text-gray-500 text-sm ml-2">{new Date(item.pub_date).toLocaleString()}</p>
            )}
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4">
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
  );
};

export default ItemContent;
