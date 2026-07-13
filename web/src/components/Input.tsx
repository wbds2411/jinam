import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function Input({ label, className = '', id, ...props }: InputProps) {
  const inputId = id ?? `input-${label.replace(/\s+/g, '-').toLowerCase()}`;
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label htmlFor={inputId} className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      <input
        id={inputId}
        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-ink focus:border-fire focus:outline-none focus:ring-1 focus:ring-fire dark:border-gray-600 dark:bg-gray-800 dark:text-paper"
        {...props}
      />
    </div>
  );
}
