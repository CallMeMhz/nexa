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
    tags,
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
  const [feedToDelete, setFeedToDelete] = useState<Feed | null>(null);
  const [mobileView, setMobileView] = useState<'feeds' | 'items' | 'content'>('feeds');

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


  // 直接删除 feed，不显示确认对话框
  const handleDirectDelete = async (feedId: string) => {
    await deleteFeed(feedId);
  };

  // 处理添加 feed
  const handleAddFeed = async (url: string, cron: string, desc?: string) => {
    await addFeed(url, cron, desc);
    setIsAddModalOpen(false);
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
  const handleUpdateFeed = async (feedId: string, url: string, cron: string, desc?: string, tags?: string[], suspended?: boolean) => {
    await updateFeed(feedId, url, cron, desc, tags, suspended);
  };

  // 处理选择 feed 时的移动端视图切换
  const handleSelectFeed = (feed: Feed) => {
    setSelectedFeed(feed);
    // 在移动端选择 feed 后，自动切换到 items 视图
    setMobileView('items');
  };

  // 处理选择 item 时的移动端视图切换
  const handleSelectItem = (item: any) => {
    setSelectedItem(item);
    // 在移动端选择 item 后，自动切换到 content 视图
    setMobileView('content');
  };

  // 处理移动端返回按钮
  const handleMobileBack = () => {
    if (mobileView === 'content') {
      setMobileView('items');
    } else if (mobileView === 'items') {
      setMobileView('feeds');
    }
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
    <div className="flex flex-col md:flex-row h-screen bg-gray-100 overflow-hidden">
      <AuthExpiredNotification />
      <LoginSuccessNotification 
        visible={showLoginSuccess}
        onClose={() => setShowLoginSuccess(false)}
      />
      
      {/* 移动端顶部导航栏 */}
      <div className="md:hidden flex items-center justify-between bg-white border-b border-gray-200 p-2">
        <div className="flex items-center">
          {mobileView !== 'feeds' && (
            <button 
              onClick={handleMobileBack}
              className="mr-2 p-2 text-gray-600 hover:text-gray-800"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          )}
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
        </div>
        <div className="flex items-center">
          {mobileView === 'feeds' && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="p-2 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      </div>
      
      {/* Feed 列表 - 在移动端根据视图状态显示/隐藏 */}
      <div id="feed-list" className={`${mobileView === 'feeds' ? 'block' : 'hidden'} md:block md:w-64 bg-white border-r border-gray-200 md:flex-shrink-0 h-full md:h-screen overflow-y-auto`}>
        <FeedList 
          feeds={feeds} 
          tags={tags}
          selectedFeed={selectedFeed}
          onSelectFeed={handleSelectFeed}
          onAddClick={() => setIsAddModalOpen(true)}
          showLogout={authState.isAuthenticated}
          onLogout={logout}
        />
      </div>
      
      {/* Item 列表 - 在移动端根据视图状态显示/隐藏 */}
      <div id="item-list" className={`${mobileView === 'items' ? 'block' : 'hidden'} md:block md:w-96 bg-white border-r border-gray-200 md:flex-shrink-0 h-full md:h-screen overflow-y-auto`}>
        <ItemList 
          items={items}
          feed={selectedFeed}
          selectedItem={selectedItem}
          onSelectItem={handleSelectItem}
          onRefresh={(feed_id, unread, refresh) => fetchItems({feed_id, unread, refresh})}
          isLoading={isLoading}
          onDirectDelete={handleDirectDelete}
          onUpdateFeed={handleUpdateFeed}
          feeds={feeds}
          pagination={pagination}
          onLoadMore={loadMoreItems}
          onSearch={handleSearch}
        />
      </div>
      
      {/* Item 内容 - 在移动端根据视图状态显示/隐藏 */}
      <div id="item-content" className={`${mobileView === 'content' ? 'block' : 'hidden'} md:block flex-grow h-full md:h-screen overflow-y-auto`}>
        <ItemContent 
          item={selectedItem} 
          onToggleRead={handleToggleRead}
          onToggleStar={handleToggleStar}
          onToggleLike={handleToggleLike}
        />
      </div>
      
      <AddFeedModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddFeed}
      />
    </div>
  );
}

export default App;
