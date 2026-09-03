import { forwardRef, type InputHTMLAttributes } from 'react';

import { cn } from '../lib/cn';

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      'flex h-11 w-full rounded-md border border-input bg-background px-3.5 text-sm text-foreground',
      'transition-[border-color,box-shadow] placeholder:text-muted-foreground hover:border-primary/40',
      'focus-visible:border-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/15',
      'disabled:cursor-not-allowed disabled:opacity-50',
      className,
    )}
    {...props}
  />
));
Input.displayName = 'Input';
