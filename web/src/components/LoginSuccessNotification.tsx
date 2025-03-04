import React, { useState, useEffect } from 'react';

interface LoginSuccessNotificationProps {
  message?: string;
  duration?: number;
  visible: boolean;
  onClose: () => void;
}

const LoginSuccessNotification: React.FC<LoginSuccessNotificationProps> = ({
  message = '登录成功，正在加载数据...',
  duration = 3000,
  visible,
  onClose
}) => {
  useEffect(() => {
    if (visible) {
      // 设置定时器，在指定时间后隐藏通知
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      
      // 清理定时器
      return () => clearTimeout(timer);
    }
  }, [visible, duration, onClose]);

  if (!visible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 bg-white border border-gray-200 px-4 py-3 rounded-lg shadow-md flex items-center">
      <div className="flex-shrink-0 mr-3">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="url(#success-gradient)">
          <defs>
            <linearGradient id="success-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
          </defs>
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      </div>
      <span className="text-gray-700 font-medium">{message}</span>
      <button 
        onClick={onClose}
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

export default LoginSuccessNotification; 