// components/ui/GradientCard.tsx
import React from 'react';

interface GradientCardProps {
  title: string;
  value?: string | number;
  subtitle?: string;
  children?: React.ReactNode;
  variant?: 'emerald' | 'blue' | 'amber' | 'red' | 'purple' | 'indigo';
  icon?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const GradientCard: React.FC<GradientCardProps> = ({
  title,
  value,
  subtitle,
  children,
  variant = 'emerald',
  icon,
  className = '',
  onClick
}) => {
  const variants = {
    emerald: 'bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700',
    blue: 'bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700',
    amber: 'bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700',
    red: 'bg-gradient-to-br from-red-500 via-red-600 to-red-700',
    purple: 'bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700',
    indigo: 'bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-700'
  };

  return (
    <div
      onClick={onClick}
      className={`${variants[variant]} rounded-[2.5rem] p-6 md:p-8 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-white/80 text-xs font-bold uppercase tracking-widest mb-2">{title}</p>
          {value !== undefined && (
            <p className="text-4xl md:text-5xl font-black mb-2">{value}</p>
          )}
          {subtitle && <p className="text-white/90 text-sm font-bold">{subtitle}</p>}
        </div>
        {icon && (
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
            {icon}
          </div>
        )}
      </div>
      {children}
    </div>
  );
};

export default GradientCard;
