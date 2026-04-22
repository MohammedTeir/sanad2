// utils/rtlUtils.ts
export const isRTL = (): boolean => {
  // Check if the document direction is RTL
  const htmlDir = document.documentElement.dir;
  return htmlDir === 'rtl' || htmlDir === 'RTL';
};

export const toggleRTL = (): void => {
  const htmlElement = document.documentElement;
  const currentDir = htmlElement.dir || 'ltr';
  
  if (currentDir === 'rtl') {
    htmlElement.dir = 'ltr';
  } else {
    htmlElement.dir = 'rtl';
  }
};