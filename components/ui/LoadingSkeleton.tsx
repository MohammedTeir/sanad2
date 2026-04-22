// components/ui/LoadingSkeleton.tsx
import React from 'react';

interface LoadingSkeletonProps {
  type?: 'card' | 'table' | 'list' | 'grid' | 'dashboard';
  count?: number;
  className?: string;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  type = 'card',
  count = 4,
  className = ''
}) => {
  if (type === 'dashboard') {
    return (
      <div className={`space-y-6 ${className}`}>
        {/* Hero Header Skeleton */}
        <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800 rounded-[2.5rem] p-6 md:p-10">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-white/20 rounded-[2rem] animate-pulse"></div>
              <div className="space-y-2">
                <div className="h-6 w-48 bg-white/20 rounded animate-pulse"></div>
                <div className="h-4 w-32 bg-white/20 rounded animate-pulse"></div>
              </div>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-2xl animate-pulse"></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white/10 rounded-2xl p-4">
                <div className="h-3 w-20 bg-white/20 rounded animate-pulse mb-2"></div>
                <div className="h-8 w-12 bg-white/20 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-[2rem] border-2 border-gray-100 p-6 animate-pulse">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-10 w-16 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="w-14 h-14 bg-gray-200 rounded-2xl animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className={`space-y-3 ${className}`}>
        {[...Array(count)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 border-2 border-gray-100 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-200 rounded-2xl"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                <div className="h-3 w-1/2 bg-gray-200 rounded"></div>
              </div>
              <div className="w-24 h-8 bg-gray-200 rounded-full"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'grid') {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 ${className}`}>
        {[...Array(count)].map((_, i) => (
          <div key={i} className="bg-white rounded-[2rem] border-2 border-gray-100 p-6 animate-pulse">
            <div className="flex items-start justify-between mb-4">
              <div className="space-y-2">
                <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="w-14 h-14 bg-gray-200 rounded-2xl animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Default card skeleton
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 ${className}`}>
      {[...Array(count)].map((_, i) => (
        <div key={i} className="bg-white rounded-[2rem] border-2 border-gray-100 p-6 animate-pulse">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-10 w-16 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="w-14 h-14 bg-gray-200 rounded-2xl animate-pulse"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default LoadingSkeleton;
