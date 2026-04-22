// components/ui/InfoBadge.tsx
import React from 'react';

interface InfoBadgeProps {
  label: string;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  onClick?: () => void;
}

const InfoBadge: React.FC<InfoBadgeProps> = ({
  label,
  variant = 'neutral',
  size = 'md',
  icon,
  onClick
}) => {
  const variants = {
    success: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-100 text-amber-700 border-amber-200',
    danger: 'bg-red-100 text-red-700 border-red-200',
    info: 'bg-blue-100 text-blue-700 border-blue-200',
    primary: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    neutral: 'bg-gray-100 text-gray-700 border-gray-200'
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-xs',
    lg: 'px-4 py-1.5 text-sm'
  };

  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full font-black border-2 ${variants[variant]} ${sizes[size]} ${onClick ? 'cursor-pointer hover:shadow-md transition-all' : ''}`}
    >
      {icon}
      {label}
    </span>
  );
};

export default InfoBadge;
