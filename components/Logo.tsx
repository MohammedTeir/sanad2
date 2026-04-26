// components/Logo.tsx
import React from 'react';

interface LogoProps {
  /** 
   * Predefined size presets:
   * sm: 48px (Browser-tab scale / Compact UI)
   * md: 120px (Standard / Cards)
   * lg: 160px (Login / Hero headers)
   * xl: 240px (Large Hero / Splash screens)
   */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Custom width in pixels, overrides size preset */
  width?: number;
  variant?: 'light' | 'dark' | 'gradient'; 
  showFullText?: boolean;
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ 
  size = 'md', 
  width,
  showFullText = false,
  className = ''
}) => {
  // Size mapping based on professional standards for the login card
  const sizeMap = {
    sm: 48,
    md: 120,
    lg: 160,
    xl: 240
  };

  const baseWidth = width || sizeMap[size];

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <img 
        src="/logo.svg" 
        alt="سند Logo" 
        style={{ 
          width: showFullText ? baseWidth * 1.2 : baseWidth,
          height: 'auto',
          maxWidth: '100%'
        }}
        className="block transition-all duration-300 drop-shadow-sm"
      />
      {showFullText && (
        <div className="mt-4 text-center">
          <span className="block font-black text-emerald-800" style={{ fontSize: baseWidth * 0.15 }}>
            سند
          </span>
          <span className="block font-bold text-emerald-600 opacity-70" style={{ fontSize: baseWidth * 0.1 }}>
            نظام إدارة المخيمات
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;
