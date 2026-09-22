import { cnParts, pad2 } from '@/lib/time';

/** 触发一次本地下载。纯浏览器 API，无依赖。 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // 立刻 revoke 会让部分浏览器来不及取数据，延后一拍
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function downloadText(
  text: string,
  filename: string,
  mime = 'text/plain;charset=utf-8',
): void {
  downloadBlob(new Blob([text], { type: mime }), filename);
}

/** 20260921-1632 */
export function timestampSuffix(ms: number): string {
  const p = cnParts(ms);
  return `${p.year}${pad2(p.month)}${pad2(p.day)}-${pad2(p.hour)}${pad2(p.minute)}`;
}

/** 把带非法文件名字符的标题洗成安全片段 */
export function safeFilenamePart(input: string, fallback = 'countdown'): string {
  const cleaned = input
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, '')
    .replace(/\s+/g, '-')
    .trim()
    .slice(0, 40);
  return cleaned.length > 0 ? cleaned : fallback;
}
