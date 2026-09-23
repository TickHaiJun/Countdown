import { afterEach, describe, expect, it, vi } from 'vitest';
import { APPEARANCE_BOOTSTRAP, applyAppearance } from '@/lib/appearance';
import { STORAGE_KEY } from '@/store/countdown-store';
import {
  DEFAULT_SETTINGS,
  FONT_SCALE_VALUE,
  THEME_COLORS,
  THEME_NAMES,
  type Settings,
} from '@/types';

/* ------------------------------------------------------------------ 极简 DOM 替身
 * 测试环境是 node，没有 jsdom。这里只需要 <html> 上的属性、style 与一个 meta，
 * 所以不引依赖，手搓一个够用的。
 *
 * 关键点：`dataset` 必须与 `setAttribute` 写到**同一份**存储。
 * 内联脚本用 setAttribute('data-theme')，而 applyAppearance 用 dataset.theme——
 * 两者若各写各的，下面的「一致性测试」就失去意义了。
 */
function createRoot() {
  const attrs = new Map<string, string>();

  const toAttr = (key: string) => `data-${key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`;

  const dataset = new Proxy(
    {},
    {
      get: (_target, key: string) => attrs.get(toAttr(key)),
      set: (_target, key: string, value: string) => {
        attrs.set(toAttr(key), String(value));
        return true;
      },
      deleteProperty: (_target, key: string) => {
        attrs.delete(toAttr(key));
        return true;
      },
      has: () => true,
    },
  ) as Record<string, string>;

  const styleProps = new Map<string, string>();

  return {
    attrs,
    dataset,
    style: {
      setProperty: (name: string, value: string) => {
        styleProps.set(name, value);
      },
      getProperty: (name: string) => styleProps.get(name),
    },
    setAttribute: (name: string, value: string) => {
      attrs.set(name, value);
    },
  };
}

interface Harness {
  root: ReturnType<typeof createRoot>;
  meta: { attrs: Map<string, string>; setAttribute: (k: string, v: string) => void };
}

/** 让 `applyAppearance` 能跑起来的 document 替身 */
function stubDocument(): Harness {
  const root = createRoot();
  const metaAttrs = new Map<string, string>();
  const meta = {
    attrs: metaAttrs,
    setAttribute: (key: string, value: string) => metaAttrs.set(key, value),
  };

  vi.stubGlobal('document', {
    documentElement: root,
    head: { appendChild: () => undefined },
    querySelector: () => meta,
    createElement: () => ({ setAttribute: () => undefined }),
  });

  return { root, meta };
}

/** 跑一次「首屏内联脚本」，返回它写出来的结果 */
function runBootstrap(stored: string | null) {
  const root = createRoot();
  const metaAttrs = new Map<string, string>();

  const fakeWindow = { localStorage: { getItem: () => stored } };
  const fakeDocument = {
    documentElement: root,
    querySelector: () => ({
      setAttribute: (key: string, value: string) => metaAttrs.set(key, value),
    }),
  };

  // 脚本只引用 window / document，作为形参传入即可隔离掉真实的全局
  const run = new Function('window', 'document', APPEARANCE_BOOTSTRAP) as (
    w: unknown,
    d: unknown,
  ) => void;
  run(fakeWindow, fakeDocument);

  return { root, metaAttrs };
}

const settingsWith = (patch: Partial<Settings>): Settings => ({
  ...DEFAULT_SETTINGS,
  ...patch,
});

const persisted = (patch: Partial<Settings>) =>
  JSON.stringify({ state: { settings: settingsWith(patch) }, version: 1 });

afterEach(() => {
  vi.unstubAllGlobals();
});

/* ------------------------------------------------------------------ 测试 */

describe('主题清单', () => {
  it('四套主题都有名字和 theme-color', () => {
    expect(THEME_NAMES).toHaveLength(4);
    for (const name of THEME_NAMES) {
      expect(THEME_COLORS[name]).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('默认主题是 WebGL 那套，底色为纯黑（与 shader 的 colorBack 对齐）', () => {
    expect(DEFAULT_SETTINGS.theme).toBe('grain');
    expect(THEME_COLORS.grain).toBe('#000000');
  });

  it('浅色主题的底色是奶油白', () => {
    expect(THEME_COLORS.golden).toBe('#faf8f2');
  });
});

describe('字号档位', () => {
  it('三档齐全，标准档必须是 1（不能靠系数把默认观感改掉）', () => {
    expect(Object.keys(FONT_SCALE_VALUE).sort()).toEqual(['compact', 'normal', 'wide']);
    expect(FONT_SCALE_VALUE.normal).toBe(1);
  });

  it('紧凑 < 标准 < 宽松', () => {
    expect(FONT_SCALE_VALUE.compact).toBeLessThan(FONT_SCALE_VALUE.normal);
    expect(FONT_SCALE_VALUE.normal).toBeLessThan(FONT_SCALE_VALUE.wide);
  });
});

describe('默认设置', () => {
  it('新增的四项都有合法默认值', () => {
    expect(THEME_NAMES).toContain(DEFAULT_SETTINGS.theme);
    expect(Object.keys(FONT_SCALE_VALUE)).toContain(DEFAULT_SETTINGS.fontScale);
    expect(DEFAULT_SETTINGS.headingTone).toBe('default');
    expect(DEFAULT_SETTINGS.bodyTone).toBe('default');
  });
});

describe('applyAppearance', () => {
  it('把主题、字号、字色写进 <html>，并同步 theme-color', () => {
    const { root, meta } = stubDocument();

    applyAppearance(
      settingsWith({
        theme: 'golden',
        fontScale: 'wide',
        headingTone: 'accent',
        bodyTone: 'strong',
      }),
    );

    expect(root.attrs.get('data-theme')).toBe('golden');
    expect(root.attrs.get('data-heading')).toBe('accent');
    expect(root.attrs.get('data-body-tone')).toBe('strong');
    expect(root.style.getProperty('--fs-scale')).toBe('1.08');
    expect(meta.attrs.get('content')).toBe('#faf8f2');
  });

  it('字色回到默认档时要把属性摘掉，而不是留一个 default 值', () => {
    const { root } = stubDocument();

    applyAppearance(settingsWith({ headingTone: 'max', bodyTone: 'soft' }));
    expect(root.attrs.has('data-heading')).toBe(true);

    applyAppearance(settingsWith({ headingTone: 'default', bodyTone: 'default' }));
    expect(root.attrs.has('data-heading')).toBe(false);
    expect(root.attrs.has('data-body-tone')).toBe(false);
  });
});

describe('首屏内联脚本', () => {
  it('语法可解析（有语法错会让整页白屏）', () => {
    expect(() => new Function(APPEARANCE_BOOTSTRAP)).not.toThrow();
  });

  it('引用的 storage key 与 store 一致', () => {
    expect(APPEARANCE_BOOTSTRAP).toContain(STORAGE_KEY);
  });

  /*
   * 回归：这条曾经被写成 `toContain(STORAGE_KEY)` —— 当 STORAGE_KEY 被构建期
   * 解析成 undefined 时，toContain(undefined) 会把入参转成字符串 "undefined"，
   * 断言照样通过（自证式断言）。而产物里的脚本确实退化成了
   * `localStorage.getItem(undefined)`，防闪静默失效。这里直接钉字面量。
   */
  it('storage key 是真实字面量，不是被烙进去的 "undefined"', () => {
    expect(APPEARANCE_BOOTSTRAP).toContain('"countdown:v1"');
    expect(APPEARANCE_BOOTSTRAP).not.toContain('getItem(undefined)');
    expect(APPEARANCE_BOOTSTRAP).not.toMatch(/getItem\(\)/);
  });

  it('脚本能从存档里真的读出主题（端到端跑一遍取值路径）', () => {
    const { root } = runBootstrap(
      JSON.stringify({ state: { settings: { theme: 'aurora' } } }),
    );
    expect(root.attrs.get('data-theme')).toBe('aurora');
  });

  it('没有存档 / JSON 坏掉时不抛错，也不写任何属性', () => {
    // 前两个走 `if (!raw) return`，第三个走 catch —— 三种都不该碰 DOM
    for (const raw of [null, '', '{oops']) {
      const { root, metaAttrs } = runBootstrap(raw);
      expect(root.attrs.size).toBe(0);
      expect(metaAttrs.size).toBe(0);
    }
  });

  it('存档存在但读不出设置时，落到默认主题而不是留空', () => {
    // 这时脚本不该 early return，因为"有存档"本身就说明用户来过
    for (const raw of [JSON.stringify({ state: null }), JSON.stringify({})]) {
      const { root } = runBootstrap(raw);
      expect(root.attrs.get('data-theme')).toBe('grain');
    }
  });

  /*
   * 这是本文件最重要的一条。
   *
   * 内联脚本和 applyAppearance 是同一套逻辑的两份实现（前者必须在 React 之前跑，
   * 拿不到 store），一旦两者漂移，用户就会看到「首屏一帧 A、hydrate 后跳到 B」。
   * 这里穷举四套主题 × 三档字号 × 字色档位，要求两边产出完全一致。
   */
  it('与 applyAppearance 在全部组合下结果一致', () => {
    const themes = THEME_NAMES;
    const scales = ['compact', 'normal', 'wide'] as const;
    const headings = ['default', 'accent', 'max'] as const;
    const bodies = ['default', 'strong', 'soft'] as const;

    for (const theme of themes) {
      for (const fontScale of scales) {
        for (const headingTone of headings) {
          for (const bodyTone of bodies) {
            const settings = settingsWith({ theme, fontScale, headingTone, bodyTone });

            const boot = runBootstrap(JSON.stringify({ state: { settings }, version: 1 }));
            const live = stubDocument();
            applyAppearance(settings);

            const label = `${theme}/${fontScale}/${headingTone}/${bodyTone}`;
            expect([...boot.root.attrs.entries()].sort(), label).toEqual(
              [...live.root.attrs.entries()].sort(),
            );
            expect(boot.root.style.getProperty('--fs-scale'), label).toBe(
              live.root.style.getProperty('--fs-scale'),
            );
            expect(boot.metaAttrs.get('content'), label).toBe(live.meta.attrs.get('content'));
          }
        }
      }
    }
  });

  it('认不出来的主题名要退回默认主题，不能把 data-theme 留空', () => {
    const { root } = runBootstrap(persisted({ theme: 'nope' as never }));
    expect(root.attrs.get('data-theme')).toBe('grain');
  });
});
