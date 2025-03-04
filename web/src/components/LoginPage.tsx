import React, { useState } from 'react';
import { login } from '../utils/authService';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('请输入密码');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await login(password);
      if (response.auth_required && !response.token) {
        setError('密码错误');
      } else {
        onLoginSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <div className="relative inline-block">
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
          <p className="mt-3 text-center text-sm text-gray-600">
            请输入密码以访问您的 RSS 阅读器
          </p>
        </div>
        <div className="mt-8 bg-white py-8 px-4 shadow-sm rounded-lg sm:px-10 border border-gray-200">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                密码
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="请输入密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center">{error}</div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  isLoading ? 'opacity-70 cursor-not-allowed' : ''
                } bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="relative w-5 h-5 mr-2">
                      <div className="absolute inset-0 rounded-full border-2 border-transparent animate-spin" 
                          style={{ 
                            borderTopColor: 'white', 
                            borderRightColor: 'rgba(255,255,255,0.5)',
                            borderBottomColor: 'transparent',
                            borderLeftColor: 'transparent'
                          }}>
                      </div>
                    </div>
                    登录中...
                  </div>
                ) : '登录'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 