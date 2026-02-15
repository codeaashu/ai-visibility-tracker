import * as React from 'react';
import { cn } from '@/lib/ui/utils';

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn('flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500', className)}
    {...props}
  />
));
Input.displayName = 'Input';

export { Input };
