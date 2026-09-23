'use client';

import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { PomodoroTimer } from '@/components/pomodoro/PomodoroTimer';
import AnimatedContent from '@/components/reactbits/AnimatedContent';
import CountUp from '@/components/reactbits/CountUp';
import GlareHover from '@/components/reactbits/GlareHover';
import SpotlightCard from '@/components/reactbits/SpotlightCard';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useHydrated } from '@/hooks/use-hydrated';
import { useTodayStats } from '@/hooks/use-today-stats';
import { useI18n, type MessageKey } from '@/i18n';
import {
  clampConfigNumber,
  POMODORO_LIMITS,
  type PomodoroNumberField,
} from '@/lib/pomodoro';
import { cn } from '@/lib/utils';
import { usePomodoroStore } from '@/store/pomodoro-store';

/** 预设只覆盖三个时长，轮次与开关保持用户当前的选择 */
const PRESETS: {
  id: string;
  labelKey: MessageKey;
  focusMin: number;
  shortMin: number;
  longMin: number;
}[] = [
  { id: 'classic', labelKey: 'pomodoro.presetClassic', focusMin: 25, shortMin: 5, longMin: 15 },
  { id: 'deep', labelKey: 'pomodoro.presetDeep', focusMin: 50, shortMin: 10, longMin: 20 },
  { id: 'quick', labelKey: 'pomodoro.presetQuick', focusMin: 15, shortMin: 3, longMin: 10 },
];

/**
 * 数字输入。
 *
 * 不能边输边夹：`longEvery` 下限是 2，想输 12 时刚敲下 "1" 就被夹成 2，
 * 接着敲 "0" 变成 20 再夹回 12 —— 根本输不进去。
 * 所以策略是：**在范围内就实时生效，超出范围先只改草稿，失焦时再夹一次**。
 */
function NumberField({
  id,
  label,
  suffix,
  field,
  value,
  onChange,
}: {
  id: string;
  label: string;
  suffix: string;
  field: PomodoroNumberField;
  value: number;
  onChange: (next: number) => void;
}) {
  const [draft, setDraft] = useState(String(value));
  const { min, max } = POMODORO_LIMITS[field];

  // 预设按钮改了值、或 store rehydrate 之后，草稿要跟上
  useEffect(() => setDraft(String(value)), [value]);

  const commit = (raw: string) => {
    const next = clampConfigNumber(field, Number(raw), value);
    setDraft(String(next));
    onChange(next);
  };

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          value={draft}
          onChange={(event) => {
            const raw = event.target.value;
            setDraft(raw);
            const parsed = Number(raw);
            if (raw !== '' && Number.isFinite(parsed) && parsed >= min && parsed <= max) {
              onChange(Math.round(parsed));
            }
          }}
          onBlur={(event) => commit(event.target.value)}
          className="pr-16 font-mono tabular-nums"
        />
        <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[calc(11.5px*var(--fs-scale))] text-ink-3">
          {suffix}
        </span>
      </div>
    </div>
  );
}

/**
 * 番茄工作法页面主体。
 *
 * 结构：页头 → 计时主卡（PomodoroTimer，自带大屏浮层）→ 设置 + 统计。
 * 计时状态与配置都在 store 里，这里和 PomodoroTimer 各取所需，不做 prop 传递。
 */
export function PomodoroBoard() {
  const hydrated = useHydrated();
  const { t } = useI18n();

  const config = usePomodoroStore((state) => state.config);
  const updateConfig = usePomodoroStore((state) => state.updateConfig);
  const clearStats = usePomodoroStore((state) => state.clearStats);

  const stats = useTodayStats();

  const isPresetActive = (preset: (typeof PRESETS)[number]) =>
    config.focusMin === preset.focusMin &&
    config.shortMin === preset.shortMin &&
    config.longMin === preset.longMin;

  return (
    <>
      {/* ------------------------------------------------ 页头 */}
      <section className="page-x pt-10 md:pt-16">
        <AnimatedContent distance={16} duration={0.65} threshold={0}>
          <p className="label-mono">{t('pomodoro.eyebrow')}</p>
          <h1 className="display-lg mt-3 text-ink">{t('pomodoro.title')}</h1>
          <p className="mt-3 max-w-2xl text-[calc(13.5px*var(--fs-scale))] leading-relaxed text-ink-2">
            {t('pomodoro.subtitle')}
          </p>
        </AnimatedContent>
      </section>

      {/* ------------------------------------------------ 计时主卡 */}
      <section className="page-x mt-9">
        <PomodoroTimer />
      </section>

      {/* ------------------------------------------------ 设置 + 统计 */}
      <section className="page-x mt-12 grid gap-4 lg:grid-cols-[1.55fr_1fr]">
        {/*
          设置面板整体等 hydrate 之后再渲染：数字输入是受控的，
          若先按默认值渲染再跳到本地配置，会看到一次明显的闪动。
        */}
        <SpotlightCard className="h-full" spotlightColor="rgba(96, 165, 250, 0.14)">
          <div className="flex h-full flex-col p-6">
            <h2 className="font-display text-[calc(17px*var(--fs-scale))] tracking-tight text-ink">
              {t('pomodoro.settingsTitle')}
            </h2>

            {!hydrated ? (
              <div className="mt-6 h-[168px]" aria-hidden="true" />
            ) : (
              <>
                {/* 预设 */}
                <div className="mt-6">
                  <p className="label-mono">{t('pomodoro.presetLabel')}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {PRESETS.map((preset) => {
                      const active = isPresetActive(preset);
                      return (
                        <GlareHover
                          key={preset.id}
                          width="auto"
                          height="auto"
                          background="transparent"
                          borderColor="transparent"
                          borderRadius="9999px"
                          glareColor="#b3e5ff"
                          glareOpacity={0.22}
                          glareAngle={-30}
                          glareSize={200}
                          transitionDuration={650}
                          style={{ placeItems: 'stretch', cursor: 'default' }}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              updateConfig({
                                focusMin: preset.focusMin,
                                shortMin: preset.shortMin,
                                longMin: preset.longMin,
                              })
                            }
                            aria-pressed={active}
                            className={cn(
                              'rounded-full border px-3.5 py-1.5 text-[calc(12px*var(--fs-scale))] transition-colors',
                              active
                                ? 'border-accent/45 bg-accent/12 text-accent'
                                : 'border-line text-ink-2 hover:border-line-strong hover:text-ink',
                            )}
                          >
                            {t(preset.labelKey)}
                          </button>
                        </GlareHover>
                      );
                    })}
                  </div>
                </div>

                {/* 时长 */}
                <div className="mt-7 grid gap-5 sm:grid-cols-2">
                  <NumberField
                    id="pomodoro-focus"
                    label={t('pomodoro.focusTime')}
                    suffix={t('pomodoro.unitMinute')}
                    field="focusMin"
                    value={config.focusMin}
                    onChange={(focusMin) => updateConfig({ focusMin })}
                  />
                  <NumberField
                    id="pomodoro-short"
                    label={t('pomodoro.shortTime')}
                    suffix={t('pomodoro.unitMinute')}
                    field="shortMin"
                    value={config.shortMin}
                    onChange={(shortMin) => updateConfig({ shortMin })}
                  />
                  <NumberField
                    id="pomodoro-long"
                    label={t('pomodoro.longTime')}
                    suffix={t('pomodoro.unitMinute')}
                    field="longMin"
                    value={config.longMin}
                    onChange={(longMin) => updateConfig({ longMin })}
                  />
                  <NumberField
                    id="pomodoro-every"
                    label={t('pomodoro.longEvery')}
                    suffix={t('pomodoro.longEveryUnit')}
                    field="longEvery"
                    value={config.longEvery}
                    onChange={(longEvery) => updateConfig({ longEvery })}
                  />
                </div>

                {/* 开关 */}
                <div className="mt-7 space-y-4 border-t border-line pt-6">
                  <label className="flex items-start justify-between gap-4">
                    <span>
                      <span className="block text-[calc(13px*var(--fs-scale))] text-ink">{t('pomodoro.autoNext')}</span>
                      <span className="mt-1 block text-[calc(11.5px*var(--fs-scale))] leading-relaxed text-ink-3">
                        {t('pomodoro.autoNextHint')}
                      </span>
                    </span>
                    <Switch
                      checked={config.autoNext}
                      onCheckedChange={(autoNext) => updateConfig({ autoNext })}
                      aria-label={t('pomodoro.autoNext')}
                    />
                  </label>

                  <label className="flex items-start justify-between gap-4">
                    <span>
                      <span className="block text-[calc(13px*var(--fs-scale))] text-ink">{t('pomodoro.sound')}</span>
                      <span className="mt-1 block text-[calc(11.5px*var(--fs-scale))] leading-relaxed text-ink-3">
                        {t('pomodoro.soundHint')}
                      </span>
                    </span>
                    <Switch
                      checked={config.sound}
                      onCheckedChange={(sound) => updateConfig({ sound })}
                      aria-label={t('pomodoro.sound')}
                    />
                  </label>
                </div>
              </>
            )}
          </div>
        </SpotlightCard>

        {/* 统计 */}
        <SpotlightCard className="h-full" spotlightColor="rgba(96, 165, 250, 0.14)">
          <div className="flex h-full flex-col p-6">
            <div className="flex-1">
              <StatLine
                value={stats.count}
                suffix={t('pomodoro.unitCount')}
                label={t('pomodoro.todayCount')}
                ready={hydrated}
              />
              <StatLine
                value={Math.round(stats.focusMs / 60_000)}
                suffix={t('pomodoro.unitMinute')}
                label={t('pomodoro.todayFocus')}
                ready={hydrated}
                className="mt-7"
              />
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={clearStats}
              disabled={!hydrated || (stats.count === 0 && stats.focusMs === 0)}
              className="mt-6 w-fit gap-1.5"
            >
              <Trash2 size={13} strokeWidth={1.75} />
              {t('pomodoro.clearStats')}
            </Button>
          </div>
        </SpotlightCard>
      </section>
    </>
  );
}

function StatLine({
  value,
  suffix,
  label,
  ready,
  className,
}: {
  value: number;
  suffix: string;
  label: string;
  ready: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="flex items-baseline gap-1.5 font-display leading-none text-ink">
        {ready ? (
          <CountUp to={value} duration={1.2} className="text-[clamp(2rem,4vw,2.6rem)]" />
        ) : (
          // 未 hydrate 时保留占位符，避免 0 → 真实值 的跳动
          <span className="text-[clamp(2rem,4vw,2.6rem)] text-ink-3">—</span>
        )}
        <span className="text-[calc(12px*var(--fs-scale))] text-ink-3">{suffix}</span>
      </p>
      <p className="label-mono mt-2.5">{label}</p>
    </div>
  );
}
