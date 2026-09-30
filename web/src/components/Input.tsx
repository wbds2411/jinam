import { useId, type InputHTMLAttributes } from 'react';
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
}
export function Input({ label, hint, error, className = '', id, ...props }: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const describedBy = [props['aria-describedby'], hint && `${inputId}-hint`, error && `${inputId}-error`].filter(Boolean).join(' ') || undefined;
  return <div className={`flex min-w-0 flex-col gap-1 ${className}`}>
    <label htmlFor={inputId} className="text-sm font-medium">{label}</label>
    {hint && <p id={`${inputId}-hint`} className="text-sm text-muted">{hint}</p>}
    <input {...props} id={inputId} aria-describedby={describedBy} aria-invalid={error ? true : props['aria-invalid']} className="field w-full" />
    {error && <p id={`${inputId}-error`} role="alert" className="text-sm text-danger">{error}</p>}
  </div>;
}
