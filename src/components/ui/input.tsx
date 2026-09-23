'use client';

import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const FIELD_BASE =
  'w-full rounded-control border border-line bg-surface-2 text-[calc(13px*var(--fs-scale))] text-ink placeholder:text-ink-3 transition-colors focus:border-accent/45 focus:bg-surface-3 focus:outline-none disabled:opacity-45';

export function Input({ className, ...props }: React.ComponentProps<'input'>) {
  return <input className={cn(FIELD_BASE, 'h-10 px-3.5', className)} {...props} />;
}

export function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      className={cn(FIELD_BASE, 'min-h-[76px] resize-y px-3.5 py-2.5 leading-relaxed', className)}
      {...props}
    />
  );
}

export function Label({ className, ...props }: React.ComponentProps<'label'>) {
  return (
    <label
      className={cn('block text-[calc(12px*var(--fs-scale))] font-medium text-ink-2', className)}
      {...props}
    />
  );
}

/**
 * 原生 select。
 *
 * 刻意不上 Radix 的 Select：表单里有 8 个重复方式选项、还有「第几个/周几」这种
 * 联动小控件，原生 select 在移动端有系统级选择器，键盘可达性也是免费的。
 */
export function NativeSelect({
  className,
  children,
  ...props
}: React.ComponentProps<'select'>) {
  return (
    <div className="relative">
      <select
        className={cn(
          FIELD_BASE,
          'h-10 cursor-pointer appearance-none pr-8',
          '[&>option]:bg-elev [&>option]:text-ink',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        size={13}
        strokeWidth={1.75}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-3"
      />
    </div>
  );
}

/** 表单行：标签 + 控件 + 可选说明 */
export function Field({
  label,
  hint,
  htmlFor,
  children,
  className,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint ? <p className="text-[calc(11px*var(--fs-scale))] leading-relaxed text-ink-3">{hint}</p> : null}
    </div>
  );
}

/** 分段控件：一组互斥选项，比 <select> 更贴合"国外产品"的观感 */
export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  className,
  ariaLabel,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (next: T) => void;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        'inline-flex items-center gap-0.5 rounded-control border border-line bg-surface-2 p-0.5',
        className,
      )}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'rounded-[7px] px-3 py-1.5 text-[calc(12px*var(--fs-scale))] font-medium transition-colors',
              active
                ? 'bg-accent text-accent-ink'
                : 'text-ink-2 hover:bg-surface-3 hover:text-ink',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
