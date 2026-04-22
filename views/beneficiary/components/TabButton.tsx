// views/beneficiary/components/TabButton.tsx
import React from 'react';

interface TabButtonProps {
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
  badge?: number;
}

const TabButton: React.FC<TabButtonProps> = ({ label, icon, isActive, onClick, badge }) => {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all duration-300
        ${isActive 
          ? 'bg-gradient-to-l from-emerald-600 to-emerald-700 text-white shadow-lg shadow-emerald-200' 
          : 'bg-white text-gray-600 hover:bg-emerald-50 hover:text-emerald-700'
        }
      `}
    >
      <span className="w-5 h-5">{icon}</span>
      <span className="hidden md:inline">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className={`
          w-5 h-5 rounded-full flex items-center justify-center text-xs font-black
          ${isActive ? 'bg-white text-emerald-600' : 'bg-emerald-600 text-white'}
        `}>
          {badge}
        </span>
      )}
    </button>
  );
};

export default TabButton;
