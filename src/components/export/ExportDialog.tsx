'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  Clipboard,
  Download,
  FileDown,
  Loader2,
  Share2,
} from 'lucide-react';
import { ShareCard } from '@/components/export/ShareCard';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useHydrated } from '@/hooks/use-hydrated';
import { useIsMobile } from '@/hooks/use-media-query';
import { useNow } from '@/hooks/use-now';
import { useI18n, type MessageKey } from '@/i18n';
import { computeCountdown } from '@/lib/countdown';
import { emptyCardModel, eventCardModel, holidayCardModel } from '@/lib/export/card-model';
import { downloadBlob, downloadText, safeFilenamePart, timestampSuffix } from '@/lib/export/download';
import { buildIcs, eventToIcsInput, holidayToIcsInput } from '@/lib/export/ics';
import {
  SIZE_PRESETS,
  TEMPLATES,
  getSizePreset,
} from '@/lib/export/templates-registry';
import { captureNode, copyImage, shareImage } from '@/lib/export/to-image';
import {
  DEFAULT_VISIBILITY,
  type CardModel,
  type CardVisibility,
  type SizePresetId,
  type TemplateId,
} from '@/lib/export/types';
import { BUILTIN_INDEX, findCurrentOrNext, findPeriodById } from '@/lib/holidays';
import { eventDurationMs, nextOccurrenceMs } from '@/lib/occurrence';
import { cn } from '@/lib/utils';
import { useCountdownStore } from '@/store/countdown-store';
import { useUiStore, type ExportTarget } from '@/store/ui-store';

/**
 * 静态导出下 basePath 只在构建期可知，运行时从环境变量取。
 * 二维码与分享链接都要带上，否则 GitHub Pages 项目页会 404。
 */
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

/** 开关顺序固定为「文案 → 时间 → 数字 → 装饰」，与卡片上从上到下的阅读顺序一致 */
const VISIBILITY_FIELDS: { key: keyof CardVisibility; labelKey: MessageKey }[] = [
  { key: 'title', labelKey: 'export.visibility.title' },
  { key: 'target', labelKey: 'export.visibility.target' },
  { key: 'days', labelKey: 'export.visibility.days' },
  { key: 'progress', labelKey: 'export.visibility.progress' },
  { key: 'tag', labelKey: 'export.visibility.tag' },
  { key: 'qr', labelKey: 'export.visibility.qr' },
];

const DEFAULT_TEMPLATE: TemplateId = 'ambient';

type Status = { tone: 'ok' | 'error' | 'info'; text: string } | null;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="label-mono">{label}</span>
      {children}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
  style,
  title,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  style?: React.CSSProperties;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-pressed={active}
      className={cn(
        'rounded-full border px-2.5 py-1 text-[calc(11px*var(--fs-scale))] transition-colors',
        active
          ? 'border-transparent text-[var(--color-ink)]'
          : 'border-line text-[var(--color-ink-3)] hover:border-white/20',
      )}
      style={active ? (style ?? { background: 'rgba(96,165,250,0.20)' }) : undefined}
    >
      {children}
    </button>
  );
}

function ExportPanel({ target, onClose }: { target: ExportTarget; onClose: () => void }) {
  const { t, locale } = useI18n();
  const hydrated = useHydrated();
  const now = useNow();
  const ready = now > 0 && hydrated;
  const isMobile = useIsMobile();

  const events = useCountdownStore((state) => state.events);
  const settings = useCountdownStore((state) => state.settings);

  const [template, setTemplate] = useState<TemplateId>(DEFAULT_TEMPLATE);
  const [sizeId, setSizeId] = useState<SizePresetId>('square');
  const [visibility, setVisibility] = useState<CardVisibility>(DEFAULT_VISIBILITY);
  const [privacy, setPrivacy] = useState(settings.privacyMode);
  const [busy, setBusy] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const cardRef = useRef<HTMLDivElement>(null);
  /**
   * 预览容器用「回调 ref + state」而不是 useRef。
   *
   * Radix 的 Portal 首次提交时渲染 null（容器靠它自己的 useLayoutEffect 才挂上），
   * 所以 `useRef + useEffect([])` 读到的 `current` 一定是 null，之后 ref 挂上了
   * effect 也不会重跑。回调 ref 会在节点真正挂载时触发 setState，
   * 依赖它的 effect 自然重跑一次，测量才拿得到宽度。
   */
  const [previewBox, setPreviewBox] = useState<HTMLDivElement | null>(null);
  const [previewWidth, setPreviewWidth] = useState(0);

  const preset = getSizePreset(sizeId);
  /** 桌面 2×、移动 3×；节点 CSS 尺寸 = 预设 / 倍率，导出时乘回去 */
  const ratio = isMobile ? 3 : 2;

  const resolved = useMemo(() => {
    if (!ready) return null;
    if (target.kind === 'holiday') {
      const holiday =
        findPeriodById(BUILTIN_INDEX, target.id) ?? findCurrentOrNext(BUILTIN_INDEX, now);
      if (!holiday) return null;
      return {
        kind: 'holiday' as const,
        holiday,
        occurrenceMs: holiday.startMs,
        view: computeCountdown(holiday.startMs, holiday.endMs, now),
      };
    }
    const event = events.find((item) => item.id === target.id);
    if (!event) return null;
    const occurrenceStart = nextOccurrenceMs(event, now, BUILTIN_INDEX);
    const occurrenceEnd = occurrenceStart + eventDurationMs(event);
    return {
      kind: 'event' as const,
      event,
      occurrenceMs: occurrenceStart,
      view: computeCountdown(occurrenceStart, occurrenceEnd, now),
    };
  }, [ready, now, target, events]);

  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const query = target.kind === 'holiday' ? `?holiday=${target.id}` : `?event=${target.id}`;
    return `${window.location.origin}${BASE_PATH}/${query}`;
  }, [target]);

  const ctx = useMemo(() => ({ locale, t }), [locale, t]);

  const model: CardModel = useMemo(() => {
    if (!resolved) return emptyCardModel(visibility, ctx);
    return resolved.kind === 'holiday'
      ? holidayCardModel(resolved.holiday, resolved.view, visibility, ctx, { qrDataUrl })
      : eventCardModel(resolved.event, resolved.view, resolved.occurrenceMs, visibility, ctx, {
          privacy,
          qrDataUrl,
        });
  }, [resolved, visibility, privacy, qrDataUrl, ctx]);

  const title = model.title;

  /* ---------------- 预览缩放 ---------------- */

  useEffect(() => {
    if (!previewBox) return;
    const sync = () => setPreviewWidth(previewBox.clientWidth);
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(previewBox);
    return () => observer.disconnect();
  }, [previewBox]);

  const logicalWidth = preset.width / ratio;
  const logicalHeight = preset.height / ratio;
  const previewScale = previewWidth > 0 ? previewWidth / logicalWidth : 0;

  /* ---------------- 二维码 ---------------- */

  useEffect(() => {
    if (!visibility.qr || qrDataUrl || !shareUrl) return;
    let cancelled = false;
    void (async () => {
      try {
        const { default: QRCode } = await import('qrcode');
        const url = await QRCode.toDataURL(shareUrl, {
          margin: 1,
          width: 480,
          errorCorrectionLevel: 'M',
          // 深色码点落在浅底上，贴到深色卡片里也扫得动
          color: { dark: '#100e0b', light: '#ffffff' },
        });
        if (!cancelled) setQrDataUrl(url);
      } catch {
        if (!cancelled) setStatus({ tone: 'error', text: t('export.qrFailed') });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [visibility.qr, qrDataUrl, shareUrl, t]);

  /* ---------------- 导出动作 ---------------- */

  const capture = useCallback(
    async (format: 'png' | 'jpeg') => {
      const node = cardRef.current;
      if (!node) throw new Error(t('export.notReady'));
      return captureNode(node, { format, pixelRatio: ratio, quality: 0.95 });
    },
    [ratio, t],
  );

  const fileBase = useMemo(
    () => `countdown-${safeFilenamePart(title)}-${timestampSuffix(now || Date.now())}`,
    [title, now],
  );

  async function handleDownload(format: 'png' | 'jpeg') {
    setBusy(format);
    setStatus(null);
    try {
      const blob = await capture(format);
      downloadBlob(blob, `${fileBase}.${format === 'png' ? 'png' : 'jpg'}`);
      setStatus({
        tone: 'ok',
        text: t('export.downloaded', { w: preset.width, h: preset.height }),
      });
    } catch (error) {
      setStatus({
        tone: 'error',
        text: error instanceof Error ? error.message : t('export.failed'),
      });
    } finally {
      setBusy(null);
    }
  }

  async function handleCopy() {
    setBusy('copy');
    setStatus(null);
    try {
      const blob = await capture('png');
      const result = await copyImage(blob);
      if (result === 'copied') setStatus({ tone: 'ok', text: t('export.copySuccess') });
      else if (result === 'unsupported') {
        downloadBlob(blob, `${fileBase}.png`);
        setStatus({ tone: 'info', text: t('export.copyUnsupported') });
      } else {
        downloadBlob(blob, `${fileBase}.png`);
        setStatus({ tone: 'info', text: t('export.copyDenied') });
      }
    } catch (error) {
      setStatus({
        tone: 'error',
        text: error instanceof Error ? error.message : t('export.failed'),
      });
    } finally {
      setBusy(null);
    }
  }

  async function handleShare() {
    setBusy('share');
    setStatus(null);
    try {
      const blob = await capture('png');
      const result = await shareImage(blob, `${fileBase}.png`, title, model.targetLabel);
      if (result === 'shared') setStatus({ tone: 'ok', text: t('export.shareStarted') });
      else if (result === 'unsupported') {
        setStatus({ tone: 'error', text: t('export.shareUnsupported') });
      } else if (result === 'cancelled') {
        setStatus({ tone: 'info', text: t('export.shareCancelled') });
      } else setStatus({ tone: 'error', text: t('export.shareFailed') });
    } catch (error) {
      setStatus({
        tone: 'error',
        text: error instanceof Error ? error.message : t('export.failed'),
      });
    } finally {
      setBusy(null);
    }
  }

  function handleIcs() {
    if (!resolved) return;
    const input =
      resolved.kind === 'holiday'
        ? holidayToIcsInput(resolved.holiday)
        : eventToIcsInput(resolved.event, resolved.occurrenceMs);
    const content = buildIcs([input], { nowMs: now || Date.now() });
    downloadText(content, `${fileBase}.ics`, 'text/calendar;charset=utf-8');
    setStatus({ tone: 'ok', text: t('export.icsDone') });
  }

  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  /* ---------------- 渲染 ---------------- */

  return (
    <DialogContent className="w-[min(960px,calc(100vw-24px))]">
      <DialogHeader>
        <DialogTitle>{t('export.title')}</DialogTitle>
        <DialogDescription>
          {t('export.subtitle')} · {t('export.targetLine', { name: title })}
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-6 overflow-y-auto px-6 py-5 md:grid-cols-[minmax(0,1fr)_290px]">
        {/* 预览 */}
        <div className="flex flex-col items-center gap-3">
          <div
            ref={setPreviewBox}
            data-export-preview
            className="w-full"
            style={{ maxWidth: preset.width > preset.height ? 560 : 360 }}
          >
            <div
              className="relative w-full overflow-hidden rounded-[12px] border border-line"
              style={{ height: previewWidth * (preset.height / preset.width) }}
            >
              <div
                data-export-canvas
                style={{
                  width: logicalWidth,
                  height: logicalHeight,
                  transform: `scale(${previewScale})`,
                  transformOrigin: 'top left',
                  visibility: previewScale > 0 ? 'visible' : 'hidden',
                }}
              >
                <ShareCard
                  ref={cardRef}
                  model={model}
                  template={template}
                  preset={preset}
                  ratio={ratio}
                />
              </div>
            </div>
          </div>
          <span className="label-mono">
            {t('export.ratioLine', { w: preset.width, h: preset.height, r: ratio })}
          </span>
        </div>

        {/* 控制区 */}
        <div className="flex flex-col gap-5">
          <Field label={t('export.template')}>
            <div className="flex flex-wrap gap-1.5">
              {TEMPLATES.map((item) => (
                <Chip
                  key={item.id}
                  active={template === item.id}
                  onClick={() => setTemplate(item.id)}
                  title={t(item.hintKey)}
                  style={{ background: `${item.tint}26` }}
                >
                  {t(item.nameKey)}
                </Chip>
              ))}
            </div>
          </Field>

          <Field label={t('export.size')}>
            <div className="flex flex-col gap-1.5">
              {SIZE_PRESETS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSizeId(item.id)}
                  aria-pressed={sizeId === item.id}
                  className={cn(
                    'flex items-center justify-between rounded-[10px] border px-3 py-2 text-left transition-colors',
                    sizeId === item.id
                      ? 'border-[rgba(96,165,250,0.5)] bg-[rgba(96,165,250,0.12)]'
                      : 'border-line hover:border-white/20',
                  )}
                >
                  <span className="tnum text-[calc(12px*var(--fs-scale))]">{item.label}</span>
                  <span className="text-[calc(11px*var(--fs-scale))] text-[var(--color-ink-3)]">
                    {t(item.hintKey)}
                  </span>
                </button>
              ))}
            </div>
          </Field>

          <Field label={t('export.elements')}>
            <div className="flex flex-wrap gap-1.5">
              {VISIBILITY_FIELDS.map((item) => (
                <Chip
                  key={item.key}
                  active={visibility[item.key]}
                  onClick={() =>
                    setVisibility((prev) => ({ ...prev, [item.key]: !prev[item.key] }))
                  }
                >
                  {t(item.labelKey)}
                </Chip>
              ))}
            </div>
          </Field>

          {target.kind === 'event' ? (
            <Field label={t('export.privacy')}>
              <Chip active={privacy} onClick={() => setPrivacy((prev) => !prev)}>
                {privacy ? t('export.privacyMasked') : t('export.privacyShown')}
              </Chip>
              <p className="text-[calc(11px*var(--fs-scale))] leading-relaxed text-[var(--color-ink-3)]">
                {t('export.privacyHint')}
              </p>
            </Field>
          ) : null}

          {status ? (
            <p
              className="text-[calc(11px*var(--fs-scale))] leading-relaxed"
              style={{
                color:
                  status.tone === 'error'
                    ? 'var(--color-alert)'
                    : status.tone === 'ok'
                      ? 'var(--color-accent)'
                      : 'var(--color-ink-2)',
              }}
              role="status"
            >
              {status.text}
            </p>
          ) : null}
        </div>
      </div>

      <DialogFooter className="flex-wrap gap-2">
        <Button variant="ghost" size="sm" onClick={onClose}>
          {t('common.close')}
        </Button>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button
            variant="subtle"
            size="sm"
            onClick={handleIcs}
            disabled={!resolved}
            className="gap-1.5"
          >
            <FileDown size={14} strokeWidth={1.75} />
            .ics
          </Button>
          <Button
            variant="subtle"
            size="sm"
            onClick={handleCopy}
            disabled={!resolved || busy !== null}
            className="gap-1.5"
          >
            {busy === 'copy' ? (
              <Loader2 size={14} strokeWidth={1.75} className="animate-spin" />
            ) : status?.text === t('export.copySuccess') ? (
              <Check size={14} strokeWidth={1.75} />
            ) : (
              <Clipboard size={14} strokeWidth={1.75} />
            )}
            {t('export.copyImage')}
          </Button>
          {canShare ? (
            <Button
              variant="subtle"
              size="sm"
              onClick={handleShare}
              disabled={!resolved || busy !== null}
              className="gap-1.5"
            >
              {busy === 'share' ? (
                <Loader2 size={14} strokeWidth={1.75} className="animate-spin" />
              ) : (
                <Share2 size={14} strokeWidth={1.75} />
              )}
              {t('export.share')}
            </Button>
          ) : null}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDownload('jpeg')}
            disabled={!resolved || busy !== null}
            className="gap-1.5"
          >
            {busy === 'jpeg' ? (
              <Loader2 size={14} strokeWidth={1.75} className="animate-spin" />
            ) : (
              <Download size={14} strokeWidth={1.75} />
            )}
            JPEG
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleDownload('png')}
            disabled={!resolved || busy !== null}
            className="gap-1.5"
          >
            {busy === 'png' ? (
              <Loader2 size={14} strokeWidth={1.75} className="animate-spin" />
            ) : (
              <Download size={14} strokeWidth={1.75} />
            )}
            PNG
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  );
}

export function ExportDialog() {
  const target = useUiStore((state) => state.exportTarget);
  const closeExport = useUiStore((state) => state.closeExport);

  return (
    <Dialog
      open={target !== null}
      onOpenChange={(open) => {
        if (!open) closeExport();
      }}
    >
      {target ? (
        <ExportPanel key={`${target.kind}:${target.id}`} target={target} onClose={closeExport} />
      ) : null}
    </Dialog>
  );
}
