import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
}

export function Button({ children, variant = 'primary', className = '', ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center rounded-lg px-4 py-2 font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fire disabled:opacity-50';
  const styles = {
    primary: 'bg-ink text-paper hover:bg-gray-700 dark:bg-paper dark:text-ink dark:hover:bg-gray-200',
    secondary: 'bg-gray-200 text-ink hover:bg-gray-300 dark:bg-gray-700 dark:text-paper',
    ghost: 'text-ink hover:bg-gray-100 dark:text-paper dark:hover:bg-gray-800',
  };
  return (
    <button className={`${base} ${styles[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
