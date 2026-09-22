/**
 * html-to-image 的薄封装。
 *
 * 两个坑：
 * 1. 导出时不会自动内嵌 web font —— 先等 `document.fonts.ready`；
 * 2. 跨域样式表会让库在收集字体时抛错 —— 出错后退化为 `skipFonts: true` 重试。
 */

import { canWriteImageToClipboard } from '@/lib/clipboard';

export type ImageFormat = 'png' | 'jpeg';

export interface CaptureOptions {
  format: ImageFormat;
  /** 输出画布像素倍率：输出尺寸 = 节点 CSS 尺寸 × pixelRatio */
  pixelRatio: number;
  quality?: number;
}

export async function waitForFonts(): Promise<void> {
  if (typeof document === 'undefined' || !('fonts' in document)) return;
  try {
    await document.fonts.ready;
  } catch {
    /* 字体加载失败不应阻断导出 */
  }
}

export async function captureNode(
  node: HTMLElement,
  { format, pixelRatio, quality = 0.95 }: CaptureOptions,
): Promise<Blob> {
  const { toBlob } = await import('html-to-image');
  await waitForFonts();

  const base = {
    pixelRatio,
    cacheBust: true,
    backgroundColor: undefined,
    style: { margin: '0' },
  };

  const run = (skipFonts: boolean) =>
    format === 'png'
      ? toBlob(node, { ...base, skipFonts })
      : toBlob(node, { ...base, skipFonts, quality, type: 'image/jpeg' });

  let blob: Blob | null;
  try {
    blob = await run(false);
  } catch {
    blob = await run(true);
  }

  if (!blob) throw new Error('导出失败：拿到空的图像数据');
  return blob;
}

/** 输出尺寸 = 节点尺寸 × 倍率，用于校验与提示 */
export function outputSize(node: HTMLElement, pixelRatio: number): { width: number; height: number } {
  return {
    width: Math.round(node.offsetWidth * pixelRatio),
    height: Math.round(node.offsetHeight * pixelRatio),
  };
}

export function canUseClipboardImage(): boolean {
  // 交给 clipboard.ts 单点判断：它额外检查了安全上下文，
  // 局域网 http 打开时才能给出准确的"不支持"而不是让 write 去失败
  return canWriteImageToClipboard();
}

export type CopyResult = 'copied' | 'unsupported' | 'failed';

export async function copyImage(blob: Blob): Promise<CopyResult> {
  if (!canUseClipboardImage()) return 'unsupported';
  try {
    const type = blob.type || 'image/png';
    await navigator.clipboard.write([new ClipboardItem({ [type]: blob })]);
    return 'copied';
  } catch {
    return 'failed';
  }
}

export function canShareFiles(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.canShare === 'function' &&
    typeof navigator.share === 'function'
  );
}

export type ShareResult = 'shared' | 'unsupported' | 'cancelled' | 'failed';

export async function shareImage(
  blob: Blob,
  filename: string,
  title: string,
  text?: string,
): Promise<ShareResult> {
  if (!canShareFiles()) return 'unsupported';

  const file = new File([blob], filename, { type: blob.type || 'image/png' });
  if (!navigator.canShare({ files: [file] })) return 'unsupported';

  try {
    await navigator.share({ files: [file], title, text });
    return 'shared';
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled';
    return 'failed';
  }
}
