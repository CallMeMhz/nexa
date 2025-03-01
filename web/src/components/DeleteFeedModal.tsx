import React from 'react';
import { Feed } from '../types';
import { getFeedDisplayName } from '../utils/feedUtils';

interface Props {
  isOpen: boolean;
  feed: Feed | null;
  onClose: () => void;
  onConfirm: (feedId: string) => void;
}

const DeleteFeedModal = ({ isOpen, feed, onClose, onConfirm }: Props) => {
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
        <h3 className="text-lg font-semibold mb-4">确认删除</h3>
        <p className="mb-6">
          确定要删除订阅 <span className="font-bold">{getFeedDisplayName(feed)}</span> 吗？此操作无法撤销。
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            删除
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteFeedModal; 