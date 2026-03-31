'use client';

import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

const buttonVariants = cva(
  'relative inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-betcoin-dark disabled:opacity-50 disabled:pointer-events-none rounded-xl',
  {
    variants: {
      variant: {
        default:
          'bg-gradient-to-r from-betcoin-primary to-betcoin-primary-light text-black hover:shadow-glow-orange',
        secondary:
          'bg-white/5 backdrop-blur-xl border border-white/10 text-white hover:bg-white/10 hover:border-white/20',
        success:
          'bg-gradient-to-r from-betcoin-accent to-betcoin-accent-light text-black hover:shadow-glow-green',
        destructive:
          'bg-gradient-to-r from-betcoin-red to-betcoin-red-light text-white hover:shadow-glow-red',
        outline:
          'border border-white/10 bg-transparent text-white hover:bg-white/5 hover:border-white/20',
        ghost:
          'bg-transparent text-gray-400 hover:text-white hover:bg-white/5',
        link: 'text-betcoin-primary underline-offset-4 hover:underline bg-transparent',
        purple:
          'bg-gradient-to-r from-betcoin-purple to-betcoin-purple-light text-white hover:shadow-glow-purple',
      },
      size: {
        sm: 'h-8 px-3 text-xs gap-1.5',
        md: 'h-10 px-4 text-sm gap-2',
        lg: 'h-12 px-6 text-base gap-2',
        xl: 'h-14 px-8 text-lg gap-3',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, disabled, ...props }, ref) => {
    return (
      <motion.button
        whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
        whileTap={{ scale: disabled || loading ? 1 : 0.97 }}
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...(props as HTMLMotionProps<'button'>)}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </motion.button>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
