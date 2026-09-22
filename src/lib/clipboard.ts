/**
 * 剪贴板兜底。
 *
 * `navigator.clipboard` 与 `crypto.randomUUID` 一样受**安全上下文**限制：
 * 用局域网 IP 打开站点时 `navigator.clipboard` 是 `undefined`，
 * 原来的 `await navigator.clipboard.writeText(...)` 会抛错并被 catch 静默吞掉，
 * 用户看到的现象就是"点了复制，什么都没发生"。
 *
 * 所以这里统一走一层封装：优先异步 API，不行就退回 classics 的
 * `document.execCommand('copy')`——它在非安全上下文下照样能用。
 */

/** 复制纯文本，返回是否成功。调用方据此决定要不要提示失败。 */
export async function copyText(text: string): Promise<boolean> {
  const clipboard = typeof navigator === 'undefined' ? undefined : navigator.clipboard;

  if (clipboard && typeof clipboard.writeText === 'function') {
    try {
      await clipboard.writeText(text);
      return true;
    } catch {
      /* 权限被拒或上下文不安全，继续走下面的兜底 */
    }
  }

  return legacyCopyText(text);
}

/** `document.execCommand('copy')` 需要一个临时 textarea + 一次选区 */
function legacyCopyText(text: string): boolean {
  if (typeof document === 'undefined' || !document.body) return false;

  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  // 放在视口外，同时避免聚焦瞬间把页面滚走
  area.style.position = 'fixed';
  area.style.top = '-1000px';
  area.style.left = '-1000px';
  area.style.opacity = '0';

  const selection = document.getSelection();
  const previous = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

  document.body.appendChild(area);

  try {
    area.select();
    area.setSelectionRange(0, text.length);
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    area.remove();
    // 还原用户原来的选区，避免"复制一下结果整页选中被清掉"
    if (selection && previous) {
      selection.removeAllRanges();
      selection.addRange(previous);
    }
  }
}

/**
 * 图片能否写进剪贴板。
 *
 * 除了安全上下文，还需要浏览器支持 `ClipboardItem`。
 * 不满足时调用方应直接改走下载，而不是先 promise 再失败。
 */
export function canWriteImageToClipboard(): boolean {
  if (typeof window === 'undefined') return false;
  if (!window.isSecureContext) return false;
  if (typeof ClipboardItem === 'undefined') return false;
  const clipboard = navigator.clipboard;
  return Boolean(clipboard && typeof clipboard.write === 'function');
}
