import React, { useState, useEffect } from 'react';
import { authEvents } from '../utils/fetchClient';

interface AuthExpiredNotificationProps {
  message?: string;
  duration?: number;
}

const AuthExpiredNotification: React.FC<AuthExpiredNotificationProps> = ({
  message = '您的登录已过期，请重新登录',
  duration = 5000
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // 添加未授权事件监听器
    const unsubscribe = authEvents.addUnauthorizedListener(() => {
      setVisible(true);
      
      // 设置定时器，在指定时间后隐藏通知
      const timer = setTimeout(() => {
        setVisible(false);
      }, duration);
      
      // 清理定时器
      return () => clearTimeout(timer);
    });
    
    // 组件卸载时移除监听器
    return () => {
      unsubscribe();
    };
  }, [duration]);

  if (!visible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 bg-white border border-gray-200 px-4 py-3 rounded-lg shadow-md flex items-center">
      <div className="flex-shrink-0 mr-3">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="url(#warning-gradient)">
          <defs>
            <linearGradient id="warning-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#EF4444" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>
          </defs>
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      </div>
      <span className="text-gray-700 font-medium">{message}</span>
      <button 
        onClick={() => setVisible(false)}
        className="ml-4 text-gray-400 hover:text-gray-600 transition-colors duration-200"
        aria-label="关闭"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
};

export default AuthExpiredNotification; 