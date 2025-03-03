import { useState } from 'react';
import FeedList from './components/FeedList';
import ItemList from './components/ItemList';
import ItemContent from './components/ItemContent';
import AddFeedModal from './components/AddFeedModal';
import DeleteFeedModal from './components/DeleteFeedModal';
import { Feed } from './types';
import { useFeedManager } from './hooks/useFeedManager';

function App() {
  const {
    feeds,
    items,
    pagination,
    selectedFeed,
    selectedItem,
    isLoading,
    setSelectedFeed,
    setSelectedItem,
    fetchItems,
    loadMoreItems,
    addFeed,
    deleteFeed,
    updateItemStatus,
  } = useFeedManager();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [feedToDelete, setFeedToDelete] = useState<Feed | null>(null);

  // 处理删除按钮点击
  const handleDeleteClick = (feed: Feed) => {
    setFeedToDelete(feed);
    setIsDeleteModalOpen(true);
  };

  // 处理添加 feed
  const handleAddFeed = async (url: string, cron: string, desc?: string) => {
    await addFeed(url, cron, desc);
    setIsAddModalOpen(false);
  };

  // 处理删除 feed 确认
  const handleDeleteFeed = async (feedId: string) => {
    await deleteFeed(feedId);
    setIsDeleteModalOpen(false);
  };

  // 处理标记已读/未读
  const handleToggleRead = (item: any, read: boolean) => {
    updateItemStatus(item, 'read', read);
  };
  
  // 处理标记星标
  const handleToggleStar = (item: any, starred: boolean) => {
    updateItemStatus(item, 'starred', starred);
  };
  
  // 处理标记喜欢
  const handleToggleLike = (item: any, liked: boolean) => {
    updateItemStatus(item, 'liked', liked);
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
        feed={selectedFeed}
        selectedItem={selectedItem}
        onSelectItem={setSelectedItem}
        onRefresh={(feed_id, unread, refresh) => fetchItems({feed_id, unread, refresh})}
        isLoading={isLoading}
        onDeleteClick={handleDeleteClick}
        feeds={feeds}
        pagination={pagination}
        onLoadMore={loadMoreItems}
      />
      <ItemContent 
        item={selectedItem} 
        onToggleRead={handleToggleRead}
        onToggleStar={handleToggleStar}
        onToggleLike={handleToggleLike}
      />
      <AddFeedModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddFeed}
      />
      <DeleteFeedModal
        isOpen={isDeleteModalOpen}
        feed={feedToDelete}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteFeed}
      />
    </div>
  );
}

export default App;
