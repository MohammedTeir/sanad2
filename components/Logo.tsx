// components/Logo.tsx
import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'light' | 'dark' | 'gradient';
  showFullText?: boolean;
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ 
  size = 'md', 
  variant = 'gradient',
  showFullText = false,
  className = ''
}) => {
  // Size mapping
  const sizeMap = {
    sm: { logo: 40, text: 24, fullText: 14 },
    md: { logo: 60, text: 36, fullText: 18 },
    lg: { logo: 80, text: 48, fullText: 24 },
    xl: { logo: 120, text: 72, fullText: 32 }
  };

  const { logo: logoSize, text: textSize, fullText: fullTextSize } = sizeMap[size];

  // Color variants
  const colors = {
    light: {
      primary: '#059669',
      secondary: '#047857',
      accent: '#10b981',
      gradient: 'url(#gradient-light)'
    },
    dark: {
      primary: '#064e3b',
      secondary: '#065f46',
      accent: '#059669',
      gradient: 'url(#gradient-dark)'
    },
    gradient: {
      primary: '#10b981',
      secondary: '#059669',
      accent: '#34d399',
      gradient: 'url(#gradient-main)'
    }
  };

  const currentColors = colors[variant];

  return (
    <svg 
      width={logoSize * (showFullText ? 2.5 : 1)} 
      height={logoSize} 
      viewBox="0 0 200 200" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Gradient for light variant */}
        <linearGradient id="gradient-light" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#059669" />
          <stop offset="50%" stopColor="#047857" />
          <stop offset="100%" stopColor="#065f46" />
        </linearGradient>

        {/* Gradient for dark variant */}
        <linearGradient id="gradient-dark" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#064e3b" />
          <stop offset="50%" stopColor="#065f46" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>

        {/* Main gradient */}
        <linearGradient id="gradient-main" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="50%" stopColor="#059669" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>

        {/* Shadow filter */}
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
          <feOffset dx="2" dy="2" result="offsetblur" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.3" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Glow filter */}
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Background Circle */}
      <circle 
        cx="100" 
        cy="100" 
        r="90" 
        fill="url(#gradient-main)" 
        opacity="0.1"
      />

      {/* Decorative outer ring */}
      <circle 
        cx="100" 
        cy="100" 
        r="85" 
        fill="none" 
        stroke={currentColors.primary} 
        strokeWidth="2"
        opacity="0.2"
      />

      {/* Main Arabic Calligraphy - سند */}
      <g filter="url(#shadow)">
        {/* Sin (س) - curved shape */}
        <path
          d="M 60 95 Q 75 80 90 95 Q 105 80 120 95"
          fill="none"
          stroke={currentColors.gradient}
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Nun (ن) - dot below */}
        <circle
          cx="135"
          cy="115"
          r="6"
          fill={currentColors.primary}
        />

        {/* Dal (د) - small curve */}
        <path
          d="M 145 95 Q 155 95 155 105 L 155 110"
          fill="none"
          stroke={currentColors.gradient}
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      {/* Decorative elements */}
      <g opacity="0.6">
        {/* Left decorative arc */}
        <path
          d="M 40 100 Q 30 100 30 100"
          fill="none"
          stroke={currentColors.accent}
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Right decorative arc */}
        <path
          d="M 160 100 Q 170 100 170 100"
          fill="none"
          stroke={currentColors.accent}
          strokeWidth="3"
          strokeLinecap="round"
        />
      </g>

      {/* Full name text if requested */}
      {showFullText && (
        <g>
          <text
            x="100"
            y="155"
            fontFamily="Arial, sans-serif"
            fontSize={fullTextSize}
            fontWeight="bold"
            fill={currentColors.secondary}
            textAnchor="middle"
            letterSpacing="2"
          >
            سند
          </text>
          <text
            x="100"
            y="175"
            fontFamily="Arial, sans-serif"
            fontSize={fullTextSize - 4}
            fill={currentColors.primary}
            textAnchor="middle"
            opacity="0.7"
          >
            نظام إدارة المخيمات
          </text>
        </g>
      )}

      {/* Shine effect */}
      <ellipse
        cx="70"
        cy="70"
        rx="30"
        ry="20"
        fill="white"
        opacity="0.1"
        transform="rotate(-45 70 70)"
      />
    </svg>
  );
};

export default Logo;
