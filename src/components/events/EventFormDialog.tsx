'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input, Label, NativeSelect, Textarea } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useI18n, type MessageKey } from '@/i18n';
import { formatWeekdayIndex } from '@/i18n/format';
import { TAG_META } from '@/lib/tags';
import { createId } from '@/lib/uuid';
import {
  cnDayKey,
  cnMs,
  cnParts,
  pad2,
  parseDateInput,
  parseTimeInput,
  toCnIso,
} from '@/lib/time';
import { cn } from '@/lib/utils';
import { useCountdownStore } from '@/store/countdown-store';
import { useUiStore } from '@/store/ui-store';
import type { EventTag, Recurrence, RecurrenceKind } from '@/types';

const RECURRENCE_KINDS: RecurrenceKind[] = [
  'none',
  'daily',
  'weekly',
  'monthly',
  'yearly',
  'monthlyNthWeekday',
  'monthlyLastWorkday',
  'payday',
];

const RECURRENCE_LABEL_KEY: Record<RecurrenceKind, MessageKey> = {
  none: 'event.repeatKind.none',
  daily: 'event.repeatKind.daily',
  weekly: 'event.repeatKind.weekly',
  monthly: 'event.repeatKind.monthly',
  yearly: 'event.repeatKind.yearly',
  monthlyNthWeekday: 'event.repeatKind.monthlyNthWeekday',
  monthlyLastWorkday: 'event.repeatKind.monthlyLastWorkday',
  payday: 'event.repeatKind.payday',
};

interface FormState {
  title: string;
  tag: EventTag;
  allDay: boolean;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  note: string;
  pinned: boolean;
  kind: RecurrenceKind;
  weekdays: number[];
  day: string;
  month: string;
  nth: string;
  weekday: string;
  adjust: 'none' | 'forward' | 'backward';
}

function defaultForm(nowMs: number): FormState {
  const today = cnDayKey(nowMs);
  return {
    title: '',
    tag: 'life',
    allDay: true,
    startDate: today,
    startTime: '00:00',
    endDate: today,
    endTime: '23:59',
    note: '',
    pinned: false,
    kind: 'none',
    weekdays: [cnParts(nowMs).weekday],
    day: '15',
    month: '1',
    nth: '1',
    weekday: '1',
    adjust: 'backward',
  };
}

/** 围绕数字输入框的碎片文案：中英语序不同，所以拆成前/中/后三段拼 */
function InlineField({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2 text-[calc(12px*var(--fs-scale))] text-ink-2', className)}>
      {children}
    </div>
  );
}

export function EventFormDialog() {
  const { t, locale } = useI18n();

  const open = useUiStore((state) => state.composerOpen);
  const editingId = useUiStore((state) => state.editingId);
  const closeComposer = useUiStore((state) => state.closeComposer);

  const events = useCountdownStore((state) => state.events);
  const addEvent = useCountdownStore((state) => state.addEvent);
  const updateEvent = useCountdownStore((state) => state.updateEvent);
  const removeEvent = useCountdownStore((state) => state.removeEvent);

  const editing = useMemo(
    () => events.find((event) => event.id === editingId) ?? null,
    [events, editingId],
  );

  const [form, setForm] = useState<FormState>(() => defaultForm(Date.now()));
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const weekdayOptions = useMemo(
    () =>
      [1, 2, 3, 4, 5, 6, 0].map((value) => ({
        value,
        label: formatWeekdayIndex(value, locale),
      })),
    [locale],
  );

  useEffect(() => {
    if (!open) return;
    setError(null);
    setConfirmDelete(false);

    if (!editing) {
      setForm(defaultForm(Date.now()));
      return;
    }

    const startParts = cnParts(Date.parse(editing.start));
    const endParts = cnParts(Date.parse(editing.end));
    const rule = editing.recurrence;
    setForm({
      title: editing.title,
      tag: editing.tag,
      allDay: editing.allDay,
      startDate: cnDayKey(Date.parse(editing.start)),
      startTime: `${pad2(startParts.hour)}:${pad2(startParts.minute)}`,
      endDate: cnDayKey(Date.parse(editing.end)),
      endTime: `${pad2(endParts.hour)}:${pad2(endParts.minute)}`,
      note: editing.note ?? '',
      pinned: editing.pinned,
      kind: rule.kind,
      weekdays: rule.weekdays ?? [startParts.weekday],
      day: String(rule.day ?? startParts.day),
      month: String(rule.month ?? startParts.month),
      nth: String(rule.nth ?? 1),
      weekday: String(rule.weekday ?? startParts.weekday),
      adjust: rule.adjust ?? 'backward',
    });
  }, [open, editing]);

  const patch = (changes: Partial<FormState>) =>
    setForm((prev) => ({ ...prev, ...changes }));

  function buildRecurrence(): Recurrence {
    switch (form.kind) {
      case 'weekly':
        return { kind: 'weekly', weekdays: form.weekdays };
      case 'monthly':
        return { kind: 'monthly', day: Number(form.day) };
      case 'yearly':
        return { kind: 'yearly', month: Number(form.month), day: Number(form.day) };
      case 'monthlyNthWeekday':
        return {
          kind: 'monthlyNthWeekday',
          nth: Number(form.nth) as 1 | 2 | 3 | 4 | -1,
          weekday: Number(form.weekday),
        };
      case 'payday':
        return { kind: 'payday', day: Number(form.day), adjust: form.adjust };
      case 'daily':
        return { kind: 'daily', interval: 1 };
      case 'monthlyLastWorkday':
        return { kind: 'monthlyLastWorkday' };
      default:
        return { kind: 'none' };
    }
  }

  function resolveMs(dateValue: string, timeValue: string, fallbackMs: number): number {
    const date = parseDateInput(dateValue);
    if (!date) return fallbackMs;
    if (form.allDay) return cnMs(date.year, date.month, date.day, 0, 0, 0);
    const time = parseTimeInput(timeValue);
    return cnMs(date.year, date.month, date.day, time.hour, time.minute, 0);
  }

  function handleSubmit(submitEvent: React.FormEvent) {
    submitEvent.preventDefault();

    const title = form.title.trim();
    if (!title) {
      setError(t('event.errorTitleRequired'));
      return;
    }
    if (title.length > 60) {
      setError(t('event.errorTitleTooLong'));
      return;
    }

    const nowMs = Date.now();
    const startMs = resolveMs(form.startDate, form.startTime, nowMs);
    let endMs = resolveMs(form.endDate, form.endTime, nowMs);
    if (form.allDay) {
      const day = parseDateInput(form.endDate);
      if (day) endMs = cnMs(day.year, day.month, day.day, 23, 59, 59);
    }
    if (endMs < startMs) {
      setError(t('event.errorEndBeforeStart'));
      return;
    }

    const payload = {
      title,
      tag: form.tag,
      allDay: form.allDay,
      start: toCnIso(startMs),
      end: toCnIso(endMs),
      note: form.note.trim() || undefined,
      pinned: form.pinned,
      recurrence: buildRecurrence(),
      updatedAt: new Date().toISOString(),
    };

    if (editing) {
      updateEvent(editing.id, payload);
    } else {
      addEvent({
        ...payload,
        id: createId(),
        createdAt: new Date().toISOString(),
      });
    }
    closeComposer();
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? undefined : closeComposer())}>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>
            {editing ? t('event.editTitle') : t('event.newTitle')}
          </DialogTitle>
          <DialogDescription>{t('event.formHint')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <div className="flex flex-col gap-4 px-6 py-5">
            <div className="space-y-1.5">
              <Label htmlFor="event-title">{t('event.fieldTitle')}</Label>
              <Input
                id="event-title"
                value={form.title}
                maxLength={60}
                placeholder={t('event.fieldTitlePlaceholder')}
                onChange={(event) => patch({ title: event.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label>{t('event.fieldTag')}</Label>
              <div className="flex flex-wrap gap-1.5">
                {(['work', 'life', 'anniversary', 'payday', 'holiday'] as EventTag[]).map(
                  (tag) => {
                    const meta = TAG_META[tag];
                    const active = form.tag === tag;
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => patch({ tag })}
                        aria-pressed={active}
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[calc(12px*var(--fs-scale))] transition-colors',
                          active
                            ? 'border-transparent text-accent-ink'
                            : 'border-line text-ink-2 hover:border-line-strong hover:text-ink',
                        )}
                        style={active ? { backgroundColor: meta.color } : undefined}
                      >
                        <meta.Icon size={11} strokeWidth={2} />
                        {t(meta.labelKey)}
                      </button>
                    );
                  },
                )}
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 rounded-control border border-line bg-surface-1 px-3.5 py-2.5">
              <span className="text-[calc(13px*var(--fs-scale))] text-ink-2">{t('event.fieldAllDay')}</span>
              <Switch
                checked={form.allDay}
                onCheckedChange={(checked) => patch({ allDay: checked })}
                aria-label={t('event.fieldAllDay')}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="event-start-date">{t('event.fieldDate')}</Label>
                <Input
                  id="event-start-date"
                  type="date"
                  value={form.startDate}
                  onChange={(event) => patch({ startDate: event.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="event-start-time">{t('event.fieldTime')}</Label>
                <Input
                  id="event-start-time"
                  type="time"
                  value={form.startTime}
                  disabled={form.allDay}
                  onChange={(event) => patch({ startTime: event.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="event-end-date">{t('event.fieldDate')}</Label>
                <Input
                  id="event-end-date"
                  type="date"
                  value={form.endDate}
                  onChange={(event) => patch({ endDate: event.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="event-end-time">{t('event.fieldTime')}</Label>
                <Input
                  id="event-end-time"
                  type="time"
                  value={form.endTime}
                  disabled={form.allDay}
                  onChange={(event) => patch({ endTime: event.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="event-recurrence">{t('event.fieldRepeat')}</Label>
              <NativeSelect
                id="event-recurrence"
                value={form.kind}
                onChange={(event) => patch({ kind: event.target.value as RecurrenceKind })}
              >
                {RECURRENCE_KINDS.map((kind) => (
                  <option key={kind} value={kind}>
                    {t(RECURRENCE_LABEL_KEY[kind])}
                  </option>
                ))}
              </NativeSelect>

              {form.kind === 'weekly' ? (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {weekdayOptions.map((option) => {
                    const active = form.weekdays.includes(option.value);
                    return (
                      <button
                        key={option.value}
                        type="button"
                        aria-pressed={active}
                        onClick={() =>
                          patch({
                            weekdays: active
                              ? form.weekdays.filter((day) => day !== option.value)
                              : [...form.weekdays, option.value],
                          })
                        }
                        className={cn(
                          'h-8 min-w-10 rounded-lg border px-2 text-[calc(12px*var(--fs-scale))] transition-colors',
                          active
                            ? 'border-accent/40 bg-accent/15 text-accent'
                            : 'border-line text-ink-2 hover:border-line-strong hover:text-ink',
                        )}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              ) : null}

              {form.kind === 'monthly' ? (
                <InlineField className="mt-2.5">
                  <span>{t('event.dayBefore')}</span>
                  <Input
                    type="number"
                    min={1}
                    max={31}
                    value={form.day}
                    aria-label={t('event.repeatKind.monthly')}
                    onChange={(event) => patch({ day: event.target.value })}
                    className="h-9 w-20"
                  />
                  <span>{t('event.dayAfter')}</span>
                </InlineField>
              ) : null}

              {form.kind === 'yearly' ? (
                <InlineField className="mt-2.5">
                  <Input
                    type="number"
                    min={1}
                    max={12}
                    value={form.month}
                    aria-label={t('event.fieldRepeat')}
                    onChange={(event) => patch({ month: event.target.value })}
                    className="h-9 w-16"
                  />
                  <span>{t('event.yearMonthAfter')}</span>
                  <Input
                    type="number"
                    min={1}
                    max={31}
                    value={form.day}
                    aria-label={t('event.fieldRepeat')}
                    onChange={(event) => patch({ day: event.target.value })}
                    className="h-9 w-16"
                  />
                  <span>{t('event.yearDayAfter')}</span>
                </InlineField>
              ) : null}

              {form.kind === 'monthlyNthWeekday' ? (
                <InlineField className="mt-2.5">
                  <span>{t('event.nthBefore')}</span>
                  <NativeSelect
                    value={form.nth}
                    aria-label={t('event.repeatKind.monthlyNthWeekday')}
                    onChange={(event) => patch({ nth: event.target.value })}
                    className="h-9 w-24"
                  >
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="-1">{t('event.nthLastOption')}</option>
                  </NativeSelect>
                  <span>{t('event.nthMid')}</span>
                  <NativeSelect
                    value={form.weekday}
                    aria-label={t('event.repeatKind.monthlyNthWeekday')}
                    onChange={(event) => patch({ weekday: event.target.value })}
                    className="h-9 w-24"
                  >
                    {weekdayOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </NativeSelect>
                  <span>{t('event.nthAfter')}</span>
                </InlineField>
              ) : null}

              {form.kind === 'payday' ? (
                <>
                  <InlineField className="mt-2.5">
                    <span>{t('event.dayBefore')}</span>
                    <Input
                      type="number"
                      min={1}
                      max={31}
                      value={form.day}
                      aria-label={t('event.repeatKind.payday')}
                      onChange={(event) => patch({ day: event.target.value })}
                      className="h-9 w-20"
                    />
                    <span>{t('event.dayAfter')}</span>
                    <NativeSelect
                      value={form.adjust}
                      aria-label={t('event.fieldRepeat')}
                      onChange={(event) =>
                        patch({ adjust: event.target.value as FormState['adjust'] })
                      }
                      className="h-9 w-auto min-w-32"
                    >
                      <option value="backward">{t('recurrence.paydayBackward')}</option>
                      <option value="forward">{t('recurrence.paydayForward')}</option>
                      <option value="none">{t('recurrence.paydayNone')}</option>
                    </NativeSelect>
                  </InlineField>
                  <p className="mt-2 text-[calc(11px*var(--fs-scale))] leading-relaxed text-ink-3">
                    {t('event.paydayHint')}
                  </p>
                </>
              ) : null}

              {form.kind === 'monthlyLastWorkday' ? (
                <p className="mt-2 text-[calc(11px*var(--fs-scale))] leading-relaxed text-ink-3">
                  {t('event.lastWorkdayHint')}
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="event-note">{t('event.fieldNote')}</Label>
              <Textarea
                id="event-note"
                value={form.note}
                maxLength={200}
                placeholder={t('event.fieldNotePlaceholder')}
                onChange={(event) => patch({ note: event.target.value })}
              />
            </div>

            <div className="flex items-center justify-between gap-4 rounded-control border border-line bg-surface-1 px-3.5 py-2.5">
              <div>
                <p className="text-[calc(13px*var(--fs-scale))] text-ink-2">{t('event.fieldPin')}</p>
                <p className="mt-0.5 text-[calc(11px*var(--fs-scale))] text-ink-3">{t('event.fieldPinHint')}</p>
              </div>
              <Switch
                checked={form.pinned}
                onCheckedChange={(checked) => patch({ pinned: checked })}
                aria-label={t('event.fieldPin')}
              />
            </div>

            {error ? <p className="text-[calc(12px*var(--fs-scale))] text-alert">{error}</p> : null}
          </div>

          <DialogFooter className="mt-auto">
            <div>
              {editing ? (
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    if (!confirmDelete) {
                      setConfirmDelete(true);
                      return;
                    }
                    removeEvent(editing.id);
                    closeComposer();
                  }}
                >
                  {confirmDelete ? t('event.confirmDelete') : t('event.delete')}
                </Button>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" size="md" onClick={closeComposer}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" variant="primary" size="md">
                {t('common.save')}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
