// components/ui/PageHeader.tsx
import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  onRefresh?: () => void;
  refreshing?: boolean;
  actionButton?: {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    color?: 'emerald' | 'blue' | 'amber' | 'red';
  };
  breadcrumb?: { label: string; href?: string }[];
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  icon,
  onRefresh,
  refreshing = false,
  actionButton,
  breadcrumb
}) => {
  return (
    <div className="bg-white rounded-[2rem] border-2 border-gray-100 shadow-sm p-6 mb-6">
      {breadcrumb && breadcrumb.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-gray-500 font-bold mb-3">
          {breadcrumb.map((crumb, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <span className="text-gray-300">/</span>}
              {crumb.href ? (
                <a href={crumb.href} className="hover:text-emerald-600 transition-colors">
                  {crumb.label}
                </a>
              ) : (
                <span className="text-emerald-600">{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </div>
      )}
      
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          {icon && (
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-2xl flex items-center justify-center text-emerald-600 shadow-inner">
              {icon}
            </div>
          )}
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-800 mb-1">{title}</h1>
            {subtitle && <p className="text-gray-500 font-bold text-sm">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={refreshing}
              className="w-12 h-12 bg-gray-50 hover:bg-gray-100 rounded-2xl flex items-center justify-center transition-all disabled:opacity-50"
              title="تحديث"
            >
              <svg className={`w-6 h-6 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          )}
          
          {actionButton && (
            <button
              onClick={actionButton.onClick}
              className={`px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 transition-all hover:shadow-lg hover:-translate-y-0.5 ${
                actionButton.color === 'emerald' ? 'bg-emerald-600 text-white hover:bg-emerald-700' :
                actionButton.color === 'blue' ? 'bg-blue-600 text-white hover:bg-blue-700' :
                actionButton.color === 'amber' ? 'bg-amber-600 text-white hover:bg-amber-700' :
                'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              {actionButton.icon}
              {actionButton.label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PageHeader;
