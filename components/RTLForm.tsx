// components/RTLForm.tsx
import React from 'react';
import { useRTLDirection } from '../hooks/useRTL';

interface RTLFormProps {
  children: React.ReactNode;
  onSubmit?: (e: React.FormEvent) => void;
  className?: string;
  style?: React.CSSProperties;
}

export const RTLForm: React.FC<RTLFormProps> = ({ 
  children, 
  onSubmit, 
  className = '', 
  style = {} 
}) => {
  const { direction, textAlign } = useRTLDirection();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(e);
    }
  };
  
  const combinedStyles: React.CSSProperties = {
    direction,
    textAlign,
    ...style
  };
  
  return (
    <form onSubmit={handleSubmit} className={className} style={combinedStyles}>
      {children}
    </form>
  );
};

interface RTLInputProps {
  label: string;
  id: string;
  type?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const RTLInput: React.FC<RTLInputProps> = ({
  label,
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  className = '',
  style = {}
}) => {
  const { textAlign, direction } = useRTLDirection();
  
  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: '0.5rem',
    fontWeight: 'bold',
    textAlign: textAlign,
    direction
  };
  
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.5rem',
    borderRadius: '0.375rem',
    border: '1px solid #d1d5db',
    textAlign,
    direction,
    ...style
  };
  
  return (
    <div className={className} style={{ direction, textAlign }}>
      <label htmlFor={id} style={labelStyle}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        style={inputStyle}
      />
    </div>
  );
};