// components/RTLModal.tsx
import React, { useEffect } from 'react';
import { useRTLDirection } from '../hooks/useRTL';

interface RTLModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const RTLModal: React.FC<RTLModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md' 
}) => {
  const { direction, textAlign, start, end } = useRTLDirection();
  
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };
  
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      dir={direction}
    >
      <div 
        className={`bg-white rounded-lg shadow-xl w-full ${sizeClasses[size]} max-h-[90vh] flex flex-col`}
        style={{ direction }}
      >
        <div 
          className="flex justify-between items-center p-4 border-b"
          style={{ 
            textAlign,
            flexDirection: direction === 'rtl' ? 'row-reverse' : 'row'
          }}
        >
          <h3 
            className="text-lg font-bold text-gray-800"
            style={{ textAlign }}
          >
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
            style={{ 
              marginLeft: direction === 'rtl' ? 'auto' : '0',
              marginRight: direction === 'rtl' ? '0' : 'auto'
            }}
          >
            <svg 
              className="w-6 h-6" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M6 18L18 6M6 6l12 12" 
              />
            </svg>
          </button>
        </div>
        
        <div 
          className="p-4 overflow-y-auto flex-grow"
          style={{ textAlign }}
        >
          {children}
        </div>
        
        <div 
          className="flex justify-end p-4 border-t space-x-2"
          style={{ 
            textAlign,
            flexDirection: direction === 'rtl' ? 'row-reverse' : 'row'
          }}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};