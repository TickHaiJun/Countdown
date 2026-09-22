import { DAY_MS } from './time';

export const MILESTONE_DAYS = [100, 50, 30, 10, 3, 1] as const;

export type MilestoneDay = (typeof MILESTONE_DAYS)[number];

/**
 * 里程碑按「展示口径」判定——天数取 floor，
 * 保证「屏幕上显示 3 天」时「3 天」徽章一定是点亮的，不会自相矛盾。
 */
export function displayedDays(remainingMs: number): number {
  return Math.max(0, Math.floor(remainingMs / DAY_MS));
}

export function achievedMilestones(remainingMs: number): number[] {
  const days = displayedDays(remainingMs);
  return MILESTONE_DAYS.filter((milestone) => days <= milestone).map((m) => m as number);
}

export function isMilestoneAchieved(remainingMs: number, milestone: number): boolean {
  return displayedDays(remainingMs) <= milestone;
}
