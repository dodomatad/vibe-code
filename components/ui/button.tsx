/**
 * Button Component v3.0.0
 *
 * Accessible button with variants and loading state
 *
 * Features:
 * - WCAG 2.1 AA compliant
 * - Keyboard accessible
 * - Loading state
 * - Multiple variants
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// ============================================================================
// Button Variants
// ============================================================================

const buttonVariants = cva(
  // Base styles
  [
    'inline-flex items-center justify-center rounded-md font-medium',
    'transition-colors duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    'cursor-pointer',
  ],
  {
    variants: {
      variant: {
        primary: [
          'bg-brand-500 text-white',
          'hover:bg-brand-600',
          'focus-visible:ring-brand-500',
        ],
        secondary: [
          'bg-neutral-100 text-neutral-900',
          'hover:bg-neutral-200',
          'focus-visible:ring-neutral-500',
          'dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700',
        ],
        outline: [
          'border border-neutral-300 bg-transparent',
          'hover:bg-neutral-100',
          'focus-visible:ring-neutral-500',
          'dark:border-neutral-700 dark:hover:bg-neutral-800',
        ],
        ghost: [
          'bg-transparent',
          'hover:bg-neutral-100',
          'focus-visible:ring-neutral-500',
          'dark:hover:bg-neutral-800',
        ],
        danger: [
          'bg-error text-white',
          'hover:bg-error/90',
          'focus-visible:ring-error',
        ],
        success: [
          'bg-success text-white',
          'hover:bg-success/90',
          'focus-visible:ring-success',
        ],
      },
      size: {
        sm: 'h-9 px-3 text-sm',
        md: 'h-10 px-4 text-base',
        lg: 'h-11 px-6 text-lg',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

// ============================================================================
// Button Component
// ============================================================================

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /**
   * Show loading spinner
   */
  loading?: boolean;

  /**
   * Icon to show before text
   */
  leftIcon?: React.ReactNode;

  /**
   * Icon to show after text
   */
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      loading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={loading || disabled}
        aria-busy={loading}
        aria-disabled={loading || disabled}
        {...props}
      >
        {loading && (
          <svg
            className="mr-2 h-4 w-4 animate-spin"
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
        {!loading && leftIcon && (
          <span className="mr-2" aria-hidden="true">
            {leftIcon}
          </span>
        )}
        {children}
        {!loading && rightIcon && (
          <span className="ml-2" aria-hidden="true">
            {rightIcon}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
