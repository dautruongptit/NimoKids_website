import type { ButtonHTMLAttributes, ReactNode } from 'react';

export default function Button({ children, variant = 'pink', className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string; children: ReactNode }) {
  return <button className={`squishy-button ${variant} ${className}`} {...props}>{children}</button>;
}
