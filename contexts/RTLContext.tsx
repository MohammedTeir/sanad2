// contexts/RTLContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';

interface RTLContextType {
  isRTL: boolean;
  toggleRTL: () => void;
  setRTL: (rtl: boolean) => void;
}

const RTLContext = createContext<RTLContextType | undefined>(undefined);

export const useRTL = () => {
  const context = useContext(RTLContext);
  if (context === undefined) {
    throw new Error('useRTL must be used within an RTLProvider');
  }
  return context;
};

interface RTLProviderProps {
  children: React.ReactNode;
}

export const RTLProvider: React.FC<RTLProviderProps> = ({ children }) => {
  const [isRTL, setIsRTL] = useState(() => {
    // Check localStorage first, then default to true for Arabic
    const savedRTL = localStorage.getItem('isRTL');
    return savedRTL ? JSON.parse(savedRTL) : true;
  });

  useEffect(() => {
    // Update document direction when isRTL changes
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = isRTL ? 'ar' : 'en';
    
    // Save preference to localStorage
    localStorage.setItem('isRTL', JSON.stringify(isRTL));
  }, [isRTL]);

  const toggleRTL = () => {
    setIsRTL(prev => !prev);
  };

  const setRTL = (rtl: boolean) => {
    setIsRTL(rtl);
  };

  const value = {
    isRTL,
    toggleRTL,
    setRTL
  };

  return (
    <RTLContext.Provider value={value}>
      {children}
    </RTLContext.Provider>
  );
};