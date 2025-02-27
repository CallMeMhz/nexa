import { useState, useEffect } from 'react';
import FeedList from './components/FeedList';
import ItemList from './components/ItemList';
import ItemContent from './components/ItemContent';
import AddFeedModal from './components/AddFeedModal';
import { Feed, Item } from './types';

function App() {
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [selectedFeed, setSelectedFeed] = useState<Feed | null>(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    fetchFeeds();
    fetchItems();
  }, []);

  useEffect(() => {
    setItems([]);
    fetchItems(selectedFeed?.id);
  }, [selectedFeed]);

  const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:7766';

  const fetchFeeds = async () => {
    const response = await fetch(`${API_URL}/feeds`);
    const data = await response.json();
    setFeeds(data.feeds);
  };

  const addFeed = async (url: string, cron: string, desc?: string) => {
    const response = await fetch(`${API_URL}/feed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url, cron, desc }),
    });
    const data = await response.json();
    setFeeds([...feeds, data.feed]);
    setIsAddModalOpen(false);
  };

  const fetchItems = async (feed_id?: string) => {
    const url = feed_id 
      ? `${API_URL}/feed/${feed_id}`
      : `${API_URL}/feed/all`;
    const response = await fetch(url);
    const data = await response.json();
    
    // 只处理read状态，摘要由后端提供
    const processedItems = data.items.map((item: Item) => ({
      ...item,
      read: item.read !== undefined ? item.read : false,
      // 确保summary字段存在，即使是空字符串
      description: item.description || ""
    }));
    
    setItems(processedItems);
  };

  const handleSelectItem = (item: Item) => {
    // Mark the item as read
    const updatedItems = items.map(i => 
      i.guid === item.guid ? { ...i, read: true } : i
    );
    setItems(updatedItems);
    setSelectedItem(item);
    
    // Update the read status on the server
    updateItemReadStatus(item.id, false);
  };
  
  const updateItemReadStatus = async (itemId: string, unread: boolean) => {
    try {
      await fetch(`${API_URL}/item/${itemId}/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ read: !unread }),
      });
    } catch (error) {
      console.error('Failed to update read status:', error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <FeedList 
        feeds={feeds} 
        selectedFeed={selectedFeed}
        onSelectFeed={setSelectedFeed}
        onAddClick={() => setIsAddModalOpen(true)}
      />
      <ItemList 
        items={items}
        selectedFeed={selectedFeed}
        selectedItem={selectedItem}
        onSelectItem={handleSelectItem}
      />
      <ItemContent item={selectedItem} />
      <AddFeedModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={addFeed}
      />
    </div>
  );
}

export default App;
