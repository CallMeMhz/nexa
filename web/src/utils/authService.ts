import { LoginResponse } from '../types';
import { fetchClient } from './fetchClient';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';
const TOKEN_KEY = 'nexa_token';

// 检查认证状态
export const checkAuthStatus = async (): Promise<boolean> => {
  try {
    const data = await fetchClient<{ auth_required: boolean }>('/api/auth-status');
    return data.auth_required;
  } catch (error) {
    console.error('Failed to check auth status:', error);
    return false;
  }
};

// 登录 - 注意：这里不使用 fetchClient，因为我们需要特殊处理登录错误
export const login = async (password: string): Promise<LoginResponse> => {
  const response = await fetch(`${API_URL}/api/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ password }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Login failed');
  }
  
  const data = await response.json();
  
  // 如果需要认证且登录成功，保存token
  if (data.auth_required && data.token) {
    localStorage.setItem(TOKEN_KEY, data.token);
  }
  
  return data;
};

// 登出
export const logout = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

// 获取token
export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

// 检查是否已认证
export const isAuthenticated = (): boolean => {
  return !!getToken();
};

// 为API请求添加认证头
export const getAuthHeaders = (): HeadersInit => {
  const token = getToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}; 