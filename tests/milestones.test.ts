import { describe, expect, it } from 'vitest';
import { MILESTONE_DAYS, achievedMilestones, displayedDays } from '@/lib/milestones';
import { DAY_MS, HOUR_MS } from '@/lib/time';

describe('displayedDays', () => {
  it('按展示口径取 floor，与屏幕上看到的数字一致', () => {
    expect(displayedDays(3 * DAY_MS + 7 * HOUR_MS)).toBe(3);
    expect(displayedDays(3 * DAY_MS)).toBe(3);
    expect(displayedDays(3 * DAY_MS - 1)).toBe(2);
  });

  it('负数归零', () => {
    expect(displayedDays(-DAY_MS)).toBe(0);
  });
});

describe('achievedMilestones', () => {
  it('还剩 3 天 7 小时时，3 天徽章已经点亮（不会与屏幕数字矛盾）', () => {
    expect(achievedMilestones(3 * DAY_MS + 7 * HOUR_MS)).toEqual([100, 50, 30, 10, 3]);
  });

  it('刚好剩 10 天时点亮到 10 天', () => {
    expect(achievedMilestones(10 * DAY_MS)).toEqual([100, 50, 30, 10]);
  });

  it('多于 100 天时一个都不亮', () => {
    expect(achievedMilestones(200 * DAY_MS)).toEqual([]);
  });

  it('已到点或已过期时全部点亮', () => {
    expect(achievedMilestones(0)).toEqual([...MILESTONE_DAYS]);
    expect(achievedMilestones(-DAY_MS)).toEqual([...MILESTONE_DAYS]);
  });
});
