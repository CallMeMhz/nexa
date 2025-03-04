import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// 导入翻译文件
import translationEN from './locales/en.json';
import translationZH from './locales/zh.json';

// 翻译资源
const resources = {
  en: {
    translation: translationEN
  },
  zh: {
    translation: translationZH
  }
};

// 确保同步初始化
i18n
  // 使用 browser 语言检测器
  .use(LanguageDetector)
  // 将 i18n 实例传递给 react-i18next
  .use(initReactI18next)
  // 初始化 i18next - 使用同步初始化
  .init({
    resources,
    fallbackLng: 'en', // 默认语言
    lng: localStorage.getItem('i18nextLng') || 'en', // 尝试从 localStorage 获取语言，否则默认英文
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false, // React 已经安全地处理了转义
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    react: {
      useSuspense: false // 禁用 Suspense 以避免某些渲染问题
    },
    // 确保同步初始化，不要等待后端加载
    initImmediate: false
  }, (err) => {
    if (err) console.error('i18n initialization error:', err);
  });

// 将 i18n 设置为全局变量，以便在组件外部也可以访问
if (window) {
  (window as any).i18n = i18n;
}

export default i18n; 