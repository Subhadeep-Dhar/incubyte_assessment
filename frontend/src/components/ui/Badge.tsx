import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'in-stock' | 'low-stock' | 'out-of-stock' | 'neutral';
}

export const Badge: React.FC<BadgeProps> = ({ children }) => {
  return <span>{children}</span>;
};
