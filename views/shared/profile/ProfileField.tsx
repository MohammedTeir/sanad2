// views/shared/profile/ProfileField.tsx
import React from 'react';

interface ProfileFieldProps {
  label: string;
  value?: string | React.ReactNode;
  isEditing?: boolean;
  editMode?: 'display' | 'input' | 'textarea' | 'select';
  inputType?: 'text' | 'email' | 'tel' | 'password' | 'date' | 'number';
  inputValue?: string;
  onInputChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  inputName?: string;
  placeholder?: string;
  icon?: React.ReactNode;
  options?: { value: string; label: string }[];
  required?: boolean;
  disabled?: boolean;
  className?: string;
  helperText?: string;
  error?: string;
}

export const ProfileField: React.FC<ProfileFieldProps> = ({
  label,
  value,
  isEditing = false,
  editMode = 'input',
  inputType = 'text',
  inputValue = '',
  onInputChange,
  inputName,
  placeholder,
  icon,
  options,
  required = false,
  disabled = false,
  className = '',
  helperText,
  error
}) => {
  const renderContent = () => {
    if (!isEditing) {
      return (
        <div className="px-4 py-3 bg-gray-50 rounded-xl font-bold text-gray-700 flex items-center gap-2 min-h-[52px]">
          {icon && <span className="text-gray-400 flex-shrink-0">{icon}</span>}
          <span className="truncate">{value || '-'}</span>
        </div>
      );
    }

    switch (editMode) {
      case 'textarea':
        return (
          <textarea
            name={inputName}
            value={inputValue}
            onChange={onInputChange}
            disabled={disabled}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 transition-all font-bold disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder={placeholder}
            rows={3}
          />
        );
      case 'select':
        return (
          <select
            name={inputName}
            value={inputValue}
            onChange={onInputChange}
            disabled={disabled}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 transition-all font-bold disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">اختر...</option>
            {options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );
      default:
        return (
          <input
            type={inputType}
            name={inputName}
            value={inputValue}
            onChange={onInputChange}
            disabled={disabled}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 transition-all font-bold disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder={placeholder}
          />
        );
    }
  };

  return (
    <div className={className}>
      <label className="block text-sm font-black text-gray-700 mb-2">
        {label}
        {required && <span className="text-red-500 mr-1">*</span>}
      </label>
      {renderContent()}
      {helperText && !error && (
        <p className="text-xs text-gray-500 font-bold mt-1">{helperText}</p>
      )}
      {error && (
        <p className="text-xs text-red-500 font-bold mt-1">{error}</p>
      )}
    </div>
  );
};
