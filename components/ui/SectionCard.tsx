// components/ui/SectionCard.tsx
import React from 'react';

interface SectionCardProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  headerAction?: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

const SectionCard: React.FC<SectionCardProps> = ({
  title,
  subtitle,
  icon,
  children,
  headerAction,
  className = '',
  noPadding = false
}) => {
  return (
    <div className={`bg-white rounded-[2rem] border-2 border-gray-100 shadow-sm overflow-hidden ${className}`}>
      {(title || headerAction) && (
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                {icon}
              </div>
            )}
            <div>
              <h3 className="font-black text-gray-800 text-lg">{title}</h3>
              {subtitle && <p className="text-gray-500 font-bold text-xs mt-0.5">{subtitle}</p>}
            </div>
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'p-6'}>
        {children}
      </div>
    </div>
  );
};

export default SectionCard;
