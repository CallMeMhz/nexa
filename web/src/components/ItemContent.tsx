import { Item } from '../types';

interface Props {
  item: Item | null;
}

const ItemContent = ({ item }: Props) => {
  if (!item) {
    return (
      <div className="flex-1 p-8 bg-white flex items-center justify-center text-gray-400">
        Select an item to read
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 bg-white overflow-y-auto">
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
                : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
            }`}
            onClick={() => console.log('Toggle read status')}
          >
            <span className={`w-2 h-2 rounded-full mr-2 ${item.read ? 'bg-gray-400' : 'bg-blue-500'}`}></span>
            {item.read ? '已读' : '未读'}
          </button>
          <button 
            className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center ${
              item.star 
                ? 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            onClick={() => console.log('Toggle star')}
          >
            <span className="mr-2">{item.star ? '★' : '☆'}</span>
            {item.star ? '已收藏' : '收藏'}
          </button>
          <button 
            className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center ${
              item.like 
                ? 'bg-green-50 text-green-600 hover:bg-green-100' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            onClick={() => console.log('Toggle like')}
          >
            <span className="mr-2">{item.like ? '♥' : '♡'}</span>
            {item.like ? '已喜欢' : '喜欢'}
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
          <img src={item.image} alt="" className="max-w-full h-auto mb-4 rounded" />
        )}
        <div 
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: item.content }}
        />
      </div>
    </div>
  );
};

export default ItemContent;
