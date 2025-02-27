import { Feed, Item } from '../types';
import { getFaviconUrl, getFeedDisplayName, formatTimestamp, getDomain } from '../utils/feedUtils';

interface Props {
  items: Item[];
  selectedFeed: Feed | null;
  selectedItem: Item | null;
  onSelectItem: (item: Item) => void;
}

const ItemList = ({ items, selectedFeed, selectedItem, onSelectItem }: Props) => {
  const filteredItems = items;  // TODO: implement feed filtering

  return (
    <div className="w-96 bg-white border-r border-gray-200 overflow-y-auto">
      <div className="p-4">
        {/* 标题栏 - 显示当前源信息 */}
        <div className="flex items-center mb-4">
          {selectedFeed && (
            <img 
              src={getFaviconUrl(selectedFeed.link)} 
              alt=""
              className="w-6 h-6 mr-2"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          )}
          <h2 className="text-lg font-semibold flex-1 truncate">
            {getFeedDisplayName(selectedFeed)}
          </h2>
          <span className="text-xs text-gray-500">
            {filteredItems.length} items
          </span>
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
                  <div className="w-full h-full bg-gradient-to-br from-pink-400 to-yellow-300 flex items-center justify-center text-white font-bold text-xl">
                    {item.title.charAt(0)}
                  </div>
                )}
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Title and unread indicator */}
                <div className="flex items-start">
                  <h3 className="font-medium text-sm leading-tight line-clamp-2 flex-1 pr-1">
                    {item.title}
                  </h3>
                  {!item.read && (
                    <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0 mt-1.5"></div>
                  )}
                </div>
                
                {/* Description */}
                {item.description && (
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2 leading-snug">
                    <span dangerouslySetInnerHTML={{ __html: item.description }} />
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
        </div>
      </div>
    </div>
  );
};

export default ItemList;
