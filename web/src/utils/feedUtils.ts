/**
 * 从URL中提取域名
 * @param url 网址
 * @returns 域名，如果解析失败则返回空字符串
 */
export const getDomain = (url: string): string => {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname;
  } catch (e) {
    return '';
  }
};

/**
 * 获取网站的favicon URL
 * @param url 网站URL
 * @returns favicon的URL
 */
export const getFaviconUrl = (url: string): string => {
  const domain = getDomain(url);
  if (!domain) return '';
  
  // 使用Google的favicon服务
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
};

/**
 * 格式化时间戳
 * @param date 日期对象
 * @returns 格式化的时间字符串，今天的显示为"HH:MM"，其他日期显示为"月 日"
 */
export const formatTimestamp = (date: Date): string => {
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  
  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
};

/**
 * 获取Feed的显示名称
 * @param feed Feed对象
 * @returns 显示名称
 */
export const getFeedDisplayName = (feed: any): string => {
  if (!feed) return 'All Items';
  return feed.name || feed.title || getDomain(feed.link) || 'Unnamed Feed';
}; 