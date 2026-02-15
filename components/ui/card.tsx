import * as React from 'react';
import { cn } from '@/lib/ui/utils';

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('rounded-xl border border-slate-200 bg-white shadow-sm', className)} {...props} />
  )
);
Card.displayName = 'Card';

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn('p-6 pb-2', className)} {...props} />
);
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn('text-lg font-semibold text-slate-900', className)} {...props} />
  )
);
CardTitle.displayName = 'CardTitle';

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn('p-6 pt-2', className)} {...props} />
);
CardContent.displayName = 'CardContent';

export { Card, CardHeader, CardTitle, CardContent };
