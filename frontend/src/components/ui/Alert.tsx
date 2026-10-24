import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  action?: React.ReactNode;
  onClose?: () => void;
  children: React.ReactNode;
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  action,
  onClose,
  children,
  className,
  ...props
}) => {
  const baseStyles = 'rounded-lg p-4 border text-sm transition-all duration-150';

  const variants = {
    error: 'bg-rose-50 text-rose-900 border-rose-200',
    success: 'bg-emerald-50 text-emerald-900 border-emerald-200',
    warning: 'bg-amber-50 text-amber-900 border-amber-200',
    info: 'bg-surface-muted text-charcoal-primary border-surface-border',
  };

  return (
    <div
      role="alert"
      className={twMerge(clsx(baseStyles, variants[variant], className))}
      {...props}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          {title && <h4 className="font-semibold mb-1 text-sm">{title}</h4>}
          <div className="leading-relaxed">{children}</div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
        {onClose && (
          <button
            type="button"
            aria-label="Close alert"
            onClick={onClose}
            className="shrink-0 text-current opacity-60 hover:opacity-100 transition-opacity text-xs font-bold px-1"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};
