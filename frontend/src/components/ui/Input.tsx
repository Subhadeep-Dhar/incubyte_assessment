import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, id, className, disabled, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    const errorId = inputId && error ? `${inputId}-error` : undefined;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold tracking-wide uppercase text-charcoal-primary"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={errorId}
          className={twMerge(
            clsx(
              'w-full px-3.5 py-2 text-sm rounded-md border bg-white text-charcoal-primary placeholder:text-charcoal-muted',
              'transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
              error
                ? 'border-rose-500 focus-visible:ring-rose-500'
                : 'border-surface-border hover:border-charcoal-muted focus-visible:ring-forest-700',
              disabled &&
                'bg-surface-muted text-charcoal-muted cursor-not-allowed border-surface-border',
              className,
            ),
          )}
          {...props}
        />
        {error && (
          <p id={errorId} className="text-xs text-rose-600 font-medium">
            {error}
          </p>
        )}
        {!error && helperText && <p className="text-xs text-charcoal-secondary">{helperText}</p>}
      </div>
    );
  },
);

Input.displayName = 'Input';
