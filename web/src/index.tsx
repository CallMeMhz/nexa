import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
// 确保 i18n 在应用启动前初始化
import i18n from './i18n/i18n';
import { I18nextProvider } from 'react-i18next';

// 等待 i18n 初始化完成后再渲染应用
const renderApp = () => {
  const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
  );

  root.render(
    <React.StrictMode>
      <I18nextProvider i18n={i18n}>
        <Suspense fallback={<div>Loading...</div>}>
          <App />
        </Suspense>
      </I18nextProvider>
    </React.StrictMode>
  );
};

// 确保 i18n 已初始化
if (i18n.isInitialized) {
  renderApp();
} else {
  i18n.on('initialized', renderApp);
}
