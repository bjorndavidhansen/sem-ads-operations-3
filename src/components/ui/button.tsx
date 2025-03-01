import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
          {
            // Variants
            'bg-primary-500 text-white hover:bg-primary-600 focus-visible:ring-primary-500': variant === 'primary',
            'bg-secondary-500 text-white hover:bg-secondary-600 focus-visible:ring-secondary-500': variant === 'secondary',
            'border border-surface-200 bg-white hover:bg-surface-50 focus-visible:ring-surface-500': variant === 'outline',
            'hover:bg-surface-100 hover:text-surface-900 focus-visible:ring-surface-500': variant === 'ghost',
            'bg-red-500 text-white hover:bg-red-600 focus-visible:ring-red-500': variant === 'danger',

            // Sizes
            'h-8 px-3 text-sm rounded': size === 'sm',
            'h-10 px-4 rounded-md': size === 'md',
            'h-12 px-6 text-lg rounded-lg': size === 'lg',

            // Loading state
            'relative !text-transparent transition-none': loading,
          },
          className
        )}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {children}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          </div>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };