// hooks/useRTL.ts
import { useRTL } from '../contexts/RTLContext';

export const useRTLDirection = () => {
  const { isRTL } = useRTL();
  
  return {
    direction: isRTL ? 'rtl' : 'ltr',
    textAlign: isRTL ? 'right' : 'left',
    marginStart: isRTL ? 'marginRight' : 'marginLeft',
    marginEnd: isRTL ? 'marginLeft' : 'marginRight',
    paddingStart: isRTL ? 'paddingRight' : 'paddingLeft',
    paddingEnd: isRTL ? 'paddingLeft' : 'paddingRight',
    start: isRTL ? 'right' : 'left',
    end: isRTL ? 'left' : 'right',
  };
};