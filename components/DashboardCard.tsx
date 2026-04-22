// components/DashboardCard.tsx
import React from 'react';
import { useRTLDirection } from '../hooks/useRTL';

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: 'emerald' | 'blue' | 'amber' | 'red' | 'gray';
  trend?: {
    value: string;
    positive: boolean;
  };
  onClick?: () => void;
}

export const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  value,
  icon,
  color = 'emerald',
  trend,
  onClick
}) => {
  const { direction, textAlign } = useRTLDirection();
  
  const colorClasses = {
    emerald: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    blue: 'bg-blue-100 text-blue-800 border-blue-200',
    amber: 'bg-amber-100 text-amber-800 border-amber-200',
    red: 'bg-red-100 text-red-800 border-red-200',
    gray: 'bg-gray-100 text-gray-800 border-gray-200'
  };
  
  const bgColor = colorClasses[color];
  
  return (
    <div 
      className={`border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer ${onClick ? 'cursor-pointer' : ''}`}
      style={{ 
        direction,
        textAlign,
        borderColor: color === 'emerald' ? '#a7f3d0' : 
                     color === 'blue' ? '#bfdbfe' : 
                     color === 'amber' ? '#fef3c7' : 
                     color === 'red' ? '#fecaca' : '#e5e7eb'
      }}
      onClick={onClick}
    >
      <div className="flex justify-between items-start">
        <div>
          <p 
            className="text-sm font-medium text-gray-600 mb-1"
            style={{ textAlign }}
          >
            {title}
          </p>
          <p 
            className="text-2xl font-extrabold"
            style={{ textAlign }}
          >
            {value}
          </p>
          {trend && (
            <div 
              className={`flex items-center mt-2 text-sm ${
                trend.positive ? 'text-green-600' : 'text-red-600'
              }`}
              style={{ textAlign }}
            >
              <span>{trend.value}</span>
              {trend.positive ? (
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </div>
          )}
        </div>
        {icon && (
          <div className={`p-3 rounded-full ${bgColor}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};