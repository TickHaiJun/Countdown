'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;

interface SheetContentProps
  extends React.ComponentProps<typeof DialogPrimitive.Content> {
  closeLabel?: string;
}

/**
 * 右侧抽屉。
 *
 * 设置面板用它承载——「三个页面」的约定下，设置不能再占一个路由，
 * 于是变成一个浮层。宽度在窄屏退化成整屏，避免手机上留一条背景缝。
 */
export function SheetContent({
  className,
  children,
  closeLabel = 'Close',
  ...props
}: SheetContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        className={cn(
          'fixed inset-0 z-[60] bg-base/80 backdrop-blur-md',
          'data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:duration-300',
          'data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:duration-200',
        )}
      />
      <DialogPrimitive.Content
        className={cn(
          'fixed inset-y-0 right-0 z-[61] flex w-[min(440px,100%)] flex-col',
          'border-l border-line bg-elev shadow-[-24px_0_72px_rgba(0,0,0,0.55)]',
          'data-[state=open]:animate-in data-[state=open]:slide-in-from-right data-[state=open]:duration-300',
          'data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=closed]:duration-200',
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close
          className="absolute right-4 top-4 rounded-lg p-1.5 text-ink-3 transition-colors hover:bg-white/[0.06] hover:text-ink"
          aria-label={closeLabel}
        >
          <X size={15} strokeWidth={1.75} />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function SheetHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div className={cn('border-b border-line px-6 py-5 pr-14', className)} {...props} />
  );
}

export function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={cn('font-display text-[17px] tracking-tight', className)}
      {...props}
    />
  );
}

export function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      className={cn('mt-1 text-[12px] leading-relaxed text-ink-2', className)}
      {...props}
    />
  );
}

/** 抽屉内可滚动的正文区 */
export function SheetBody({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('flex-1 overflow-y-auto px-6 py-5', className)} {...props} />;
}

export function SheetFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('border-t border-line px-6 py-4', className)}
      {...props}
    />
  );
}
