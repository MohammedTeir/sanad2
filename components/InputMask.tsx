// components/InputMask.tsx
import React, { useState, useEffect } from 'react';

interface InputMaskProps {
  value: string;
  onChange: (value: string) => void;
  mask: string; // Example: '999-999-999' where 9 represents a digit
  placeholder?: string;
  type?: string;
  className?: string;
  name?: string;
}

const InputMask: React.FC<InputMaskProps> = ({
  value,
  onChange,
  mask,
  placeholder,
  type = 'text',
  className = '',
  name
}) => {
  const [internalValue, setInternalValue] = useState(value);

  // Update internal value when prop value changes
  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;

    // Remove all non-digit characters
    const digitsOnly = input.replace(/\D/g, '');

    // Limit to the number of digits in the mask
    const maxDigits = (mask.match(/9/g) || []).length;
    const limitedDigits = digitsOnly.slice(0, maxDigits);

    setInternalValue(limitedDigits);
    onChange(limitedDigits);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow backspace, delete, tab, escape, enter, and arrow keys
    if (['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      return;
    }

    // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
    if ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) {
      return;
    }

    // Prevent non-digit characters
    if (!/^\d$/.test(e.key)) {
      e.preventDefault();
    }
  };

  return (
    <input
      type={type}
      value={internalValue}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      className={className}
      name={name}
      autoComplete="off"
      inputMode="numeric"
    />
  );
};

export default InputMask;