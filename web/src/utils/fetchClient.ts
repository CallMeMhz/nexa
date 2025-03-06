import { logout } from './authService';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// 全局事件，用于通知应用程序需要重新登录
export const authEvents = {
  onUnauthorized: new Set<() => void>(),
  
  // 触发未授权事件
  emitUnauthorized: () => {
    // 清除 token
    logout();
    
    // 通知所有监听器
    authEvents.onUnauthorized.forEach(listener => listener());
  },
  
  // 添加监听器
  addUnauthorizedListener: (listener: () => void) => {
    authEvents.onUnauthorized.add(listener);
    return () => {
      authEvents.onUnauthorized.delete(listener);
    };
  }
};

// 封装的 fetch 函数，处理认证错误
export const fetchClient = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, options);
    
    // 处理 401 未授权错误
    if (response.status === 401) {
      authEvents.emitUnauthorized();
      throw new Error('认证失败，请重新登录');
    }
    
    // 处理其他错误
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `请求失败: ${response.status}`);
    }
    
    // 解析响应数据
    const data = await response.json();
    return data as T;
  } catch (error) {
    // 重新抛出错误，让调用者处理
    throw error;
  }
}; 