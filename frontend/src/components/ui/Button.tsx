import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'destructive' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-md transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:transition-none select-none';

  const variants = {
    primary:
      'bg-forest-700 hover:bg-forest-800 text-white shadow-sm focus-visible:ring-forest-700 disabled:bg-surface-subdued disabled:text-charcoal-muted disabled:border disabled:border-surface-border',
    secondary:
      'bg-surface-subdued hover:bg-surface-border text-charcoal-primary focus-visible:ring-charcoal-primary disabled:opacity-50',
    danger:
      'bg-rose-700 hover:bg-rose-800 text-white shadow-sm focus-visible:ring-rose-700 disabled:opacity-50',
    destructive:
      'bg-rose-700 hover:bg-rose-800 text-white shadow-sm focus-visible:ring-rose-700 disabled:opacity-50',
    outline:
      'border border-surface-border bg-white hover:bg-surface-muted text-charcoal-primary focus-visible:ring-forest-700 disabled:opacity-50',
    ghost:
      'bg-transparent hover:bg-surface-muted text-charcoal-secondary hover:text-charcoal-primary focus-visible:ring-forest-700 disabled:opacity-50',
  };

  const sizes = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5',
  };

  const isDisabled = disabled || loading;

  return (
    <button
      className={twMerge(
        clsx(
          baseStyles,
          variants[variant],
          sizes[size],
          isDisabled && 'cursor-not-allowed opacity-70',
          className,
        ),
      )}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      {...props}
    >
      {loading && (
        <svg
          data-testid="button-spinner"
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
};
