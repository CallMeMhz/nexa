import { useEffect, useState, useCallback } from 'react';
import { AuthState } from '../types';
import { checkAuthStatus, getToken, isAuthenticated, logout } from '../utils/authService';

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    token: getToken() || '',
    isAuthenticated: isAuthenticated(),
    authRequired: false
  });
  const [isLoading, setIsLoading] = useState(true);

  // 检查认证状态的函数
  const checkAuth = useCallback(async () => {
    try {
      const authRequired = await checkAuthStatus();
      setAuthState(prevState => ({
        ...prevState,
        authRequired,
        // 重新检查 token 是否存在，以防在其他地方被修改
        token: getToken() || '',
        isAuthenticated: isAuthenticated()
      }));
    } catch (error) {
      console.error('Failed to check authentication status:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 初始化时检查认证状态
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // 登录成功处理函数
  const handleLogin = useCallback(() => {
    // 重新检查认证状态，确保 token 已被正确设置
    setAuthState({
      token: getToken() || '',
      isAuthenticated: isAuthenticated(),
      authRequired: authState.authRequired
    });
  }, [authState.authRequired]);

  // 登出处理函数
  const handleLogout = useCallback(() => {
    logout();
    setAuthState({
      token: '',
      isAuthenticated: false,
      authRequired: authState.authRequired
    });
  }, [authState.authRequired]);

  return {
    authState,
    isLoading,
    login: handleLogin,
    logout: handleLogout,
    refreshAuth: checkAuth
  };
}; 