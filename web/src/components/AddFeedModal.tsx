import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (url: string, cron: string, desc?: string) => void;
}

const AddFeedModal = ({ isOpen, onClose, onSubmit }: Props) => {
  const { t } = useTranslation();
  const defaultCron = '@every 30m';
  const [url, setUrl] = useState('');
  const [cron, setCron] = useState(defaultCron);
  const [desc, setDesc] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const urlInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (isOpen && urlInputRef.current) {
      urlInputRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSubmit(url, cron, desc || undefined);
      setUrl('');
      setCron(defaultCron);
      setDesc('');
      onClose();
    } catch (error) {
      console.error('Error submitting feed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg w-96">
        <h3 className="text-lg font-semibold mb-4">{t('feed.add')}</h3>
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
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
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
                t('feed.add')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddFeedModal;
