import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { type HTMLAttributes } from 'react';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all duration-200',
  {
    variants: {
      variant: {
        default: 'bg-betcoin-primary/15 text-betcoin-primary border border-betcoin-primary/20',
        success: 'bg-betcoin-accent/15 text-betcoin-accent border border-betcoin-accent/20',
        destructive: 'bg-betcoin-red/15 text-betcoin-red-light border border-betcoin-red/20',
        outline: 'border border-white/10 text-gray-400 bg-white/5',
        live: 'bg-betcoin-red/20 text-white border border-betcoin-red/30 shadow-glow-red',
        win: 'bg-betcoin-accent/15 text-betcoin-accent-light border border-betcoin-accent/20',
        loss: 'bg-betcoin-red/15 text-betcoin-red-light border border-betcoin-red/20',
        pending: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {variant === 'live' && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
        </span>
      )}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };
