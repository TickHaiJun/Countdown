'use client';

import * as SwitchPrimitive from '@radix-ui/react-switch';
import { cn } from '@/lib/utils';

export function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        'relative inline-flex h-[22px] w-[40px] shrink-0 cursor-pointer items-center rounded-full border border-line transition-colors',
        'data-[state=unchecked]:bg-surface-3',
        'data-[state=checked]:border-accent/50 data-[state=checked]:bg-accent/25',
        'disabled:cursor-not-allowed disabled:opacity-45',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          'pointer-events-none block h-[16px] w-[16px] rounded-full bg-ink-3 shadow-sm transition-transform duration-200',
          'translate-x-[2px]',
          'data-[state=checked]:translate-x-[20px] data-[state=checked]:bg-accent',
        )}
      />
    </SwitchPrimitive.Root>
  );
}
