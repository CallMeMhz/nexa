// 系统内置的 feed 类型
export const SYSTEM_FEEDS = {
  ALL: 'all',
  UNREAD: 'unread',
  STARRED: 'starred',
  LIKED: 'liked',
  TODAY: 'today'
};

// 系统内置 feed 的 ID 列表
export const SYSTEM_FEED_IDS = Object.values(SYSTEM_FEEDS);

// 检查是否是系统内置 feed
export const isSystemFeed = (feedId?: string): boolean => {
  if (!feedId) return false;
  return SYSTEM_FEED_IDS.includes(feedId);
}; 