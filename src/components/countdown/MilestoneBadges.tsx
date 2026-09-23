'use client';

import { MILESTONE_DAYS, achievedMilestones } from '@/lib/milestones';
import { cn } from '@/lib/utils';

interface MilestoneBadgesProps {
  /** 距目标时刻的剩余毫秒 */
  remainingMs: number;
  className?: string;
}

export function MilestoneBadges({ remainingMs, className }: MilestoneBadgesProps) {
  const achieved = achievedMilestones(remainingMs);

  return (
    <div className={cn('flex flex-wrap items-center justify-center gap-1.5', className)}>
      <span className="label-mono mr-1">里程碑</span>
      {MILESTONE_DAYS.map((milestone) => {
        const on = achieved.includes(milestone);
        return (
          <span
            key={milestone}
            className={cn(
              'tnum rounded-full border px-2.5 py-1 text-[calc(11px*var(--fs-scale))] leading-none transition-colors',
              on
                ? 'border-transparent text-[var(--color-ink)]'
                : 'border-hairline-soft text-[var(--color-ink-3)]',
            )}
            style={on ? { background: 'rgba(129,140,248,0.16)' } : undefined}
          >
            {milestone} 天
          </span>
        );
      })}
    </div>
  );
}
