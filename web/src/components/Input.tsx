import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function Input({ label, className = '', id, ...props }: InputProps) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label htmlFor={id} className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      <input
        id={id}
        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-ink focus:border-fire focus:outline-none focus:ring-1 focus:ring-fire dark:border-gray-600 dark:bg-gray-800 dark:text-paper"
        {...props}
      />
    </div>
  );
}
