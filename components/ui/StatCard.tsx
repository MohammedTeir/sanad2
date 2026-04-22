// components/ui/StatCard.tsx
import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'purple';
  trend?: {
    value: number;
    positive: boolean;
  };
  onClick?: () => void;
  loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  variant = 'primary',
  trend,
  onClick,
  loading = false
}) => {
  const variants = {
    primary: {
      bg: 'bg-gradient-to-br from-emerald-50 to-emerald-100',
      border: 'border-emerald-200',
      iconBg: 'bg-emerald-500',
      text: 'text-emerald-700'
    },
    success: {
      bg: 'bg-gradient-to-br from-teal-50 to-teal-100',
      border: 'border-teal-200',
      iconBg: 'bg-teal-500',
      text: 'text-teal-700'
    },
    warning: {
      bg: 'bg-gradient-to-br from-amber-50 to-amber-100',
      border: 'border-amber-200',
      iconBg: 'bg-amber-500',
      text: 'text-amber-700'
    },
    danger: {
      bg: 'bg-gradient-to-br from-red-50 to-red-100',
      border: 'border-red-200',
      iconBg: 'bg-red-500',
      text: 'text-red-700'
    },
    info: {
      bg: 'bg-gradient-to-br from-blue-50 to-blue-100',
      border: 'border-blue-200',
      iconBg: 'bg-blue-500',
      text: 'text-blue-700'
    },
    purple: {
      bg: 'bg-gradient-to-br from-purple-50 to-purple-100',
      border: 'border-purple-200',
      iconBg: 'bg-purple-500',
      text: 'text-purple-700'
    }
  };

  const v = variants[variant];

  if (loading) {
    return (
      <div className={`${v.bg} ${v.border} border-2 rounded-[2rem] p-6 animate-pulse`}>
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <div className="h-3 w-24 bg-white/50 rounded"></div>
            <div className="h-10 w-16 bg-white/50 rounded"></div>
          </div>
          <div className="w-14 h-14 bg-white/50 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`${v.bg} ${v.border} border-2 rounded-[2rem] p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">{title}</p>
          <p className="text-4xl font-black text-gray-800">{value}</p>
          {subtitle && <p className="text-sm font-bold text-gray-600 mt-1">{subtitle}</p>}
        </div>
        <div className={`${v.iconBg} w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
      </div>
      {trend && (
        <div className={`flex items-center gap-1 text-xs font-black ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
          <svg className={`w-4 h-4 ${trend.positive ? '' : 'rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
          <span>{trend.value}%</span>
        </div>
      )}
    </div>
  );
};

export default StatCard;
