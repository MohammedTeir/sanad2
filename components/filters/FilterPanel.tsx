// components/filters/FilterPanel.tsx
import React, { useState, useCallback } from 'react';

interface FilterBadge {
  id: string;
  label: string;
  value: string;
  onRemove: () => void;
}

interface FilterPanelProps {
  children: React.ReactNode;
  activeFilters?: FilterBadge[];
  onClearAll?: () => void;
  defaultOpen?: boolean;
  title?: string;
  iconColor?: 'emerald' | 'blue' | 'amber' | 'red' | 'purple';
  variant?: 'default' | 'modal';
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  children,
  activeFilters = [],
  onClearAll,
  defaultOpen = false,
  title = 'تصفية النتائج',
  iconColor = 'emerald',
  variant = 'default'
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const colorConfigs: Record<string, any> = {
    emerald: {
      button: 'bg-emerald-600 hover:bg-emerald-700',
      badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      icon: 'bg-emerald-100 text-emerald-600'
    },
    blue: {
      button: 'bg-blue-600 hover:bg-blue-700',
      badge: 'bg-blue-100 text-blue-700 border-blue-200',
      icon: 'bg-blue-100 text-blue-600'
    },
    amber: {
      button: 'bg-amber-600 hover:bg-amber-700',
      badge: 'bg-amber-100 text-amber-700 border-amber-200',
      icon: 'bg-amber-100 text-amber-600'
    },
    red: {
      button: 'bg-red-600 hover:bg-red-700',
      badge: 'bg-red-100 text-red-700 border-red-200',
      icon: 'bg-red-100 text-red-600'
    },
    purple: {
      button: 'bg-purple-600 hover:bg-purple-700',
      badge: 'bg-purple-100 text-purple-700 border-purple-200',
      icon: 'bg-purple-100 text-purple-600'
    }
  };

  const colors = colorConfigs[iconColor];

  const toggleOpen = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const hasActiveFilters = activeFilters.length > 0;

  return (
    <div className={`bg-white rounded-[2rem] border-2 border-gray-100 shadow-sm ${variant === 'modal' ? 'overflow-visible' : 'overflow-hidden'}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${colors.icon} rounded-xl flex items-center justify-center`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-800">{title}</h3>
              {hasActiveFilters && (
                <p className="text-xs text-gray-500 font-bold mt-0.5">
                  {activeFilters.length} فلاتر نشطة
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasActiveFilters && onClearAll && (
              <button
                onClick={onClearAll}
                className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-black hover:bg-red-100 transition-all flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                مسح الكل
              </button>
            )}
            <button
              onClick={toggleOpen}
              className={`w-10 h-10 ${colors.button} text-white rounded-xl flex items-center justify-center transition-all ${isOpen ? 'rotate-180' : ''}`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Active Filters Badges */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
            {activeFilters.map((filter) => (
              <div
                key={filter.id}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 ${colors.badge} rounded-xl border-2 transition-all`}
              >
                <span className="text-xs font-black">{filter.label}</span>
                <button
                  onClick={filter.onRemove}
                  className="hover:opacity-75 transition-opacity"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filter Content */}
      {isOpen && (
        <div className="p-6 animate-in fade-in slide-in-from-top-2 duration-300 max-h-[30vh] overflow-y-auto">
          {children}
        </div>
      )}
    </div>
  );
};

export default FilterPanel;
