import { useId, type SelectHTMLAttributes } from 'react';
interface Props extends SelectHTMLAttributes<HTMLSelectElement> { label: string }
export function Select({ label, id, children, ...props }: Props) {
  const generated = useId();
  const selectId = id ?? generated;
  return <div className="space-y-1"><label htmlFor={selectId} className="block">{label}</label><select {...props} id={selectId} className="field w-full">{children}</select></div>;
}
