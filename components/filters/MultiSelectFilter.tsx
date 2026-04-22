// components/filters/MultiSelectFilter.tsx
import React, { useState, useRef, useEffect } from 'react';

interface Option {
  value: string;
  label: string;
  color?: string;
  icon?: React.ReactNode;
}

interface MultiSelectFilterProps {
  options: Option[];
  value: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  className?: string;
  label?: string;
  maxVisible?: number;
  showSelectAll?: boolean;
  searchable?: boolean;
  iconColor?: 'emerald' | 'blue' | 'amber' | 'red' | 'purple' | 'gray';
}

const MultiSelectFilter: React.FC<MultiSelectFilterProps> = ({
  options,
  value = [],
  onChange,
  placeholder = 'اختر...',
  className = '',
  label,
  maxVisible = 2,
  showSelectAll = false,
  searchable = false,
  iconColor = 'emerald'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const colorConfigs: Record<string, any> = {
    emerald: {
      focus: 'focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100',
      icon: 'bg-emerald-100 text-emerald-600',
      badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      hover: 'hover:bg-emerald-50'
    },
    blue: {
      focus: 'focus:border-blue-500 focus:ring-4 focus:ring-blue-100',
      icon: 'bg-blue-100 text-blue-600',
      badge: 'bg-blue-100 text-blue-700 border-blue-200',
      hover: 'hover:bg-blue-50'
    },
    amber: {
      focus: 'focus:border-amber-500 focus:ring-4 focus:ring-amber-100',
      icon: 'bg-amber-100 text-amber-600',
      badge: 'bg-amber-100 text-amber-700 border-amber-200',
      hover: 'hover:bg-amber-50'
    },
    red: {
      focus: 'focus:border-red-500 focus:ring-4 focus:ring-red-100',
      icon: 'bg-red-100 text-red-600',
      badge: 'bg-red-100 text-red-700 border-red-200',
      hover: 'hover:bg-red-50'
    },
    purple: {
      focus: 'focus:border-purple-500 focus:ring-4 focus:ring-purple-100',
      icon: 'bg-purple-100 text-purple-600',
      badge: 'bg-purple-100 text-purple-700 border-purple-200',
      hover: 'hover:bg-purple-50'
    },
    gray: {
      focus: 'focus:border-gray-500 focus:ring-4 focus:ring-gray-100',
      icon: 'bg-gray-100 text-gray-600',
      badge: 'bg-gray-100 text-gray-700 border-gray-200',
      hover: 'hover:bg-gray-50'
    }
  };

  const colors = colorConfigs[iconColor];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = (optionValue: string) => {
    const newValue = value.includes(optionValue)
      ? value.filter(v => v !== optionValue)
      : [...value, optionValue];
    onChange(newValue);
  };

  const handleSelectAll = () => {
    if (value.length === options.length) {
      onChange([]);
    } else {
      onChange(options.map(o => o.value));
    }
  };

  const handleClear = () => {
    onChange([]);
    setIsOpen(false);
  };

  const filteredOptions = searchable
    ? options.filter(opt =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;

  const getDisplayText = () => {
    if (value.length === 0) return placeholder;
    if (value.length === 1) {
      const option = options.find(o => o.value === value[0]);
      return option?.label || placeholder;
    }
    return `${value.length} عناصر محددة`;
  };

  const hasValue = value.length > 0;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-black text-gray-700 mb-2">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-3 rounded-xl border-2 ${
          hasValue ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200 bg-white'
        } ${colors.focus} transition-all font-bold text-sm text-right flex items-center justify-between gap-2`}
      >
        <span className="flex-1 truncate">{getDisplayText()}</span>
        <div className={`w-8 h-8 ${colors.icon} rounded-lg flex items-center justify-center flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-xl border-2 border-gray-200 shadow-xl overflow-hidden">
          {/* Search (if enabled) */}
          {searchable && (
            <div className="p-3 border-b border-gray-100">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="بحث..."
                className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all text-sm font-bold"
                autoFocus
              />
            </div>
          )}

          {/* Select All */}
          {showSelectAll && (
            <button
              type="button"
              onClick={handleSelectAll}
              className={`w-full px-4 py-2.5 ${colors.hover} border-b border-gray-100 transition-all flex items-center justify-between gap-2`}
            >
              <span className="text-sm font-black text-gray-700">
                {value.length === options.length ? 'إلغاء تحديد الكل' : 'تحديد الكل'}
              </span>
              <span className="text-xs text-gray-500 font-bold">
                {options.length} خيارات
              </span>
            </button>
          )}

          {/* Options */}
          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-gray-500 font-bold">لا توجد خيارات</p>
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = value.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleToggle(option.value)}
                    className={`w-full px-4 py-3 ${colors.hover} transition-all flex items-center gap-3 ${
                      isSelected ? 'bg-emerald-50' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      isSelected
                        ? 'bg-emerald-600 border-emerald-600'
                        : 'border-gray-300'
                    }`}>
                      {isSelected && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>

                    {/* Icon (if provided) */}
                    {option.icon && (
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        {option.icon}
                      </div>
                    )}

                    {/* Label */}
                    <span className={`flex-1 text-sm font-bold text-right ${
                      isSelected ? 'text-emerald-800' : 'text-gray-700'
                    }`}>
                      {option.label}
                    </span>

                    {/* Color Badge (if provided) */}
                    {option.color && (
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-black ${option.color}`}>
                        •
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer with Clear Button */}
          {hasValue && (
            <div className="p-3 border-t border-gray-100 bg-gray-50">
              <button
                type="button"
                onClick={handleClear}
                className="w-full px-4 py-2 bg-white border-2 border-red-200 text-red-600 rounded-xl text-sm font-black hover:bg-red-50 transition-all"
              >
                مسح الكل ({value.length})
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MultiSelectFilter;
