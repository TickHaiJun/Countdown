import { STORAGE_KEY } from '@/lib/storage-keys';
import { FONT_SCALE_VALUE, THEME_COLORS, type Settings } from '@/types';

/** 外观设置里需要同步到 DOM 的那几项 */
export type AppearanceSettings = Pick<
  Settings,
  'theme' | 'fontScale' | 'headingTone' | 'bodyTone'
>;

/*
 * 外观设置的落点是 `<html>` 上的三个 data 属性 + 一个 CSS 变量：
 *
 *   data-theme      → 四套主题的 token 块（globals.css 文件末尾）
 *   data-heading    → 标题色档位
 *   data-body-tone  → 正文色档位
 *   --fs-scale      → 全局字号缩放
 *
 * 之所以只碰这四个，是因为 Tailwind v4 把 token 编成了
 * `.text-ink-2{color:var(--color-ink-2)}` 这种形式 —— 改根变量等于全站生效，
 * 组件层完全不用知道"主题"这个概念存在。
 */

function setOptionalAttr(root: HTMLElement, key: string, value: string, fallback: string) {
  if (value === fallback) delete root.dataset[key];
  else root.dataset[key] = value;
}

/** 让浏览器 UI（地址栏 / 状态栏）跟随主题底色 */
export function syncThemeColor(theme: string): void {
  if (typeof document === 'undefined') return;
  const content = (THEME_COLORS as Record<string, string>)[theme] ?? THEME_COLORS.grain;
  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', content);
}

export function applyAppearance(settings: AppearanceSettings): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  root.dataset.theme = settings.theme;
  setOptionalAttr(root, 'heading', settings.headingTone, 'default');
  setOptionalAttr(root, 'bodyTone', settings.bodyTone, 'default');
  root.style.setProperty('--fs-scale', String(FONT_SCALE_VALUE[settings.fontScale] ?? 1));

  syncThemeColor(settings.theme);
}

/*
 * `<head>` 里的阻塞式内联脚本，逻辑与 applyAppearance 一一对应。
 *
 * 为什么不复用上面那个函数：它必须在 React 之前、首屏绘制之前跑，
 * 而首屏那一刻 store 还没 rehydrate。所以这段是"手写版"，
 * 直接读 localStorage 里的持久化 JSON。
 *
 * ⚠️ 改 applyAppearance 时**必须同步改这里**，否则会出现
 *    「首屏一帧 A、hydrate 后跳到 B」的闪烁。
 *
 * 取值全部由上方常量 JSON 化注入，不存在手写漂移。
 */
/*
 * 构建期自检。
 *
 * 下面那段脚本把这三个常量 JSON 化内联进去。一旦某个值是 `undefined`（典型原因：
 * 从带 `'use client'` 的模块里读非组件导出，Next 会跨边界把它换成客户端引用代理），
 * `JSON.stringify(undefined)` 返回的**不是字符串**而是 `undefined`，模板字面量
 * 就会把字面量 `undefined` 烙进产物 —— 脚本退化成
 * `localStorage.getItem(undefined)`，取不到存档、首行 return，防闪逻辑静默失效。
 * 这种失败在任何单测里都看不出来（测试环境没有这条模块边界），所以宁可让构建挂掉。
 */
function assertInlined(name: string, value: unknown): void {
  if (value === undefined || value === null) {
    throw new Error(
      `[appearance] 构建期解析 ${name} 得到 ${String(value)}。` +
        '不要把非组件的常量从 \'use client\' 模块导入服务端组件链路，' +
        '请改从 @/lib/storage-keys 这类中性模块取。',
    );
  }
}
assertInlined('STORAGE_KEY', STORAGE_KEY);
assertInlined('THEME_COLORS', THEME_COLORS);
assertInlined('FONT_SCALE_VALUE', FONT_SCALE_VALUE);

export const APPEARANCE_BOOTSTRAP = `(function(){try{
var raw=window.localStorage.getItem(${JSON.stringify(STORAGE_KEY)});
if(!raw)return;
var parsed=JSON.parse(raw);
var settings=(parsed&&parsed.state&&parsed.state.settings)||{};
var root=document.documentElement;
var themeColors=${JSON.stringify(THEME_COLORS)};
var theme=themeColors[settings.theme]?settings.theme:'grain';
root.setAttribute('data-theme',theme);
if(settings.headingTone&&settings.headingTone!=='default'){root.setAttribute('data-heading',settings.headingTone);}
if(settings.bodyTone&&settings.bodyTone!=='default'){root.setAttribute('data-body-tone',settings.bodyTone);}
var fontScales=${JSON.stringify(FONT_SCALE_VALUE)};
var scale=fontScales[settings.fontScale];
if(typeof scale==='number'){root.style.setProperty('--fs-scale',String(scale));}
var meta=document.querySelector('meta[name="theme-color"]');
if(meta){meta.setAttribute('content',themeColors[theme]);}
}catch(error){}})();`;
