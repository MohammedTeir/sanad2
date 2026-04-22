// components/LoadingSkeleton.tsx
import React from 'react';

interface SkeletonProps {
  className?: string;
  count?: number;
  variant?: 'text' | 'rectangular' | 'circular' | 'card' | 'table';
}

const LoadingSkeleton: React.FC<SkeletonProps> = ({ 
  className = '', 
  count = 1, 
  variant = 'text' 
}) => {
  const baseClasses = "animate-pulse bg-gray-200";
  
  const getVariantClasses = () => {
    switch (variant) {
      case 'text':
        return "h-4 rounded-md";
      case 'rectangular':
        return "rounded-xl";
      case 'circular':
        return "rounded-full";
      case 'card':
        return "h-64 rounded-2xl";
      case 'table':
        return "h-12 rounded-lg";
      default:
        return "h-4 rounded-md";
    }
  };

  const skeletons = Array.from({ length: count }, (_, index) => (
    <div
      key={index}
      className={`${baseClasses} ${getVariantClasses()} ${className}`}
      style={{
        marginBottom: index < count - 1 ? '1rem' : '0'
      }}
    />
  ));

  return <>{skeletons}</>;
};

export default LoadingSkeleton;