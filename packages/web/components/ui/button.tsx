'use client';

import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type ButtonHTMLAttributes } from 'react';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-betcoin-dark disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        default:
          'bg-betcoin-primary text-black hover:bg-betcoin-primary/80 focus:ring-betcoin-primary',
        secondary:
          'bg-betcoin-secondary text-white hover:bg-betcoin-secondary/80 border border-gray-700',
        success:
          'bg-betcoin-accent text-black hover:bg-betcoin-accent/80 focus:ring-betcoin-accent',
        destructive:
          'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
        outline:
          'border border-gray-700 bg-transparent text-white hover:bg-betcoin-secondary',
        ghost:
          'bg-transparent text-gray-400 hover:text-white hover:bg-betcoin-secondary',
        link: 'text-betcoin-primary underline-offset-4 hover:underline bg-transparent',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-12 px-6 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
