import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/ui/utils';

const badgeVariants = cva('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', {
  variants: {
    variant: {
      default: 'bg-indigo-100 text-indigo-700',
      secondary: 'bg-slate-100 text-slate-700',
      success: 'bg-emerald-100 text-emerald-700',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge };
