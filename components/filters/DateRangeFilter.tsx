// components/filters/DateRangeFilter.tsx
import React, { useState, useEffect } from 'react';

interface DateRangeFilterProps {
  startDate?: string;
  endDate?: string;
  onChange: (start: string, end: string) => void;
  onClear?: () => void;
  className?: string;
  label?: string;
  presetRanges?: { label: string; value: string }[];
}

const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  startDate = '',
  endDate = '',
  onChange,
  onClear,
  className = '',
  label = 'نطاق التاريخ',
  presetRanges = []
}) => {
  const [localStart, setLocalStart] = useState(startDate);
  const [localEnd, setLocalEnd] = useState(endDate);

  useEffect(() => {
    setLocalStart(startDate);
  }, [startDate]);

  useEffect(() => {
    setLocalEnd(endDate);
  }, [endDate]);

  const handlePresetChange = (preset: string) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let start = '';
    let end = '';

    switch (preset) {
      case 'today':
        start = today.toISOString().split('T')[0];
        end = start;
        break;
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        start = yesterday.toISOString().split('T')[0];
        end = start;
        break;
      case 'last7days':
        const last7 = new Date(today);
        last7.setDate(last7.getDate() - 6);
        start = last7.toISOString().split('T')[0];
        end = today.toISOString().split('T')[0];
        break;
      case 'last30days':
        const last30 = new Date(today);
        last30.setDate(last30.getDate() - 29);
        start = last30.toISOString().split('T')[0];
        end = today.toISOString().split('T')[0];
        break;
      case 'thisMonth':
        start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        end = today.toISOString().split('T')[0];
        break;
      case 'lastMonth':
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        start = lastMonth.toISOString().split('T')[0];
        end = lastMonthEnd.toISOString().split('T')[0];
        break;
      case 'thisYear':
        start = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
        end = today.toISOString().split('T')[0];
        break;
      default:
        break;
    }

    if (start && end) {
      setLocalStart(start);
      setLocalEnd(end);
      onChange(start, end);
    }
  };

  const handleClear = () => {
    setLocalStart('');
    setLocalEnd('');
    onChange('', '');
    if (onClear) onClear();
  };

  const hasValue = localStart || localEnd;

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label */}
      <div className="flex items-center justify-between">
        <label className="block text-sm font-black text-gray-700">
          {label}
        </label>
        {hasValue && (
          <button
            onClick={handleClear}
            className="text-xs text-red-600 hover:text-red-700 font-bold transition-colors"
          >
            مسح
          </button>
        )}
      </div>

      {/* Date Inputs */}
      <div className="grid grid-cols-2 gap-2">
        <div className="relative">
          <input
            type="date"
            value={localStart}
            onChange={(e) => {
              setLocalStart(e.target.value);
              onChange(e.target.value, localEnd);
            }}
            className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all font-bold text-sm"
            placeholder="من"
          />
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-bold">
            من
          </span>
        </div>

        <div className="relative">
          <input
            type="date"
            value={localEnd}
            onChange={(e) => {
              setLocalEnd(e.target.value);
              onChange(localStart, e.target.value);
            }}
            className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all font-bold text-sm"
            placeholder="إلى"
          />
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-bold">
            إلى
          </span>
        </div>
      </div>

      {/* Preset Ranges */}
      {presetRanges.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-2">
          {presetRanges.map((preset) => (
            <button
              key={preset.value}
              onClick={() => handlePresetChange(preset.value)}
              className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black transition-all ${
                (preset.value === 'last7days' && !hasValue) ||
                (localStart && localEnd && 
                  ((preset.value === 'last7days' && 
                    new Date(localStart).getTime() === new Date(new Date().setDate(new Date().getDate() - 6)).getTime()) ||
                   (preset.value === 'last30days' && 
                    new Date(localStart).getTime() === new Date(new Date().setDate(new Date().getDate() - 29)).getTime()))
                )
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              type="button"
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default DateRangeFilter;
