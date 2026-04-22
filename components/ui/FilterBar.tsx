// components/ui/FilterBar.tsx
import React from 'react';

interface FilterOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface FilterBarProps {
  filters: {
    key: string;
    label: string;
    type: 'select' | 'multiselect' | 'search' | 'date';
    options?: FilterOption[];
    value: any;
    onChange: (value: any) => void;
    placeholder?: string;
  }[];
  onSearch?: (query: string) => void;
  searchPlaceholder?: string;
  className?: string;
}

const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onSearch,
  searchPlaceholder = 'بحث...',
  className = ''
}) => {
  return (
    <div className={`bg-white rounded-[2rem] border-2 border-gray-100 shadow-sm p-4 md:p-6 mb-6 ${className}`}>
      <div className="flex flex-col md:flex-row gap-4">
        {onSearch && (
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder={searchPlaceholder}
                onChange={(e) => onSearch(e.target.value)}
                className="w-full px-4 py-3 pr-12 rounded-2xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all font-bold text-sm"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        )}
        
        {filters.map((filter, idx) => (
          <div key={idx} className="min-w-[180px]">
            <label className="block text-xs font-black text-gray-500 mb-2">{filter.label}</label>
            {filter.type === 'select' && (
              <select
                value={filter.value}
                onChange={(e) => filter.onChange(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all font-bold text-sm bg-white"
              >
                {filter.options?.map((opt, optIdx) => (
                  <option key={optIdx} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            )}
            {filter.type === 'multiselect' && (
              <select
                value={filter.value}
                onChange={(e) => filter.onChange(Array.from(e.target.selectedOptions, option => option.value))}
                multiple
                className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all font-bold text-sm bg-white h-24"
              >
                {filter.options?.map((opt, optIdx) => (
                  <option key={optIdx} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            )}
            {filter.type === 'date' && (
              <input
                type="date"
                value={filter.value}
                onChange={(e) => filter.onChange(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all font-bold text-sm"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FilterBar;
