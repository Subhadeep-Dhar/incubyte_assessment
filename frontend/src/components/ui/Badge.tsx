import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'in-stock' | 'low-stock' | 'out-of-stock' | 'neutral';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  className,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide transition-colors duration-150';

  const variants = {
    'in-stock': 'bg-emerald-50 text-emerald-800 border border-emerald-200',
    'low-stock': 'bg-amber-50 text-amber-800 border border-amber-200',
    'out-of-stock': 'bg-rose-50 text-rose-800 border border-rose-200',
    neutral: 'bg-surface-subdued text-charcoal-secondary border border-surface-border',
  };

  return (
    <span
      className={twMerge(clsx(baseStyles, variants[variant], className))}
      {...props}
    >
      {children}
    </span>
  );
};
