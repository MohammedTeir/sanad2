// components/ConfirmModal.tsx
import React from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  itemName?: string;
  confirmText: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  itemName,
  confirmText,
  cancelText = 'إلغاء',
  type = 'danger',
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  const colors = {
    danger: {
      icon: 'bg-red-100 text-red-600',
      button: 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800',
      iconPath: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
    },
    warning: {
      icon: 'bg-amber-100 text-amber-600',
      button: 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800',
      iconPath: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
    },
    info: {
      icon: 'bg-blue-100 text-blue-600',
      button: 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800',
      iconPath: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
        <div className="p-6 text-center">
          {/* Icon */}
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${colors[type].icon}`}>
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={colors[type].iconPath} />
            </svg>
          </div>

          {/* Title */}
          <h3 className="text-xl font-black text-gray-800 mb-2">
            {title}
          </h3>

          {/* Message */}
          <p className="text-gray-600 font-bold mb-4">
            {message}
          </p>

          {/* Item Name (if provided) */}
          {itemName && (
            <div className={`rounded-xl p-4 mb-6 ${
              type === 'danger' ? 'bg-red-50 border-2 border-red-100' :
              type === 'warning' ? 'bg-amber-50 border-2 border-amber-100' :
              'bg-blue-50 border-2 border-blue-100'
            }`}>
              <p className={`text-sm font-black ${
                type === 'danger' ? 'text-red-800' :
                type === 'warning' ? 'text-amber-800' :
                'text-blue-800'
              }`}>
                {itemName}
              </p>
            </div>
          )}

          {/* Warning (for danger type) */}
          {type === 'danger' && (
            <div className="bg-amber-50 border-2 border-amber-100 rounded-xl p-3 mb-6">
              <p className="text-xs font-bold text-amber-800 flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                لا يمكن التراجع عن هذا الإجراء
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-black hover:bg-gray-200 transition-all"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 px-6 py-3 text-white rounded-xl font-black transition-all shadow-lg hover:shadow-xl ${colors[type].button}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
