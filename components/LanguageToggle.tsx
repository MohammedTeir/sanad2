// components/LanguageToggle.tsx
import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const LanguageToggle: React.FC = () => {
  const { language, toggleLanguage } = useLanguage();

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center justify-center p-2 rounded-full bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 shadow-sm"
      aria-label={language === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
    >
      {language === 'ar' ? (
        <span className="font-bold">EN</span>
      ) : (
        <span className="font-bold">AR</span>
      )}
    </button>
  );
};

export default LanguageToggle;