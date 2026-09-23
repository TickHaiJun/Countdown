'use client';

import { useRef, useState, type ReactNode } from 'react';
import { Check, Download, RotateCcw, Trash2, TriangleAlert, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { SegmentedControl } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { LOCALES, useI18n } from '@/i18n';
import { downloadText, timestampSuffix } from '@/lib/export/download';
import { formatDateShort } from '@/i18n/format';
import { cn } from '@/lib/utils';
import { SCHEMA_VERSION, useCountdownStore } from '@/store/countdown-store';
import { useUiStore } from '@/store/ui-store';
import type {
  BodyTone,
  CountdownEvent,
  FontScale,
  HeadingTone,
  Locale,
  Settings,
  ThemeName,
} from '@/types';

interface TrashRow {
  id: string;
  payload: CountdownEvent;
  deletedAt: string;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-7 last:mb-0">
      <h3 className="label-mono mb-2">{title}</h3>
      <div className="divide-y divide-hairline-soft rounded-card border border-line bg-surface-1 px-4">
        {children}
      </div>
    </section>
  );
}

function Row({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-5 py-3.5">
      <div className="min-w-0">
        <p className="text-[calc(13px*var(--fs-scale))] text-ink">{title}</p>
        {hint ? (
          <p className="mt-0.5 text-[calc(11px*var(--fs-scale))] leading-relaxed text-ink-3">{hint}</p>
        ) : null}
      </div>
      {children ? <div className="shrink-0 pt-0.5">{children}</div> : null}
    </div>
  );
}

export function SettingsSheet() {
  const { t, locale, setLocale } = useI18n();

  const open = useUiStore((state) => state.settingsOpen);
  const setOpen = useUiStore((state) => state.setSettingsOpen);

  const settings = useCountdownStore((state) => state.settings);
  const updateSettings = useCountdownStore((state) => state.updateSettings);
  const events = useCountdownStore((state) => state.events);
  const trashed = useCountdownStore((state) => state.trashedEvents) as TrashRow[];
  const restoreEvent = useCountdownStore((state) => state.restoreEvent);
  const purgeTrashedEvent = useCountdownStore((state) => state.purgeTrashedEvent);
  const emptyTrash = useCountdownStore((state) => state.emptyTrash);
  const importState = useCountdownStore((state) => state.importState);
  const clearAll = useCountdownStore((state) => state.clearAll);

  const fileRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState(false);
  const [imported, setImported] = useState<number | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const handleExport = () => {
    const payload = {
      app: 'countdown',
      version: SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      events,
      trashedEvents: trashed,
      settings,
    };
    downloadText(
      JSON.stringify(payload, null, 2),
      `countdown-backup-${timestampSuffix(Date.now())}.json`,
      'application/json',
    );
  };

  const handleImportFile = async (file: File) => {
    setImportError(false);
    setImported(null);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as {
        events?: CountdownEvent[];
        trashedEvents?: TrashRow[];
        settings?: Partial<Settings>;
      };
      if (!Array.isArray(parsed.events)) throw new Error('bad shape');
      const count = importState({
        events: parsed.events,
        trashedEvents: parsed.trashedEvents,
        settings: parsed.settings,
      });
      setImported(count);
    } catch {
      setImportError(true);
    }
  };

  /*
   * 选项先经 t() 展开成数组，不用 `t('settings.theme' + value)` 拼键——
   * 字典是强类型的，拼出来的字符串绕过了检查，漏一个键要到运行时才发现。
   */
  const themeOptions: { value: ThemeName; label: string }[] = [
    { value: 'grain', label: t('settings.themeGrain') },
    { value: 'golden', label: t('settings.themeGolden') },
    { value: 'blueprint', label: t('settings.themeBlueprint') },
    { value: 'aurora', label: t('settings.themeAurora') },
  ];

  const fontScaleOptions: { value: FontScale; label: string }[] = [
    { value: 'compact', label: t('settings.fontScaleCompact') },
    { value: 'normal', label: t('settings.fontScaleNormal') },
    { value: 'wide', label: t('settings.fontScaleWide') },
  ];

  const headingOptions: { value: HeadingTone; label: string }[] = [
    { value: 'default', label: t('settings.toneDefault') },
    { value: 'accent', label: t('settings.toneAccent') },
    { value: 'max', label: t('settings.toneMax') },
  ];

  const bodyOptions: { value: BodyTone; label: string }[] = [
    { value: 'default', label: t('settings.toneDefault') },
    { value: 'strong', label: t('settings.bodyStrong') },
    { value: 'soft', label: t('settings.bodySoft') },
  ];

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent closeLabel={t('common.close')}>
          <SheetHeader>
            <SheetTitle>{t('settings.title')}</SheetTitle>
            <SheetDescription>{t('settings.subtitle')}</SheetDescription>
          </SheetHeader>

          <SheetBody>
            <Section title={t('settings.sectionLanguage')}>
              <Row title={t('nav.language')}>
                <SegmentedControl<Locale>
                  ariaLabel={t('nav.language')}
                  value={locale}
                  onChange={setLocale}
                  options={LOCALES.map((item) => ({
                    value: item.value,
                    label: item.short,
                  }))}
                />
              </Row>
            </Section>

            <Section title={t('settings.sectionTheme')}>
              <div className="py-3.5">
                <div className="grid grid-cols-2 gap-2">
                  {themeOptions.map(({ value, label }) => {
                    const active = settings.theme === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => updateSettings({ theme: value })}
                        aria-pressed={active}
                        className={cn(
                          'flex items-center gap-2.5 rounded-control border px-3 py-2.5 text-left transition-colors',
                          active
                            ? 'border-accent/55 bg-accent/10 text-ink'
                            : 'border-line text-ink-2 hover:border-line-strong hover:text-ink',
                        )}
                      >
                        {/* 色卡只是装饰，真实配色见 globals.css 的主题块 */}
                        <span className="theme-swatch" data-swatch={value} aria-hidden="true" />
                        <span className="min-w-0 flex-1 truncate font-display text-[calc(12.5px*var(--fs-scale))]">
                          {label}
                        </span>
                        {active ? (
                          <Check size={13} strokeWidth={2.2} className="shrink-0 text-accent" />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-[calc(11px*var(--fs-scale))] leading-relaxed text-ink-3">
                  {t('settings.themeHint')}
                </p>
              </div>
            </Section>

            <Section title={t('settings.sectionText')}>
              <Row title={t('settings.fontScale')} hint={t('settings.fontScaleHint')}>
                <SegmentedControl<FontScale>
                  ariaLabel={t('settings.fontScale')}
                  value={settings.fontScale}
                  onChange={(value) => updateSettings({ fontScale: value })}
                  options={fontScaleOptions}
                />
              </Row>
              <Row title={t('settings.headingTone')} hint={t('settings.headingToneHint')}>
                <SegmentedControl<HeadingTone>
                  ariaLabel={t('settings.headingTone')}
                  value={settings.headingTone}
                  onChange={(value) => updateSettings({ headingTone: value })}
                  options={headingOptions}
                />
              </Row>
              <Row title={t('settings.bodyTone')} hint={t('settings.bodyToneHint')}>
                <SegmentedControl<BodyTone>
                  ariaLabel={t('settings.bodyTone')}
                  value={settings.bodyTone}
                  onChange={(value) => updateSettings({ bodyTone: value })}
                  options={bodyOptions}
                />
              </Row>
            </Section>

            <Section title={t('settings.sectionAppearance')}>
              <Row title={t('settings.privacy')} hint={t('settings.privacyHint')}>
                <Switch
                  checked={settings.privacyMode}
                  onCheckedChange={(checked) => updateSettings({ privacyMode: checked })}
                  aria-label={t('settings.privacy')}
                />
              </Row>
              <Row title={t('settings.showSeconds')} hint={t('settings.showSecondsHint')}>
                <Switch
                  checked={settings.showSeconds}
                  onCheckedChange={(checked) => updateSettings({ showSeconds: checked })}
                  aria-label={t('settings.showSeconds')}
                />
              </Row>
              <Row
                title={t('settings.hideEndedEvents')}
                hint={t('settings.hideEndedEventsHint')}
              >
                <Switch
                  checked={settings.hideEnded}
                  onCheckedChange={(checked) => updateSettings({ hideEnded: checked })}
                  aria-label={t('settings.hideEndedEvents')}
                />
              </Row>
              <Row title={t('settings.reduceMotion')} hint={t('settings.reduceMotionHint')}>
                <Switch
                  checked={settings.reduceMotion}
                  onCheckedChange={(checked) => updateSettings({ reduceMotion: checked })}
                  aria-label={t('settings.reduceMotion')}
                />
              </Row>
            </Section>

            <Section title={t('settings.sectionData')}>
              <Row title={t('settings.exportJson')} hint={t('settings.exportJsonHint')}>
                <Button size="sm" variant="subtle" onClick={handleExport}>
                  <Download size={13} strokeWidth={1.75} />
                  {t('common.download')}
                </Button>
              </Row>
              <Row
                title={t('settings.importJson')}
                hint={
                  importError
                    ? t('settings.importFailed')
                    : imported !== null
                      ? t('settings.importSuccess', { n: imported })
                      : t('settings.importJsonHint')
                }
              >
                <Button
                  size="sm"
                  variant="subtle"
                  onClick={() => fileRef.current?.click()}
                >
                  <Upload size={13} strokeWidth={1.75} />
                  {t('common.add')}
                </Button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void handleImportFile(file);
                    event.target.value = '';
                  }}
                />
              </Row>
            </Section>

            <Section title={t('settings.sectionTrash')}>
              {trashed.length === 0 ? (
                <Row title={t('settings.trashEmpty')} hint={t('settings.trashEmptyHint')} />
              ) : (
                <>
                  {trashed.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[calc(13px*var(--fs-scale))] text-ink-2">
                          {item.payload.title}
                        </p>
                        <p className="mt-0.5 text-[calc(11px*var(--fs-scale))] text-ink-3">
                          {formatDateShort(Date.parse(item.deletedAt), locale)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          aria-label={t('settings.restore')}
                          title={t('settings.restore')}
                          onClick={() => restoreEvent(item.id)}
                        >
                          <RotateCcw size={13} strokeWidth={1.75} />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          aria-label={t('settings.purge')}
                          title={t('settings.purge')}
                          onClick={() => purgeTrashedEvent(item.id)}
                        >
                          <Trash2 size={13} strokeWidth={1.75} />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center justify-between py-3">
                    <p className="text-[calc(11px*var(--fs-scale))] text-ink-3">
                      {t('settings.trashCount', { n: trashed.length })}
                    </p>
                    <Button size="sm" variant="ghost" onClick={emptyTrash}>
                      {t('settings.purgeAll')}
                    </Button>
                  </div>
                </>
              )}
            </Section>

            <Section title={t('settings.sectionDanger')}>
              <Row title={t('settings.clearAll')} hint={t('settings.clearAllHint')}>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => setConfirmClear(true)}
                >
                  <TriangleAlert size={13} strokeWidth={1.75} />
                  {t('common.clear')}
                </Button>
              </Row>
            </Section>
          </SheetBody>
        </SheetContent>
      </Sheet>

      <Dialog open={confirmClear} onOpenChange={setConfirmClear}>
        <DialogContent className="w-[min(420px,calc(100vw-32px))]">
          <DialogHeader>
            <DialogTitle>{t('settings.clearAllConfirmTitle')}</DialogTitle>
            <DialogDescription>{t('settings.clearAllConfirmBody')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmClear(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                clearAll();
                setConfirmClear(false);
                setOpen(false);
              }}
            >
              {t('settings.clearAllConfirmWord')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
