'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/lib/utils';

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-45',
  {
    variants: {
      variant: {
        /* 主操作：全站只有它用实心强调色 */
        primary: 'rounded-full bg-accent text-accent-ink hover:bg-accent-deep',
        outline:
          'rounded-full border border-line text-ink hover:border-line-strong hover:bg-white/[0.04]',
        subtle:
          'rounded-control border border-line bg-white/[0.04] text-ink hover:bg-white/[0.07]',
        danger: 'rounded-control border border-alert/35 text-alert hover:bg-alert/10',
        ghost: 'rounded-control text-ink-2 hover:bg-white/[0.05] hover:text-ink',
      },
      size: {
        sm: 'h-8 px-3 text-[12px]',
        md: 'h-10 px-5 text-[13px]',
        lg: 'h-11 px-6 text-[14px]',
        icon: 'h-9 w-9',
        'icon-sm': 'h-8 w-8',
      },
    },
    defaultVariants: {
      variant: 'subtle',
      size: 'md',
    },
  },
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Component = asChild ? Slot : 'button';
  return (
    <Component className={cn(buttonVariants({ variant, size }), className)} {...props} />
  );
}
