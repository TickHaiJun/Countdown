'use client';

import { cn } from '@/lib/utils';

interface ProgressBarProps {
  /** 0–1 */
  progress: number;
  label?: string;
  className?: string;
}

export function ProgressBar({ progress, label, className }: ProgressBarProps) {
  const percent = Math.round(Math.min(1, Math.max(0, progress)) * 100);

  return (
    <div className={cn('w-full', className)}>
      <div
        className="h-[3px] w-full overflow-hidden rounded-full"
        style={{ background: 'rgba(255,255,255,0.08)' }}
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? '进度'}
      >
        <div
          className="h-full rounded-full transition-[width] duration-500 ease-out"
          style={{ width: `${percent}%`, background: 'var(--color-accent)' }}
        />
      </div>
      {label ? <p className="label-mono mt-2 text-center">{label}</p> : null}
    </div>
  );
}
