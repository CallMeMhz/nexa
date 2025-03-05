import { useState, useEffect, useRef, useCallback } from 'react';
import FeedList from './components/FeedList';
import ItemList from './components/ItemList';
import ItemContent from './components/ItemContent';
import AddFeedModal from './components/AddFeedModal';
import DeleteFeedModal from './components/DeleteFeedModal';
import LoginPage from './components/LoginPage';
import AuthExpiredNotification from './components/AuthExpiredNotification';
import LoginSuccessNotification from './components/LoginSuccessNotification';
import { Feed } from './types';
import { useFeedManager } from './hooks/useFeedManager';
import { useAuth } from './hooks/useAuth';
import { authEvents } from './utils/fetchClient';

function App() {
  const { authState, isLoading: authLoading, login, logout, refreshAuth } = useAuth();
  
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
    updateFeed,
    deleteFeed,
    updateItemStatus,
    fetchFeeds,
    searchItems
  } = useFeedManager();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [feedToDelete, setFeedToDelete] = useState<Feed | null>(null);

  // 跟踪前一个认证状态
  const prevAuthRef = useRef(false);
  
  // 登录成功通知状态
  const [showLoginSuccess, setShowLoginSuccess] = useState(false);

  // 监听未授权事件，自动登出
  useEffect(() => {
    // 添加未授权事件监听器
    const unsubscribe = authEvents.addUnauthorizedListener(() => {
      // 触发登出操作
      logout();
    });
    
    // 组件卸载时移除监听器
    return () => {
      unsubscribe();
    };
  }, [logout]);

  // 当认证状态变化时，重新获取数据
  useEffect(() => {
    // 检查是否从未认证变为已认证（登录成功）
    const wasAuthenticated = prevAuthRef.current;
    const isAuthenticated = authState.isAuthenticated;
    
    // 更新前一个认证状态的引用
    prevAuthRef.current = isAuthenticated;
    
    // 如果是登录成功，重新获取数据
    if (isAuthenticated && !wasAuthenticated) {
      console.log('用户登录成功，重新获取数据');
      // 显示登录成功通知
      setShowLoginSuccess(true);
      // 获取数据
      fetchFeeds();
      // 重置选中的 feed 为 "all"
      setSelectedFeed({id: "all", title: "All"} as Feed);
    }
  }, [authState.isAuthenticated, fetchFeeds, setSelectedFeed]);

  // 处理登录成功
  const handleLoginSuccess = useCallback(() => {
    // 刷新认证状态
    login();
    // 显示登录成功通知
    setShowLoginSuccess(true);
  }, [login]);

  // 处理删除按钮点击 - 显示确认对话框
  const handleDeleteClick = (feed: Feed) => {
    setFeedToDelete(feed);
    setIsDeleteModalOpen(true);
  };

  // 直接删除 feed，不显示确认对话框
  const handleDirectDelete = async (feedId: string) => {
    await deleteFeed(feedId);
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

  // 处理搜索
  const handleSearch = (query: string) => {
    searchItems(query);
  };

  // 处理更新 feed
  const handleUpdateFeed = async (feedId: string, url: string, cron: string, desc?: string, suspended?: boolean) => {
    await updateFeed(feedId, url, cron, desc, suspended);
  };

  // 如果认证状态正在加载，显示加载中
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // 如果需要登录但未认证，显示登录页面
  if (authState.authRequired && !authState.isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // 已认证或不需要认证，显示主界面
  return (
    <div className="flex h-screen bg-gray-100">
      <AuthExpiredNotification />
      <LoginSuccessNotification 
        visible={showLoginSuccess}
        onClose={() => setShowLoginSuccess(false)}
      />
      <FeedList 
        feeds={feeds} 
        selectedFeed={selectedFeed}
        onSelectFeed={setSelectedFeed}
        onAddClick={() => setIsAddModalOpen(true)}
        showLogout={authState.isAuthenticated}
        onLogout={logout}
      />
      <ItemList 
        items={items}
        feed={selectedFeed}
        selectedItem={selectedItem}
        onSelectItem={setSelectedItem}
        onRefresh={(feed_id, unread, refresh) => fetchItems({feed_id, unread, refresh})}
        isLoading={isLoading}
        onDeleteClick={handleDeleteClick}
        onDirectDelete={handleDirectDelete}
        onUpdateFeed={handleUpdateFeed}
        feeds={feeds}
        pagination={pagination}
        onLoadMore={loadMoreItems}
        onSearch={handleSearch}
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
