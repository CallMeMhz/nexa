import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n/i18n';

const LanguageSwitcher: React.FC = () => {
  // 使用 t 函数获取翻译
  const { t } = useTranslation();
  // 创建一个本地状态来跟踪当前语言
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language || 'en');
  
  // 监听语言变化
  useEffect(() => {
    const handleLanguageChanged = () => {
      setCurrentLanguage(i18n.language || 'en');
    };
    
    // 添加语言变化的监听器
    i18n.on('languageChanged', handleLanguageChanged);
    
    // 清理函数，移除监听器
    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, []);
  
  const changeLanguage = (lng: string) => {
    // 如果点击的是当前选中的语言，直接返回，不执行任何操作
    if ((currentLanguage === lng) || 
        (lng === 'en' && currentLanguage.startsWith('en-')) || 
        (lng === 'zh' && currentLanguage.startsWith('zh-'))) {
      return;
    }
    
    try {
      console.log("Changing language to:", lng);
      i18n.changeLanguage(lng);
    } catch (error) {
      console.error("Error changing language:", error);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium text-gray-700">{t('common.language')}:</span>
      <div className="flex space-x-1">
        <button
          className={`px-2 py-1 text-xs rounded ${
            currentLanguage === 'en' || currentLanguage.startsWith('en-') 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
          onClick={() => changeLanguage('en')}
        >
          English
        </button>
        <button
          className={`px-2 py-1 text-xs rounded ${
            currentLanguage === 'zh' || currentLanguage.startsWith('zh-') 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
          onClick={() => changeLanguage('zh')}
        >
          中文
        </button>
      </div>
    </div>
  );
};

export default LanguageSwitcher;