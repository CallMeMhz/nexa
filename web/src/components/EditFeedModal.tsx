import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Feed } from '../types';

interface Props {
  isOpen: boolean;
  feed: Feed | null;
  onClose: () => void;
  onSubmit: (feedId: string, url: string, cron: string, desc?: string, tags?: string[], suspended?: boolean) => void;
  onDelete: (feedId: string) => void;
}

const EditFeedModal = ({ isOpen, feed, onClose, onSubmit, onDelete }: Props) => {
  const { t } = useTranslation();
  const [url, setUrl] = useState('');
  const [cron, setCron] = useState('');
  const [desc, setDesc] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [suspended, setSuspended] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState(false);
  const urlInputRef = useRef<HTMLInputElement>(null);
  
  // Reset form when feed changes
  useEffect(() => {
    if (feed) {
      setUrl(feed.link || '');
      setCron(feed.cron || '@every 30m'); // Default cron if not available
      setDesc(feed.desc || '');
      setTags(feed.tags || []);
      setSuspended(feed.suspended || false);
      setDeleteConfirmation(false);
    }
  }, [feed]);

  useEffect(() => {
    if (isOpen && urlInputRef.current) {
      urlInputRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen || !feed) return null;

  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // 检查输入是否包含空格或逗号
    if (value.includes(' ') || value.includes(',')) {
      // 分割输入并过滤空字符串
      const newTags = value.split(/[\s,]+/).filter(tag => tag.trim() !== '');
      
      // 添加新标签（排除已存在的）
      if (newTags.length > 0) {
        const lastTag = newTags[newTags.length - 1];
        if (lastTag && !tags.includes(lastTag)) {
          setTags([...tags, lastTag]);
        }
      }
      
      // 清空输入框
      setTagInput('');
    } else {
      setTagInput(value);
    }
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // 处理回车键添加标签
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim();
      if (!tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setTagInput('');
    } 
    // 处理退格键删除最后一个标签
    else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      setTags(tags.slice(0, -1));
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSubmit(feed.id, url, cron, desc, tags, suspended);
      onClose();
    } catch (error) {
      console.error('Error updating feed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = () => {
    if (deleteConfirmation) {
      onDelete(feed.id);
      onClose();
    } else {
      setDeleteConfirmation(true);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-96">
        <h3 className="text-lg font-semibold mb-4">{t('feed.edit')}</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">{t('feed.url')}</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full p-2 border rounded"
              required
              ref={urlInputRef}
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">{t('feed.description')} ({t('common.optional')})</label>
            <input
              type="text"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">{t('feed.tags')} ({t('common.optional')})</label>
            <div className="flex flex-wrap items-center p-2 border rounded">
              {tags.map((tag, index) => (
                <div key={index} className="flex items-center bg-blue-100 text-blue-800 rounded-full px-3 py-1 text-sm mr-2 mb-2">
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-2 text-blue-600 hover:text-blue-800 focus:outline-none"
                  >
                    &times;
                  </button>
                </div>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={handleTagInputChange}
                onKeyDown={handleTagInputKeyDown}
                className="flex-grow p-1 focus:outline-none"
                placeholder={tags.length === 0 ? t('feed.tagsPlaceholder') || "Add tags (press space to add)" : ""}
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">{t('feed.cron')}</label>
            <input
              type="text"
              value={cron}
              onChange={(e) => setCron(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="@every 30m"
              required
            />
          </div>
          <div className="mb-4 flex items-center">
            <input
              type="checkbox"
              id="suspended"
              checked={suspended}
              onChange={(e) => setSuspended(e.target.checked)}
              className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="suspended" className="text-sm font-medium text-gray-700">
              {t('feed.suspend')}
            </label>
          </div>
          <div className="flex justify-between">
            <button
              type="button"
              onClick={handleDeleteClick}
              className={`px-4 py-2 rounded ${
                deleteConfirmation 
                  ? 'bg-red-600 text-white hover:bg-red-700' 
                  : 'text-red-600 hover:bg-red-50'
              }`}
              disabled={isLoading}
            >
              {deleteConfirmation ? t('common.confirmDelete') : t('common.delete')}
            </button>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteConfirmation(false);
                  onClose();
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                disabled={isLoading}
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t('common.loading')}
                  </>
                ) : (
                  t('common.save')
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditFeedModal; 