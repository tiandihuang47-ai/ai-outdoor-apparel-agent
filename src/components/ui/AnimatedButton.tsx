import { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  loading?: boolean;
  loadingText?: string;
  success?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost';
}

export default function AnimatedButton({
  children,
  loading = false,
  loadingText,
  success = false,
  variant = 'primary',
  className,
  disabled,
  ...props
}: AnimatedButtonProps) {
  const baseStyles =
    'relative inline-flex items-center justify-center px-5 py-2.5 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary:
      'bg-gradient-to-r from-indigo-500 to-cyan-500 text-white hover:from-indigo-400 hover:to-cyan-400 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40',
    secondary:
      'bg-slate-800 text-slate-200 border border-slate-600 hover:bg-slate-700 hover:border-slate-500',
    ghost:
      'bg-transparent text-slate-300 hover:bg-white/5 hover:text-white',
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
          fill="none"
          viewBox="0 0 24 24"
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
      {success ? '✓' : loading && loadingText ? loadingText : children}
    </button>
  );
}
