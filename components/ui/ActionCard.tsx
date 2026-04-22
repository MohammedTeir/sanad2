// components/ui/ActionCard.tsx
import React from 'react';

interface ActionCardProps {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: 'emerald' | 'blue' | 'amber' | 'red' | 'purple' | 'teal';
  size?: 'sm' | 'md' | 'lg';
  badge?: string;
  disabled?: boolean;
}

const ActionCard: React.FC<ActionCardProps> = ({
  title,
  subtitle,
  icon,
  onClick,
  variant = 'emerald',
  size = 'md',
  badge,
  disabled = false
}) => {
  const variants = {
    emerald: {
      bg: 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100',
      text: 'text-emerald-700',
      iconBg: 'bg-emerald-500'
    },
    blue: {
      bg: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
      text: 'text-blue-700',
      iconBg: 'bg-blue-500'
    },
    amber: {
      bg: 'bg-amber-50 border-amber-200 hover:bg-amber-100',
      text: 'text-amber-700',
      iconBg: 'bg-amber-500'
    },
    red: {
      bg: 'bg-red-50 border-red-200 hover:bg-red-100',
      text: 'text-red-700',
      iconBg: 'bg-red-500'
    },
    purple: {
      bg: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
      text: 'text-purple-700',
      iconBg: 'bg-purple-500'
    },
    teal: {
      bg: 'bg-teal-50 border-teal-200 hover:bg-teal-100',
      text: 'text-teal-700',
      iconBg: 'bg-teal-500'
    }
  };

  const sizes = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  };

  const v = variants[variant];
  const s = sizes[size];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${v.bg} ${v.text} ${s} border-2 rounded-2xl flex flex-col items-center gap-2 transition-all hover:shadow-lg hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none relative`}
    >
      {badge && (
        <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs font-black rounded-full flex items-center justify-center shadow-md">
          {badge}
        </span>
      )}
      <div className={`${v.iconBg} ${size === 'sm' ? 'w-8 h-8' : size === 'md' ? 'w-10 h-10' : 'w-12 h-12'} rounded-xl flex items-center justify-center text-white`}>
        {icon}
      </div>
      <span className="text-xs font-black text-center">{title}</span>
      {subtitle && <span className="text-[10px] font-bold text-center opacity-80">{subtitle}</span>}
    </button>
  );
};

export default ActionCard;
