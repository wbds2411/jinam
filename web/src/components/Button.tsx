import type { ButtonHTMLAttributes, ReactNode } from 'react';
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
}
export function Button({ children, variant = 'primary', className = '', type = 'button', ...props }: ButtonProps) {
  const styles = {
    primary: 'border-transparent bg-primary text-on-primary',
    secondary: 'border-control bg-surface text-content',
    ghost: 'border-transparent text-content',
    danger: 'border-danger bg-surface text-danger',
  };
  return <button type={type} className={`inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-xl border px-4 py-2 font-medium transition-colors duration-150 enabled:hover:underline disabled:cursor-not-allowed disabled:opacity-60 ${styles[variant]} ${className}`} {...props}>{children}</button>;
}
