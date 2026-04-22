// components/filters/SearchInput.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { normalizeArabic, containsArabic } from '../../utils/arabicTextUtils';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  placeholder?: string;
  className?: string;
  debounceMs?: number;
  showArabicHint?: boolean;
  iconColor?: 'emerald' | 'blue' | 'amber' | 'red' | 'gray';
}

const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  onClear,
  placeholder = 'بحث...',
  className = '',
  debounceMs = 300,
  showArabicHint = true,
  iconColor = 'emerald'
}) => {
  const [localValue, setLocalValue] = useState(value);
  const [isFocused, setIsFocused] = useState(false);

  const colorConfigs: Record<string, any> = {
    emerald: {
      focus: 'focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100',
      icon: 'bg-emerald-100 text-emerald-600',
      iconBg: 'bg-emerald-50'
    },
    blue: {
      focus: 'focus:border-blue-500 focus:ring-4 focus:ring-blue-100',
      icon: 'bg-blue-100 text-blue-600',
      iconBg: 'bg-blue-50'
    },
    amber: {
      focus: 'focus:border-amber-500 focus:ring-4 focus:ring-amber-100',
      icon: 'bg-amber-100 text-amber-600',
      iconBg: 'bg-amber-50'
    },
    red: {
      focus: 'focus:border-red-500 focus:ring-4 focus:ring-red-100',
      icon: 'bg-red-100 text-red-600',
      iconBg: 'bg-red-50'
    },
    gray: {
      focus: 'focus:border-gray-500 focus:ring-4 focus:ring-gray-100',
      icon: 'bg-gray-100 text-gray-600',
      iconBg: 'bg-gray-50'
    }
  };

  const colors = colorConfigs[iconColor];

  // Debounced value change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [localValue, debounceMs]);

  // Sync with external value changes
  useEffect(() => {
    if (value !== localValue) {
      setLocalValue(value);
    }
  }, [value]);

  const handleClear = useCallback(() => {
    setLocalValue('');
    onChange('');
    if (onClear) onClear();
  }, [onChange, onClear]);

  const isArabicSearch = containsArabic(localValue);
  const normalizedPreview = localValue ? normalizeArabic(localValue) : '';

  return (
    <div className={`relative ${className}`}>
      {/* Search Icon */}
      <div className={`absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 ${colors.icon} rounded-xl flex items-center justify-center transition-all ${isFocused ? 'scale-110' : ''}`}>
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {/* Input Field */}
      <input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        className={`w-full pr-14 pl-10 py-3 rounded-xl border-2 border-gray-200 ${colors.focus} transition-all font-bold text-sm sm:text-base ${value ? 'bg-gray-50' : 'bg-white'}`}
        dir="auto"
      />

      {/* Clear Button */}
      {localValue && (
        <button
          onClick={handleClear}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-gray-200 hover:bg-gray-300 text-gray-600 rounded-lg flex items-center justify-center transition-all"
          type="button"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {/* Arabic Normalization Hint */}
      {showArabicHint && isArabicSearch && normalizedPreview && normalizedPreview !== localValue && (
        <div className={`absolute left-0 right-0 top-full mt-2 ${colors.iconBg} border-2 border-gray-200 rounded-xl p-3 shadow-lg z-10`}>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs font-bold text-gray-700">
              البحث الطبيعي: <span className="text-emerald-700 font-black">{normalizedPreview}</span>
            </span>
          </div>
          <p className="text-[10px] text-gray-500 font-bold mt-1 mr-6">
            سيتم البحث عن جميع الأشكال المتشابهة (أ/إ/آ/ا، ة/ه، إلخ)
          </p>
        </div>
      )}
    </div>
  );
};

export default SearchInput;
