import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

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

  const icons = {
    error: (
      <AlertCircle
        data-testid="alert-icon-error"
        className="w-4 h-4 text-rose-700 shrink-0 mt-0.5"
        aria-hidden="true"
      />
    ),
    success: (
      <CheckCircle2
        data-testid="alert-icon-success"
        className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5"
        aria-hidden="true"
      />
    ),
    warning: (
      <AlertTriangle
        data-testid="alert-icon-warning"
        className="w-4 h-4 text-amber-700 shrink-0 mt-0.5"
        aria-hidden="true"
      />
    ),
    info: (
      <Info
        data-testid="alert-icon-info"
        className="w-4 h-4 text-charcoal-secondary shrink-0 mt-0.5"
        aria-hidden="true"
      />
    ),
  };

  return (
    <div
      role="alert"
      className={twMerge(clsx(baseStyles, variants[variant], className))}
      {...props}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 flex-1">
          {icons[variant]}
          <div className="flex-1">
            {title && <h4 className="font-semibold mb-1 text-sm">{title}</h4>}
            <div className="leading-relaxed">{children}</div>
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
        {onClose && (
          <button
            type="button"
            aria-label="Close alert"
            onClick={onClose}
            className="shrink-0 text-current opacity-60 hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-700"
          >
            <X data-testid="alert-close-icon" className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
};
