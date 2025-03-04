import React from 'react';
import { Feed } from '../types';
import { getFeedDisplayName } from '../utils/feedUtils';
import { useTranslation } from 'react-i18next';

interface Props {
  isOpen: boolean;
  feed: Feed | null;
  onClose: () => void;
  onConfirm: (feedId: string) => void;
}

const DeleteFeedModal = ({ isOpen, feed, onClose, onConfirm }: Props) => {
  const { t } = useTranslation();
  
  if (!isOpen || !feed) return null;

  const handleConfirm = () => {
    if (feed.id) {
      onConfirm(feed.id);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-80">
        <h3 className="text-lg font-semibold mb-4">{t('common.confirm')}</h3>
        <p className="mb-6">
          {t('feed.deleteConfirm')} <span className="font-bold">{getFeedDisplayName(feed)}</span>
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            {t('common.delete')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteFeedModal; 