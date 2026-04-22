// components/ui/ProfessionalCard.tsx
import React from 'react';

interface ProfessionalCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  border?: 'none' | 'light' | 'medium';
  rounded?: 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  onClick?: () => void;
}

const ProfessionalCard: React.FC<ProfessionalCardProps> = ({
  children,
  className = '',
  hover = true,
  padding = 'md',
  border = 'light',
  rounded = '2xl',
  onClick
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  const borderClasses = {
    none: '',
    light: 'border border-gray-100',
    medium: 'border-2 border-gray-200'
  };

  const roundedClasses = {
    md: 'rounded-lg',
    lg: 'rounded-xl',
    xl: 'rounded-2xl',
    '2xl': 'rounded-[2rem]',
    '3xl': 'rounded-[2.5rem]'
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white ${borderClasses[border]} ${roundedClasses[rounded]} ${paddingClasses[padding]} ${
        hover ? 'shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1' : 'shadow-sm'
      } ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </div>
  );
};

export default ProfessionalCard;
