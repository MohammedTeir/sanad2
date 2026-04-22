// components/RTLText.tsx
import React from 'react';
import { useRTLDirection } from '../hooks/useRTL';

// Declare JSX namespace for TypeScript
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

interface RTLTextProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  as?: keyof JSX.IntrinsicElements;
}

export const RTLText: React.FC<RTLTextProps> = ({
  children,
  className = '',
  style = {},
  as: Tag = 'span'
}) => {
  const { textAlign, direction } = useRTLDirection();

  const combinedStyles: React.CSSProperties = {
    direction,
    textAlign,
    ...style
  };

  return (
    <Tag className={className} style={combinedStyles}>
      {children}
    </Tag>
  );
};

// RTLView component for compatibility
export const RTLView: React.FC<{ children: React.ReactNode; className?: string; style?: React.CSSProperties }> = ({
  children,
  className = '',
  style = {}
}) => {
  const { direction } = useRTLDirection();
  
  return (
    <div className={className} style={{ direction, ...style }}>
      {children}
    </div>
  );
};