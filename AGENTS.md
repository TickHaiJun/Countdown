# AGENTS.md — Countdown 倒计时落地页

> **这份文件是实现的唯一依据。** 动手前先读 §0（决策与红线）与 §13（待拍板项）；
> 实现时按 §14 的里程碑逐段推进，每个里程碑结束必须能通过其「验收」条目。

- **仓库**：https://github.com/TickHaiJun/Countdown.git
- **部署**：GitHub Pages（静态导出，纯前端，无服务端）
- **语言**：界面文案 zh-CN / en，运行时切换（客户端字典方案，见 §4.10）
- **主题**：Diamond Storm —— 底色 `#100e0b` + 强调色 `#60a5fa`，dark only
- **风格**：偏国外 dev-product 质感；动效与装饰大量取自 React Bits（见 §4.11）
- **页面**：`/`（首页）、`/countdowns/`（全部倒计时）、`/fullscreen/`（大屏）

---

## 0. 决策与红线

### 0.1 已定决策

| # | 项 | 决定 |
| --- | --- | --- |
| D1 | 渲染模式 | `output: 'export'` 纯静态导出。**禁止**任何依赖 Node 运行时的能力 |
| D2 | 数据存储 | 仅 `localStorage`（Zustand persist）。无账号、无云同步、无后端 |
| D3 | 部署路径 | 项目页 → `basePath = /Countdown`，线上地址 `https://tickhaijun.github.io/Countdown/` |
| D4 | 时区 | 假期/事件时间锚定 **Asia/Shanghai (UTC+8)**，所有字面量日期带 `+08:00` 偏移；不做本地时区换算 |
| D5 | 默认主题 | dark 为唯一默认；light 仅作 token 预留（`screen` → `multiply`），本期不实现主题切换 UI |
| D6 | 数据来源 | 节假日以国务院办公厅通知为准，内置 JSON，支持用户导入覆盖 |
| D7 | PWA | 手写 `manifest.webmanifest` + 轻量 `sw.js`（约 60 行），**不引入** `next-pwa` / Serwist |
| D8 | 2027 数据口径 | 只显示《全国年节及纪念日放假办法》确定的 **13 天法定节假日**，不推断调休连休，**UI 不加「待官方公布」角标** |
| D9 | 主倒计时层级 | **方案 A「天数主导」**：天 100%，时/分/秒约 40% 尺寸并逐级降低对比度 |
| D10 | 首页信息密度 | 不做「今日速览」四格统计块；Hero **占满首屏**，事件区在首屏下方 |
| D11 | 进度基准 | 假期用 `start`；自定义事件用 `createdAt`（假期没有创建时间）；假期进度条仅在 `ongoing` 时展示 |
| D12 | 里程碑口径 | 按**展示口径**（天数 floor）判定，保证「屏幕显示 3 天」时「3 天」徽章必定点亮 |
| D13 | 视觉主题 | **Diamond Storm**。底色 `#100e0b`，强调色 `#60a5fa`，正文 `#f4f4f5`。取代早期的 Cosmic Ash |
| D14 | 国际化 | **中英双语，用户可切**。方案 A：客户端字典（Context + localStorage），**不做 URL 路由前缀**（静态导出下最省事） |
| D15 | 默认语言 | `navigator.language` 自动判定；用户一旦手动切过就写 `localeExplicit: true`，此后不再自动跟随 |
| D16 | 农历的英文 | **用拼音，不意译**（`八月十五` → `bayue shiwu`）。法定节日名用通行译名（`Mid-Autumn Festival`） |
| D17 | 组件来源 | **React Bits 走 shadcn CLI 安装**（`npx shadcn@latest add https://reactbits.dev/r/<Name>-TS-TW`），落到 `src/components/reactbits/` |
| D18 | 背景实现 | **纯 CSS 三层 Aura**（`mix-blend-mode` + SVG 颗粒 + 压暗面纱），**不再用 WebGL**。~~曾用 `ogl` + `<Aurora>`~~，已卸载，省约 100KB；额外收益是 `html-to-image` 也能截到，导出卡片可复用同一套背景 |
| D19 | 展示字体 | **Space Grotesk**（`next/font/google`，只自托管 latin 子集）；中文走系统栈 PingFang SC / Microsoft YaHei |
| D20 | 翻牌时钟 | **自研 `FlipClock`**，不用 React Bits 的 `SplitFlapText`——后者只在 `words[]` 轮换时动，单 `text` 模式下是瞬跳，做不了逐秒倒计时 |
| D21 | 设置入口 | **不做 `/settings` 路由**，设置收进顶栏齿轮 → Sheet 抽屉 |
| D22 | 日期格式化 | **手写查表实现，不用 `Intl`**——Node 与浏览器对 `zh-CN` 的细节输出不一致，静态导出下会 hydration mismatch |

### 0.2 红线（违反即返工）

1. **`#100e0b` 只能放在 `<body>` / 页面根容器上。** 渐变容器自身必须透明——否则 `mix-blend-mode` 会与容器底色合成，颜色错误。
2. 渐变容器必须显式 `min-height`（如 `100svh`），因为绝对定位子层贡献 0 高度。
3. 所有装饰层：`pointer-events: none` + `aria-hidden="true"`；容器 `position: relative` + `overflow: hidden`。
4. 页面内容必须包在 `position: relative; z-index: 1` 的容器里，否则被装饰层盖住。
5. **不生成任何占位/示例文案**（"Lorem ipsum"、"示例事件" 等）。空态用真实的功能性引导文案。
6. 时间相关 UI 不得在服务端渲染时求值 → 必须走 `useHydrated()`（见 §11.2），否则 hydration mismatch。
7. 不使用静态导出不支持的能力：`getServerSideProps` / API Routes / Route Handlers / ISR / middleware / 默认 `next/image` 优化 / rewrites / redirects。
8. 只做本文档要求的事，不顺手重构、不新增未列出的依赖。
9. **文案一律走字典 `t()`。** 组件里不得出现裸中文字符串（`src/i18n/locales/*` 之外）。
10. **全站只能有一个 WebGL context。** 新增动效背景前先确认没有第二个 `<canvas>` 在跑。
11. **导出卡片内不得用 WebGL / `backdrop-filter`。** `html-to-image` 走 SVG `foreignObject`，两者都会被丢掉（详见 §8.8）。
12. **导出卡片的背景必须纯 CSS**，否则导出的图会是透明板。
13. `src/components/reactbits/` 下的文件是上游生成物，统一带 `// @ts-nocheck`。**改它们必须在注释里写清原因**（已改：`SpotlightCard`、`SplitText`）。
14. **不要直接调用只存在于「安全上下文」的浏览器 API。** `crypto.randomUUID()`、`navigator.clipboard`、`navigator.serviceWorker` 在 `http://192.168.x.x` 这类地址下整个是 `undefined`——局域网真机上打开时，`crypto.randomUUID()` 会抛 `TypeError`，表现就是「点新建倒计时没反应」。统一走 `src/lib/uuid.ts` 的 `createId()` 与 `src/lib/clipboard.ts` 的 `copyText()`；其余场景先判 `window.isSecureContext` 再降级。
15. **`GlareHover` 内部写死了 `grid place-items-center`，是把内容"居中"而不是"铺满"。** 中文说明文字比英文更容易折成两行，内容一高一矮，同一行里的两张卡就对不齐——现象是「英文站正常、中文站错位」。卡片场景必须用内联 `style={{ placeItems: 'stretch' }}` 覆盖（内联优先级高于 class，不必改上游），只有按钮/芯片这类尺寸自适应的场景才保留默认居中。

---

## 1. 项目目标与范围

### 1.1 一句话

一个可安装到桌面的、暗色氛围感十足的中国节假日 + 自定义事件倒计时应用：一眼看到「距下一个假期还有几天」，可建自己的纪念日/发薪日，可导出分享卡片，可丢到副屏当大屏时钟。



## 2. 技术栈与版本

| 层 | 选型 | 约束与注意 |
| --- | --- | --- |
| 框架 | **Next.js 16.3.5**（App Router） | Next 16 默认 **Turbopack**；本项目的 Service Worker 方案见 §8.9，避免踩 webpack 依赖 |
| UI 运行时 | React 19.x | Next 16 配套版本，勿降级 |
| 语言 | **TypeScript 7.0.2**（strict） | `noUncheckedIndexedAccess: true`；`tsc --noEmit` 是质量门第一关 |
| 样式 | **Tailwind CSS v4**（CSS-first，`@theme`） | v4 无 `tailwind.config.ts`，token 写在 `globals.css` |
| 组件 | **shadcn/ui**（new-york 风格） | 按需 `add`，不整包引入；Dialog / Sheet / Switch 在用 |
| 动效组件 | **React Bits**（经 shadcn CLI） | 落在 `src/components/reactbits/`，默认导出，文件带 `@ts-nocheck`，见 §4.11 |
| 图标 | **lucide-react** | 统一 `size={16|18|20}`，`strokeWidth={1.75}` |
| 状态 | **Zustand** + `persist` 中间件 | 关键：`skipHydration: true` + 手写 rehydrate（见 §11.2） |
| 日期 | **自己写**（`src/i18n/format.ts` 查表） | **不用 `Intl`、不用 date-fns**：需要跨环境 100% 确定的输出（D22） |
| 动画 | **gsap** + `@gsap/react`，少量 **motion** | React Bits 自带；尊重 `prefers-reduced-motion` |
| 背景 | — | 纯 CSS 三层 Aura，**无 WebGL 依赖**（D18） |
| 翻牌时钟 | **自研 `src/components/countdown/FlipClock.tsx`** | 不用 `@hasthiya_/flip-clock`，也不用 `SplitFlapText`（D20） |
| 卡片导出 | **html-to-image** | `toPng` / `toJpeg`，`pixelRatio` 移动端 3、桌面 2；模板内禁 WebGL / `backdrop-filter` |
| 类名合并 | **clsx** + **tailwind-merge** → `cn()` | 唯一工具函数入口 `src/lib/utils.ts` |
| PWA | **手写 manifest + sw.js**（已定，见 §8.9） | 无构建期插件，与 Next 16 Turbopack 零摩擦 |
| 单测 | vitest（仅纯函数） | §10.1 列出的模块必须有测试 |

### 2.1 需要额外引入的依赖

已定并已安装：

| 包 | 用途 | 理由 |
| --- | --- | --- |
| `qrcode` | 导出卡片上的二维码 | 生成 dataURL 交给模板渲染，体积小、无原生依赖 |
| ~~`ogl`~~ | ~~Aurora 背景~~ | **已卸载**：D18 改为纯 CSS 后不再需要 |

**已明确不引入**：`lunar-javascript`（农历/节气改为静态表 + 按需手算，避免为一个 P2 功能背一个数据包）、
`date-fns`、`framer-motion`、`@hasthiya_/flip-clock`（均已安装过又被移除，勿再加回）。

---

## 3. 部署：GitHub Pages

### 3.1 `next.config.ts`

```ts
import type { NextConfig } from 'next';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

const nextConfig: NextConfig = {
  output: 'export',
  basePath,
  assetPrefix: basePath || undefined,
  trailingSlash: true,        // 每个路由产出 xxx/index.html，GH Pages 直接可访问
  images: { unoptimized: true },
  reactStrictMode: true,
};

export default nextConfig;
```

- **本地开发**：`npm run dev`（`basePath` 为空，访问 `http://localhost:3000`）
- **生产构建**：`NEXT_PUBLIC_BASE_PATH=/Countdown npm run build` → 产物在 `out/`

### 3.2 必须处理的坑

| 坑 | 处理 |
| --- | --- |
| `_next/` 目录被 Jekyll 忽略 | 构建后 `touch out/.nojekyll` |
| 静态资源 404 | 所有手写的 `href`/`src`（manifest、icon、sw）必须拼接 `basePath`，用 `process.env.NEXT_PUBLIC_BASE_PATH` 变量，勿硬编码 |
| SW scope | 注册 `/Countdown/sw.js`，`scope: '/Countdown/'` |
| 路由刷新 404 | `trailingSlash: true` 已解决；不要用 404.html 兜底 hack |
| 仓库 Pages 开关 | Settings → Pages → Source 选 **GitHub Actions**（不要选 branch） |

### 3.3 `.github/workflows/deploy.yml`

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run typecheck
      - run: npm run test
      - run: npm run build
        env:
          NEXT_PUBLIC_BASE_PATH: /Countdown
      - run: touch out/.nojekyll
      - uses: actions/upload-pages-artifact@v3
        with:
          path: out

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.build.outputs.page_url || '' }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

---


### 4.10 国际化（方案 A：客户端字典）

**结构**

```
src/i18n/
  index.tsx          # I18nProvider / useI18n / useT / detectLocale / MessageKey
  format.ts          # 手写的日期格式化（D22），全部收 `locale` 入参
  locales/zh.ts      # 源字典，导出 type Dictionary = typeof zh
  locales/en.ts      # const en: Dictionary —— 键对不上直接编译不过
```

**规则**

1. `zh.ts` 是唯一真源。`en.ts` 声明为 `Dictionary`，**少一个键就编译报错**，不会静默回落。
2. `MessageKey` 是从字典推导出的点路径联合（`'nav.home' | 'hero.eyebrow' | …`），
   所以 `t('nav.hoem')` 是编译错误，而不是运行时把键名显示出来。
3. 组件里**不得出现裸中文**。文案一律 `t()`；数据层的双语字段（如 `HolidayPeriod.nameEn`）走 `holidayName(period, locale)`。
4. **语言状态放在 store 的 `settings` 里**（`locale` + `localeExplicit`），进 `localStorage`，
   不用 URL、不用 cookie。首次访问跟 `navigator.language`；用户手动切过之后 `localeExplicit = true`，不再自动跟随。
5. `<html lang>` 由 effect 跟着 `locale` 更新。
6. **同一个 key 不能出现在两个父对象里造成语义冲突**。踩过的坑：`dayAfter` 既想表示「后天」又想表示「日」后缀，
   正确做法是拆成 `common.dayAfter`（后天）与 `event.dayAfter`（日期后缀）。
7. 英文侧要检查**语序**：表单里「每月 [X] 日」的中英语序不同，不能只换词，
   要拆成 `dayBefore` / 数字框 / `dayAfter` 三段。
8. 农历**用拼音不意译**（D16）。
9. **GSAP `SplitText` 会往宿主元素写一次 `aria-label` 且只写一次**。
   文案会变的场景（Hero 假期名）必须把 `aria-label` 跟着 `text` 同步，
   否则切语言后屏幕阅读器仍念旧语言（已在 `reactbits/SplitText.tsx` 补了 effect）。

### 4.11 React Bits 使用规约

**安装**

```bash
npx shadcn@latest add https://reactbits.dev/r/<Name>-TS-TW
```

四种变体 `-TS-TW` / `-TS-CSS` / `-JS-TW` / `-JS-CSS`，本项目统一 **TS + Tailwind（`-TS-TW`）**。
产物落在 `src/components/<Name>.tsx`，需移动到 `src/components/reactbits/`。

**类型策略**

这些文件内部在 `strict + noUncheckedIndexedAccess` 下不成立（大量 `undefined` 赋值）。
统一在首行加 `// @ts-nocheck`：**导出签名仍受调用方检查**，内部不查。
调用方一律 `import X from '@/components/reactbits/X'`（全部默认导出）。

**已排除的组件（别装、别用）**

| 组件 | 排除原因 |
| --- | --- |
| `GooeyNav` | 往 `<head>` 注入全局 `<style>`，且硬编码黑白色，污染整站配色 |
| `TiltedCard` | 必须有图片输入，本项目无对应场景 |
| `AnimatedList` | 只接受 `string[]`，塞不进 ReactNode |
| `Stepper` | 是「分步向导」，不是「步骤展示」，语义不符 |
| `PillNav` | 依赖 `react-router-dom`，与 Next App Router 冲突 |
| `SwipeRow` | 依赖 `hugeicons`，多背一个图标库 |
| `Stack` | 可拖拽卡片堆，无场景 |
| `three` / R3F 全家桶 | 体积远超需要（连轻量的 `ogl` 也已在 D18 改纯 CSS 后卸载） |
| `SplitFlapText` | 逐秒倒计时做不了（D20） |

**性能红线**

- 全站**不含 WebGL**（D18）：背景是 `<Backdrop>` 里三层纯 CSS Aura，不占 GPU 上下文
- 滚动类组件（`ScrollReveal` / `FadeContent` / `ScrollVelocity`）不要嵌套使用，会互相抢 ScrollTrigger
- `Counter`、`AnimatedList` 这类带 `motion` 的组件，别放进每秒重渲染的子树里

---

## 5. 信息架构与页面

**四个页面。** 设置不是路由，是顶栏齿轮打开的 Sheet（D21）。

| 路由 | 实现 | 内容 |
| --- | --- | --- |
| `/` | `src/app/page.tsx` | 落地页：Hero（只放最近一个日期）+ 进行中区块 + 功能区 + 收尾 CTA |
| `/countdowns/` | `src/app/countdowns/page.tsx` | 统计 + 搜索 + 标签筛选 + 排序 + 分区列表（进行中 / 法定节假日 / 我的事件 / 已结束） |
| `/pomodoro/` | `src/app/pomodoro/page.tsx` | 番茄工作法：翻牌计时 + 可配置时长与轮次 + 大屏浮层（含浏览器全屏）+ 今日统计 |
| `/fullscreen/` | `src/app/fullscreen/page.tsx` | 单目标翻牌大屏，左右切换，键盘 ←/→，Esc 退出 |
| `not-found` | 自动 | 极简 |

**全局浮层必须每页都挂**：`EventFormDialog`、`ExportDialog`、`SettingsSheet`
（首页与 `/countdowns/` 额外挂 `DeepLinkHandler`）。
不是因为每页都要用它们，而是全局快捷键 `n` / `e` 会打开前两个——
哪页漏挂，那一页按 `n` 就会把 `composerOpen` 置 true 却没有任何东西显示，
而 `overlayOpen` 一旦为真，其余快捷键全部失效，只能靠 Esc 解套。

### 5.1 首页分区（自上而下）

1. **顶栏**（`68px`，`sticky`）：左侧字标 `COUNTDOWN`（`ShinyText`）；中间四个导航
   （首页 / 全部倒计时 / 番茄钟 / 大屏，当前项高亮）；右侧隐私开关（`Magnet` + 眼睛）、设置齿轮（`Magnet`）。
2. **Hero**（`HolidayHero`，`.hero-screen` 占满首屏，`ClickSpark` 包住）：
   - 药丸徽章（`ShinyText` + 呼吸点）
   - 双行大标题（`SplitText` 逐字入场，「都值得倒数」用强调色 + 外发光）
   - 一句说明（`AnimatedContent`）
   - **唯一的那个日期**：卡片内放假期名 / 农历 / 日期区间 / `FlipClock tone="hero"` / 工作日提示
   - 双药丸按钮：`开始倒数`（`StarBorder` → `/countdowns/`）、`大屏模式`（`Button outline` → `/fullscreen/`）
   - 底部滚动提示 → `#features`
3. **进行中区块**（`OngoingSection`）：仅当某假期 `phase === 'ongoing'` 时出现，`BorderGlow` + FlipClock。
4. **功能区**（`FeatureSection`，`id="features"`）：`BlurText` 标题 → `CountUp` 统计条 → 四张功能卡
   （前两张 `SpotlightCard`，后两张 `GlareHover`，全部包在 `FadeContent` 里）。
5. **收尾 CTA**（`ClosingSection`）：`BlurText` + `StarBorder` → `/countdowns/`。
6. **页脚**（`SiteFooter`）：字标 + 一句 tagline + **微信联系入口**（`ContactDialog` 弹二维码）。
   **不留「数据留在本机」「源码链接」这类废话。**

> 首页 Hero 元素上限 7 个，**不再加**。统计数字与列表全部收敛到 `/countdowns/`。
> Hero 的纵向节奏（`pt-8` / 卡片 `mt-9` / 卡内 `py-7` / `FlipClock mt-6` / 按钮 `mt-8`）
> 是压过的，改任何一个数之前先量一次 1440×900 首屏，两个按钮必须露得出来。

### 5.2 番茄钟（`/pomodoro/`）

- 计时核心 `PomodoroTimer`：阶段芯片 → `PomodoroClock`（分:秒）→ 进度条 →
  开始/暂停（`StarBorder` + `Magnet`）/ 重置 / 跳过 / 大屏。
- 配置面板 `PomodoroBoard`：三档快捷预设（`GlareHover`）+ 四个数字输入 + 两个开关。
- **剩余时间永远由 `endsAt - now` 现算**（见 §11.3），不自减，否则标签页被节流、
  或中途刷新都会走偏。
- 「到点」分两种处理：页面开着时按 `autoNext` 自动接下一段；**页面没开着的期间过点，
  则结算一段并停下来等人**（`advance(true, false)`），否则一进页面就看到它在自己跑。
- 大屏：`ui-store` 的 `immersiveOpen` 控制浮层，同时让全局快捷键让路（见 §8.15）。
  浮层内键盘：空格 / R / F / Esc。浏览器全屏与浮层是两个独立开关。

### 5.3 移动端差异

- 顶栏导航隐藏（`md:flex`），入口收进 Sheet
- Hero 主数字按视口收窄，`FlipClock` 按容器宽反算字号
- 卡片单列
- 导出倍率从 2× 提到 3×（对齐移动端高 DPI）
- 底部安全区 `padding-bottom: env(safe-area-inset-bottom)`

---

## 6. 数据模型

`src/types/index.ts`：

```ts
/** ---------- 节假日 ---------- */
export type HolidayKind = 'statutory' | 'festival' | 'custom';
export type Confidence = 'official' | 'estimated';

export interface HolidayPeriod {
  id: string;
  name: string;
  kind: HolidayKind;
  /** 放假首日 00:00:00+08:00 */
  start: string;
  /** 放假末日 23:59:59+08:00 */
  end: string;
  /** 共放假天数（含首末日） */
  days: number;
  /** 调休上班日 YYYY-MM-DD */
  makeupWorkdays: string[];
  /** 农历描述，如「八月十五」 */
  lunar?: string;
  /** official = 官方通知；estimated = 预估待公布 */
  confidence: Confidence;
  /** 数据来源说明 */
  source?: string;
  /** 该年份全部法定放假日期（含节假日，用于工作日计算） */
  offDays?: string[];
}

/** ---------- 自定义事件 ---------- */
export type EventTag = 'work' | 'life' | 'anniversary' | 'payday' | 'holiday';

export interface Recurrence {
  kind:
    | 'none'
    | 'daily'
    | 'weekly'
    | 'monthly'
    | 'yearly'
    | 'monthlyNthWeekday'
    | 'monthlyLastWorkday'
    | 'payday';
  interval?: number;                 // daily
  weekdays?: number[];               // weekly, 0=周日
  day?: number;                      // monthly / yearly / payday，31 表示「月末」
  month?: number;                    // yearly, 1-12
  nth?: 1 | 2 | 3 | 4 | -1;          // monthlyNthWeekday，-1 = 最后一个
  weekday?: number;                  // monthlyNthWeekday
  adjust?: 'none' | 'forward' | 'backward'; // payday：遇周末提前/延后
  calendar?: 'solar' | 'lunar';      // 纪念日：公历 / 农历
}

export interface CountdownEvent {
  id: string;
  title: string;
  /** 全天事件：start 为当日 00:00:00+08:00，end 为当日 23:59:59+08:00 */
  allDay: boolean;
  start: string;
  end: string;
  tag: EventTag;
  color?: string;                    // 覆盖默认标签色
  icon?: string;                     // lucide 图标名
  note?: string;
  pinned: boolean;
  recurrence: Recurrence;
  createdAt: string;
  updatedAt: string;
  /** 隐私模式下是否隐藏标题（默认跟随全局） */
  hideTitle?: boolean;
}

/** ---------- 派生（不落盘） ---------- */
export type EventPhase = 'upcoming' | 'ongoing' | 'ended';

export interface CountdownView {
  phase: EventPhase;
  /** 距开始剩余天数（ceil），已开始为 0 */
  daysToStart: number;
  /** 距开始剩余小时（含天内余数，floor） */
  hoursToStart: number;
  /** 进行中：剩余天数 / 小时 */
  daysLeft: number;
  hoursLeft: number;
  /** 已过去时长（天） */
  daysElapsed: number;
  /** 0–1，基于 [start, end] */
  progress: number;
  /** 已点亮的里程碑天数 */
  milestones: number[];
  /** 是否进入最后 24 小时 */
  isFinalDay: boolean;
  /** 下一个发生时间（重复事件解析后） */
  nextOccurrence?: string;
}

/** ---------- 设置 ---------- */
export interface Settings {
  /** 隐私模式：隐藏事件标题，只显示倒计时 */
  privacyMode: boolean;
  /** 默认只看未来（隐藏已结束事件） */
  hideEnded: boolean;
  sortMode: 'nearest' | 'pinned' | 'created' | 'title';
  showSeconds: boolean;
  /** 界面语言（D14） */
  locale: Locale;                    // 'zh' | 'en'
  /** 见 D15：false 时跟随 navigator.language，用户手动切过即置 true */
  localeExplicit: boolean;
  /** 减弱动效：关闭 WebGL 背景与入场过渡 */
  reduceMotion: boolean;
}
```

`DEFAULT_SETTINGS`：`privacyMode: false`、`hideEnded: true`、`sortMode: 'nearest'`、`showSeconds: true`、
`locale: 'zh'`、`localeExplicit: false`、`reduceMotion: false`。

> 已从 Settings 移除：`quotesEnabled`（每日一句功能未纳入本期，见 §8.13）、`groupMode` / `weekStartsOn` /
> `timezone`（UTC+8 是硬约束，不是设置项）、`lastExportAt`（导出时间未做持久化）、
> `progressBase`（已由 D11 拍板，不再是可选项）。

### 6.1 状态机

| 状态 | 条件 | 展示 |
| --- | --- | --- |
| `upcoming` | `now < start` | 「距离 XX 还有 X 天 X 小时」 |
| `ongoing` | `start ≤ now ≤ end` | 「假期进行中，还剩 X 天 X 小时」 |
| `ended` | `now > end` | 首页隐藏；`/countdowns/` 列表里可见（受 `settings.hideEnded` 控制） |

### 6.2 「最近一个假期」选择算法

```
1. 若存在 phase === 'ongoing' 的假期 → 选它（假期余额优先）
2. 否则取 start > now 中 start 最小者
3. 若全部 ended → 首页 Hero 显示空态：提示节假日数据已过期 + 引导到顶栏齿轮（设置 Sheet）导入新数据
```
多个假期重叠时（如国庆与自定义"秋季旅行"）：**法定假期优先**，自定义事件在 Hero 下方并列展示。

### 6.3 派生指标定义（**必须严格一致，用于单测**）

| 指标 | 公式 |
| --- | --- |
| 距开始剩余天数 | `Math.ceil((start - now) / 86400000)` |
| 距开始剩余小时 | `Math.floor((start - now) / 3600000) % 24` |
| 剩余天数（进行中） | `Math.floor((end - now) / 86400000)`（不足 1 天为 0） |
| 剩余小时（进行中） | `Math.floor((end - now) / 3600000) % 24` |
| 已过去天数 | `Math.floor((now - start) / 86400000)` |
| 进度 | `clamp((now - start) / (end - start), 0, 1)`，`start ≥ end` 时取 1 |
| 最后 24 小时 | `0 < start - now ≤ 86400000`（未开始）或 `0 < end - now ≤ 86400000`（进行中）→ 展示 `时:分:秒` |
| 总天数 | `Math.round((end - startOfDay(start)) / 86400000) + 1` |

**进度基准说明（D11）**：假期无「创建时间」，统一以 `start` 为基准；自定义事件以 `createdAt` 为基准。
假期进度条**仅在 `ongoing` 时展示**。这不是设置项，不再提供切换。

### 6.4 Store Schema

```ts
/**
 * 实际落盘内容 = `partialize` 的结果。只有这 4 个键会进 localStorage，
 * 派生量（milestones / 状态机 / 工作日统计）一律**现算不落盘**。
 */
interface PersistedState {
  events: CountdownEvent[];
  trashedEvents: { id: string; payload: CountdownEvent; deletedAt: string }[];
  settings: Settings;
  hasSeenStorageWarning: boolean;
}
```

- key：`countdown:v1`（`SCHEMA_VERSION = 1`）
- `skipHydration: true` + 客户端 `StoreHydration` 手动 rehydrate（见 §11.2）
- **新增设置项不靠 version 升级**：`migrate` 目前是恒等函数，兼容性由 `merge` 承担——
  `settings: { ...DEFAULT_SETTINGS, ...persisted.settings }`，老数据缺键时自动兜底
- 回收站保留 **30 天**，启动时清理过期项
- 每次 `set` 写盘走 **300ms debounce** 的自定义 `storage`，避免拖动时高频序列化
- 跨标签页同步：监听 `window.addEventListener('storage')` → 只更新 store，不回写

> 已从 Schema 移除：`holidayOverrides`（§7.4 的导入节假日 JSON 未纳入本期）、`milestonesHit`
> （里程碑改为按需计算，不持久化）、`dailyQuote`（见 §8.13）。

---

## 7. 节假日数据

### 7.1 数据来源与可信度

| 年份 | 状态 | 口径 | 来源 |
| --- | --- | --- | --- |
| 2026 | ✅ 官方已核实 | 放假安排（含调休） | 国务院办公厅《关于2026年部分节假日安排的通知》国办发明电〔2025〕7号（2025-11-04） |
| 2027 | ✅ 法条已确定 | **法定节假日 13 天**，不含调休 | 《全国年节及纪念日放假办法》（国务院令第795号，2024-11-10 第四次修订，2025-01-01 施行） |

`confidence` 字段保留两个取值：

| 值 | 含义 |
| --- | --- |
| `official` | 国务院办公厅通知公布的放假安排（含调休、补班） |
| `statutory` | 依《放假办法》确定的法定节假日日期，未含调休 |

**展示要求（D8）**：`statutory` 数据**不显示任何角标**。它本身就是法条确定的事实，不是估算。
仅在设置 Sheet 的数据来源说明里注明「2027 年暂不含调休安排，官方通知发布后更新」。

### 7.2 2026 年数据（JSON）

```jsonc
{
  "year": 2026,
  "confidence": "official",
  "source": "国务院办公厅关于2026年部分节假日安排的通知（国办发明电〔2025〕7号）",
  "periods": [
    {
      "id": "2026-zhongqiu",
      "name": "中秋节",
      "kind": "statutory",
      "start": "2026-09-25T00:00:00+08:00",
      "end": "2026-09-27T23:59:59+08:00",
      "days": 3,
      "makeupWorkdays": [],
      "lunar": "八月十五",
      "confidence": "official",
      "offDays": ["2026-09-25", "2026-09-26", "2026-09-27"]
    },
    {
      "id": "2026-guoqing",
      "name": "国庆节",
      "kind": "statutory",
      "start": "2026-10-01T00:00:00+08:00",
      "end": "2026-10-07T23:59:59+08:00",
      "days": 7,
      "makeupWorkdays": ["2026-09-20", "2026-10-10"],
      "confidence": "official",
      "offDays": ["2026-10-01","2026-10-02","2026-10-03","2026-10-04","2026-10-05","2026-10-06","2026-10-07"]
    }
  ]
}
```

> 需求约定：2026 只内置 **中秋、国庆**（其余法定假期在 9/21 当天均已过去）。
> 若后续需要「今年已休多少天」的完整统计，见附录 A 的 2026 全年数据（可选启用）。

### 7.3 2027 年数据（法定节假日口径，共 13 天）

依据《全国年节及纪念日放假办法》第二条「全体公民放假的节日」逐条推导：

| 节日 | 法条规定的放假日期 | 2027 年对应区间 | 星期 | 天数 |
| --- | --- | --- | --- | --- |
| 元旦 | 1月1日 | 1/1 | 五 | 1 |
| 春节 | 农历除夕、正月初一至初三 | 2/5 – 2/8 | 五–一 | 4 |
| 清明节 | 农历清明当日 | 4/5 | 一 | 1 |
| 劳动节 | 5月1日、2日 | 5/1 – 5/2 | 六–日 | 2 |
| 端午节 | 农历端午当日 | 6/9 | 三 | 1 |
| 中秋节 | 农历中秋当日 | 9/15 | 三 | 1 |
| 国庆节 | 10月1日至3日 | 10/1 – 10/3 | 五–日 | 3 |
| **合计** | | | | **13** |

**实现口径（D8）**：`confidence: 'statutory'`，`makeupWorkdays: []`。**不推断补假与连休**——
法定假日逢周六周日应补假，那属于调休范畴，需等国务院办公厅通知。
官方通知发布后，把 `start`/`end` 换成连休区间、补上 `makeupWorkdays`、`confidence` 改为 `official` 即可，**逻辑无需改动**。

> 副作用：劳动节 5/1–5/2 与国庆 10/1–10/3 在 2027 年正好落在周末，实际连休一定会更长。
> 这是已知且可接受的取舍——显示法条事实，而不是猜一个数字。

### 7.4 导入节假日 JSON（**未纳入本期**）

原设计是在设置 Sheet 里提供「更新节假日数据」入口。**v2 重构后此项不在范围内**，
`holidayOverrides` 也随之从 Schema 移除。保留以下口径备将来启用：

- 接受格式：单个年份对象或 `HolidayPeriod[]`
- 校验：字段完整性、`start < end`、日期格式、年份合法性 → 失败逐条报错，不写入
- 预览：表格展示「将新增 N 条 / 覆盖 M 条」的 diff，用户确认后写入
- 优先级：用户数据 > 内置数据
- 提供「恢复内置数据」按钮

> 目前的替代路径：内置数据随仓库更新，用户侧不需要导入能力。等 2027 官方通知发布后再决定是否补这个功能。

---

## 8. 功能规约

### 8.1 假期状态与 Hero（P0）

- 三种状态文案与展示见 §6.1
- 显示：假期名、总天数、开始时间、结束时间、农历、补班日
- 时间格式：`2026年9月25日 周五 00:00`；区间用 `→` 连接，跨月保留月份
- 补班日以 `--color-alert` 标签 + `CalendarClock` 图标展示（**色彩不作为唯一载体**）
- 「加入日历」：生成一段文本 + `.ics` 文件下载（`data:text/calendar`），无需后端

**验收**：系统时间调到 2026-09-24 23:30 → Hero 显示最后 24h 模式且秒数每秒跳动；调到 9/25 00:01 → 变「进行中」；调到 10/8 → 变「已结束」并隐藏。

### 8.2 自定义事件 CRUD（P0）

表单字段：标题\* / 开始\* / 结束（全天开关）/ 标签\* / 颜色 / 图标 / 备注 / 置顶 / 重复规则 / 隐私（隐藏标题）

| 操作 | 入口 |
| --- | --- |
| 新建 | 顶栏 `+`、快捷键 `N`、移动端 FAB |
| 编辑 | 卡片点击 → 详情 Sheet → 编辑 |
| 删除 | 详情内删除（进回收站）、卡片左滑（移动）/ 右键菜单（桌面） |
| 置顶 | 卡片图钉图标，`pinned` 排序优先 |

**校验**：标题非空 ≤ 60 字；`end ≥ start`；重复规则与显式日期冲突时以规则为准并给出提示。

**验收**：新建 → 关闭浏览器 → 重开，事件仍在且排序正确。

### 8.3 重复规则引擎（P0）

`src/lib/recurrence.ts` 导出纯函数：

```ts
resolveNextOccurrence(rule: Recurrence, from: Date, holidays: HolidayIndex): Date | null
resolveOccurrences(rule: Recurrence, range: { start: Date; end: Date }, holidays: HolidayIndex): Date[]
```

| 规则 | 语义 |
| --- | --- |
| 每天 | 每 N 天，默认 1 |
| 每周 | 指定星期几，可多选 |
| 每月 | 指定日（1–31），**31 在小月自动落到月末** |
| 每年 | 指定月 + 日 |
| 每月第几周 | 第 1/2/3/4/最后 个 周X |
| 每月最后一个工作日 | 排除周末 + 法定节假日 + 计入补班日 |
| 发薪日 | 每月固定日 + 遇周末/节假日 `提前` / `延后` / `不变` |
| 农历重复 | 生日/纪念日按农历，`calendar: 'lunar'` |

**边界**：闰年 2/29（非闰年落到 2/28）、跨年、DST（本项目锁 UTC+8，无 DST）。

**验收**：单测覆盖上表每一条 + 4 个边界。

### 8.4 发薪日模板（P1）

预设：`每月 5 日`、`每月 10 日`、`每月 15 日`、`每月最后一个工作日`、`自定义`。
`adjust` 默认 `backward`（提前到前一工作日）。

### 8.5 排序 / 分组 / 搜索（P1）

- **排序**：最近到期优先（默认）/ 置顶优先 / 创建时间 / 标题。`pinned` 永远排在未置顶之前，作为一级排序键。
- **分组**：不分组（默认）/ 按标签 / 按状态（进行中 → 未开始 → 已结束）
- **过滤**：隐藏已过期（默认开）；标签多选；仅看置顶
- **搜索**：实时过滤 `title` / `note` / 标签名，输入 150ms debounce，命中片段高亮
- 状态持久化到 `settings`

**验收**：搜索"纪念"能命中标题含"纪念"、备注含"纪念"、标签为"纪念日"的事件。

### 8.6 进度与状态（P0）

- 进度条：细线（`3px`）圆角，填充 `--color-accent`，`role="progressbar"` + `aria-valuenow`
- **基准（D11）**：假期用 `[start, end]`；自定义事件用 `[createdAt, end]`。
  假期没有「创建时间」，若也用 `start`，事件在开始前会一直显示 0% —— 一条死进度条。
- **假期进度条只在 `ongoing` 时渲染**。未开始时不显示进度条，改由里程碑 + 工作日数承担信息量。
- 里程碑徽章：`100 / 50 / 30 / 10 / 3 / 1` 天，**按展示口径判定（D12）**——
  天数取 floor，保证「屏幕显示 3 天」时「3 天」徽章必定点亮。
- 跨过阈值时触发一次性脉冲动画。**达成的阈值不持久化**——`milestones.ts` 是纯函数，
  每次按当前时间重算，天然不会有「重复触发」问题（也就没有 `milestonesHit` 这个键，
  见 §6.4）。「重置里程碑」按钮同理只是改事件的起始基准，不需要额外存储
- 最后 24 小时：`时:分:秒` 逐秒跳动，等宽数字，秒位隔离在最小子树内（见 §11.3）
- 正计时：进行中或已结束事件显示「已过去 X 天 X 小时」
- 提供「重置里程碑」按钮（详情内）

### 8.7 本地数据（P0）

| 功能 | 规格 |
| --- | --- |
| 自动保存 | persist 中间件 + 300ms debounce |
| 设置项兼容 | **不靠 version 迁移**：`migrate` 是恒等函数，老数据缺键由 `merge` 用 `DEFAULT_SETTINGS` 兜底 |
| 回收站 | 删除进回收站，30 天自动清理；可还原 / 彻底删除 / 清空 |
| 导出 JSON | `{ app: 'countdown', version, exportedAt, events, trashedEvents, settings }`，文件名 `countdown-backup-YYYYMMDD-HHmm.json` |
| 导入 JSON | 校验 → 逐条统计 → 覆盖写入（`importState` 返回写入条数供提示）；导入前页面已提示可先导出当前数据 |
| 清空数据 | 二次确认：输入确认文字才可点击；说明不可恢复 |
| 风险提示 | 设置 Sheet 与首页页脚显示：**浏览器缓存可能被清理，建议定期导出备份**；`hasSeenStorageWarning` 控制首次 Toast |

> 导出用的键名是 `version`（不是 `schemaVersion`），且**不再包含 `holidayOverrides`**（见 §7.4）。

### 8.8 卡片导出（P1）

| 能力 | 实现 |
| --- | --- |
| PNG / JPEG | `html-to-image` 的 `toPng` / `toJpeg`，`pixelRatio` 移动 3 / 桌面 2，`quality: 0.95` |
| 复制到剪贴板 | `navigator.clipboard.write([new ClipboardItem({'image/png': blob})])`；不支持时降级为「已下载，请手动复制」 |
| 系统分享 | `navigator.canShare({ files })` 通过则 `navigator.share`，否则隐藏按钮 |
| 尺寸预设 | `1080×1080` / `1080×1920`（Story）/ `1920×1080` |

**7 套模板**（`TemplateId`）：`ambient`（默认）、`minimal`、`grid`、`ticket`、`poster`、`glass`、`terminal`。
全部落在 `src/components/export/templates/index.tsx`，共用一个 `Shell` + `DayDisplay` + `Kicker` + `FooterRow` 零件层。

**模板契约**：模板是纯展示组件，只吃 `CardModel`。

- 文案在 `src/lib/export/card-model.ts` 里按当前语言**定稿后**才传进模板；
  模板里**不允许**出现语言判断、`t()` 调用、store 读取。
- `CardModel` 携带 `kicker` / `headline` / `title` / `targetLabel` / `watermark` / `dayUnit` / `daysLeftLabel`，
  模板不再自己拼任何用户可见字符串。
- 尺寸全部走 `u(n)`（1080 设计坐标 → CSS 像素），保证任意导出倍率下构图一致。

**模板的两条硬约束**

1. **背景必须纯 CSS**。`html-to-image` 走 SVG `foreignObject`，WebGL canvas 与 `backdrop-filter` 都会被丢掉，
   导出的图会是透明板。`glass` 模板刻意用「半透明填充 + 内高光描边 + 外投影」仿通透感，就是为此。
2. **字体栈以 `var(--font-grotesk)` 打头**（next/font 挂在 `<html>` 上，卡片在同一文档内可直接引用），
   后面跟系统字体兜底——嵌入 webfont 偶尔失败，至少要落到一套干净的几何无衬线。

可选元素（开关）：标题 / 目标时间 / 剩余天数 / 进度条 / 标签 / 二维码。

**隐私导出**：标题被 `maskTitle()` 替换为 `••••••`，其余元素不变（`export.privacyHidden`）。

**验收**（已在无头 Chrome 实测）：点「导出卡片」→ 选模板 → 点 PNG，落盘文件 PNG 签名为
`89504e470d0a1a0a`，IHDR 读出 `width=1080, height=1080`（方形预设 2× 导出）。
判定图是否完整用「读 PNG IHDR 反推分辨率」，比看截图可靠。

### 8.9 PWA（P1，力求简单）

**方案对比（待拍板 §13-3）**

| 方案 | 说明 | 评价 |
| --- | --- | --- |
| **A. 手写 `manifest.webmanifest` + 极简 `sw.js`（推荐）** | 无构建插件；SW 只做 app shell precache + 导航回退 | 零工具链冲突，与 Next 16 Turbopack 完全兼容，代码量约 60 行 |
| B. `@serwist/next` | 现代替代品，支持 Turbopack，功能完整 | 多一层构建配置；本项目离线需求很浅，偏重 |
| C. `next-pwa`（原要求） | **依赖 webpack**，Next 16 默认 Turbopack → 所有命令需加 `--webpack` | 维护停滞，与 Next 16 摩擦最大，不推荐 |

**要求**

- 可安装到桌面（`display: standalone`）
- 离线可用：app shell + 节假日 JSON + 字体 + 图标全预缓存；离线时首页可正常渲染
- 快捷方式：`最近倒计时` → `/?focus=next&src=shortcut`
- icons：`icon-192`、`icon-512`、`icon-512-maskable`、`apple-touch-icon`
- `theme_color` / `background_color`：`#100e0b`（Diamond Storm 底色，与 `<body>` 一致）
- iOS 补充 meta：`apple-mobile-web-app-capable`、`apple-mobile-web-app-status-bar-style: black-translucent`
- 更新策略：`skipWaiting` + 页面提示「有新版本，点击刷新」
- **已知取舍**：manifest 是构建期单文件，`name` / `description` / 快捷方式名写死中文。
  英文用户安装后桌面图标名仍是中文。可接受（manifest 无法按客户端语言切换，除非做两份 manifest
  并按路径分叉，与「不做语言路由」冲突）。

**验收**：Chrome 显示安装图标 → 安装后独立窗口打开 → 断网刷新仍可用。

### 8.10 全屏大屏模式（P1）

- 独立路由 `/fullscreen/`。`requestFullscreen()` 需用户手势，所以首屏给一个**底部提示胶囊**。
  **不要用铺满屏幕的模糊遮罩**——踩过的坑：`bg-base/80 backdrop-blur-md` 会把倒计时糊到完全读不出来，
  还挡掉顶栏，等于把一个「常驻展示页」变成必须先点一下的页面。
  现方案：底部小胶囊（`z-50`，不覆盖内容）+ 6 秒后自动隐去；提示隐去后左右半区点击区才接管，避免跟顶栏抢点击。
- 内容：目标名 + 日期区间 + 翻牌倒计时（`tone="screen"`，主数字实测 `172.8px`）+ 进行中时显示进度
- 顶栏：`目标 N/M` + 退出全屏 + 回到首页；鼠标静止 3s 后整体淡出（`cursor-none`）
- 翻牌规则：**大屏始终翻牌**（这是大屏的意义）
- 背景：**三层纯 CSS Aura**（`<Backdrop>`）。**不做 `@keyframes` 位移**——静态背景 + 动效内容，避免两层动效抢注意力
- 切换：左右半区点击（各占 20% 宽，`opacity-0`）+ 顶栏按钮 + 键盘 `←` `→`
- **验收**：1440×900 下 `scrollHeight === 900`（不出现滚动条）；时钟容器有效 `opacity === 1`；
  「点击进入全屏」提示 6 秒后不再存在；随后 `inset-y-0` 两个半区点击区挂上

### 8.11 工作日计算（P2）

`src/lib/workdays.ts`：

```ts
isWorkday(date: Date, index: HolidayIndex): boolean
countWorkdaysBetween(from: Date, to: Date, index: HolidayIndex): number
remainingLeaveDaysThisYear(now: Date, index: HolidayIndex): number
usedLeaveDaysThisYear(now: Date, index: HolidayIndex): number
```

```
isWorkday(d) =
  补班日集合.has(d) ? true
  : 放假日期集合.has(d) ? false
  : 周末 ? false
  : true
```

展示：`距下一个假期还有 X 个工作日` / `今年还剩 X 天假期` / `今年已休 X 天` / 补班日列表。

**验收**：以 2026-09-21 为今天 → 「距中秋还有 4 个工作日」（9/21–9/24，其中 9/20 是补班但已过去，不计入）；9/20 应被识别为工作日。

### 8.12 农历 / 节气 / 纪念日（**本期只做最小集**）

**已实现**：内置假期数据里带 `lunar` / `lunarEn` 两个字段，Hero 与假期卡片展示一行农历描述
（如「八月十五」/「Bāyuè Shíwǔ」）。取值走 `holidayLunar(period, locale)`，
英文按 **D16 用拼音、不意译**。

**明确不做**（原 P2 设想，已从范围移除）：

- ❌ 内置农历换算引擎（`lunar-javascript` 不引入，见 §2.1）
- ❌ 二十四节气倒计时
- ❌ 事件支持 `calendar: 'lunar'` 按农历重复（重复规则只支持公历）

理由：为一个「看一眼还有几天」的页面背一整套历法数据不划算。真要做，应先单独评估数据体积。

### 8.13 每日一句 / 鼓励语（**已从范围移除**）

原设想是 `src/data/quotes/` 按 9 个档位各存 ≥ 35 条共 320+ 条文案，按日期做种子伪随机选句。
**v2 重构后不纳入本期**：首页的信息主角是「天数 + 假期状态」，再插一段鼓励语会稀释焦点。

现状：`src/i18n/locales/{zh,en}.ts` 里还留着 `quote` 字典块（`label` / `sourceLabel`），
**无任何组件引用，是待清理的死键**。若确定不做，下次顺手删掉这两块。

> 若将来要恢复：数据文件与选句逻辑放在 `src/lib/quote*.ts`，UI 挂在 Hero 下方，
> 开关走独立设置项——但需要先想清楚它与 Hero 的视觉主次关系。

### 8.14 隐私模式（P2）

- 快捷键 `P` + 顶栏眼睛图标切换，持久化到 `settings.privacyMode`
- 开启后：所有事件标题替换为 `••••••`（保留字数提示），假期名保留（公共信息不敏感），卡片导出同步生效
- 顶栏显示 `隐私模式已开启` 的细条提示

### 8.15 键盘快捷键（P2）

| 键 | 行为 |
| --- | --- |
| `N` | 新建事件 |
| `E` | 导出当前焦点事件卡片 |
| `F` | 进入 / 退出大屏模式 |
| `/` | 聚焦搜索 |
| `P` | 切换隐私模式 |
| `Esc` | 关闭浮层 / 取消输入 |
| `↑` `↓` | 在事件列表间移动焦点 |
| `Enter` | 打开详情 |
| `Delete` | 删除选中（二次确认） |
| `?` | 快捷键帮助弹窗 |

规则：在 `input` / `textarea` / `contenteditable` 中不触发（`Esc` 与 `/` 除外）；移动端不启用。

**新增浮层时必须接进 `overlayOpen`。** 番茄钟的大屏浮层就是例子：它的状态放在
`ui-store.immersiveOpen`，`ShortcutProvider` 把它并进 `overlayOpen`，于是浮层盖着的时候
全局 `F` / `↑↓` / `P` 全部让路，只有 `Esc` 继续透传（用来退出浮层）。
漏接的症状很有迷惑性：按 `F` 想切浏览器全屏，结果整页跳去了 `/fullscreen/`。

---

## 9. 目录结构

```
Countdown/
├─ .github/workflows/deploy.yml
├─ scripts/generate_icons.py      # PWA 图标生成器（纯标准库）
├─ components.json                # shadcn 配置（React Bits 走同一个 CLI）
├─ next.config.ts                 # output:'export' + basePath + trailingSlash
├─ postcss.config.mjs / tsconfig.json / vitest.config.ts
├─ .gitignore                     # 含 .next / out / .preview
├─ public/
│  ├─ .nojekyll
│  ├─ sw.js                       # 手写 Service Worker，路径由 registration.scope 推导
│  └─ icons/{icon-192,icon-512,icon-512-maskable,apple-touch-icon}.png
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx               # 字体(Space Grotesk)、metadata、<Backdrop/>、I18n/SW/Hydration 包裹
│  │  ├─ globals.css              # @theme token（Diamond Storm）+ Aura 三层 + 工具类 + 大屏动画
│  │  ├─ manifest.ts              # PWA manifest（构建期注入 basePath）
│  │  ├─ page.tsx                 # 首页 = 落地页（Hero + 进行中 + 功能区 + 收尾 CTA）
│  │  ├─ countdowns/page.tsx      # 全部倒计时列表
│  │  ├─ pomodoro/page.tsx        # 番茄工作法计时器
│  │  └─ fullscreen/page.tsx      # 大屏展示模式
│  ├─ components/
│  │  ├─ reactbits/*              # 30 个上游生成物，统一 @ts-nocheck，默认导出
│  │  ├─ layout/{Backdrop,TopBar,SiteFooter,ContactDialog}.tsx
│  │  ├─ home/{FeatureSection,ClosingSection}.tsx
│  │  ├─ holiday/{HolidayHero,OngoingSection,HolidayCard}.tsx
│  │  ├─ events/{EventCard,EventFormDialog}.tsx
│  │  ├─ countdowns/CountdownsBoard.tsx
│  │  ├─ pomodoro/{PomodoroBoard,PomodoroTimer,PomodoroClock}.tsx
│  │  ├─ countdown/{FlipClock,ProgressBar,MilestoneBadges}.tsx
│  │  ├─ export/{ExportDialog,ShareCard,templates/index.tsx}
│  │  ├─ settings/SettingsSheet.tsx
│  │  ├─ common/{StoreHydration,ServiceWorkerRegister,DeepLinkHandler}.tsx
│  │  ├─ keyboard/{ShortcutProvider,ShortcutHelpDialog}.tsx
│  │  └─ ui/*                     # shadcn 生成物（button/dialog/input/sheet/switch）
│  ├─ i18n/
│  │  ├─ index.tsx                # I18nProvider + useI18n/useT + 类型安全的键
│  │  ├─ format.ts                # 手写日期格式化（不用 Intl，见 D22）
│  │  └─ locales/{zh.ts,en.ts}    # zh.ts 是唯一真源；Dictionary 由它推导
│  ├─ lib/
│  │  ├─ holidays/{types.ts,index.ts,accents.ts,data/2026.ts,data/2027.ts}
│  │  ├─ {countdown,recurrence,recurrence-label,occurrence,workdays,milestones,tags,time,utils}.ts
│  │  ├─ {uuid,clipboard,chime,pomodoro}.ts   # 非安全上下文降级 / 提示音 / 番茄钟纯逻辑
│  │  └─ export/{types,templates-registry,card-model,to-image,ics,download}.ts
│  ├─ store/{countdown-store,pomodoro-store,ui-store,debounced-storage}.ts
│  ├─ hooks/{use-now,use-hydrated,use-today-stats,use-media-query,use-prefers-reduced-motion}.ts
│  └─ types/index.ts
├─ tests/{countdown,workdays,recurrence,milestones,ics,format,pomodoro}.test.ts
└─ AGENTS.md
```

**约定**：`src/i18n/locales/zh.ts` 是字典唯一真源——新增文案先写中文，`en.ts` 声明为 `Dictionary` 类型，
漏键会在编译期报错。`src/lib/export/card-model.ts` 是导出卡片与 store/i18n 的**唯一接缝**
（模板只吃 `CardModel`，见 §8.8）。

---

## 10. 工程质量门

### 10.1 必须有的单测（vitest）

| 文件 | 覆盖 | 现状 |
| --- | --- | --- |
| `countdown.ts` | 三状态边界、剩余天数/小时、进度、最后 24h 判定 | ✅ |
| `recurrence.ts` | 8 种规则 × 边界（2/29、31 日小月、跨年） | ✅ |
| `workdays.ts` | 补班日计入、法定假期排除、跨年统计 | ✅ |
| `milestones.ts` | 阈值达成、不重复触发、重置 | ✅ |
| `ics.ts` | 折行、转义、UTC + `VALUE=DATE` | ✅ |
| `format.ts` | 单日区间不显示成区间、`formatDateRangeFull` 跨年省略、农历自然日边界、窄星期仅中文 | ✅ |
| `pomodoro.ts` | 长休息触发时机（第 4 个而非第 5 个）、手动跳过不计入、循环序号不跳到 5、秒数向上取整、配置夹取、跨天键 | ✅ |

合计 **80 条**，`npm run test` 全绿。新增纯函数必须同步补测——`format.ts` 这类
「输出被人眼当契约」的模块尤其容易静默回归（单日区间 bug 就是这么漏出去的）；
`pomodoro.ts` 则是「差一个数整个节奏就废了」的典型，长休息的触发时机必须有断言。

### 10.2 交付前自检

- [ ] `npm run typecheck` → 0 error
- [ ] `npm run lint` → 0 error（**注意：脚本尚未添加**，见 §14 附注）
- [ ] `npm run test` → 全绿（80 条）
- [ ] `CODEBUDDY_SAFE_DELETE_ENABLED=0 npm run build` → 0 error
      （构建会大量删 `.next`，被 safe-delete 包装拦下时报的是
      `SAFE_DELETE_BULK_CONFIRM_REQUIRED`，跟代码无关）
- [ ] 无头 Chrome 在**局域网 IP** 上跑一次真实点击（`/.preview/verify/e2e-round3.mjs`）
- [ ] `NEXT_PUBLIC_BASE_PATH=/Countdown npm run build` → 成功，`out/index.html` 存在
- [ ] 本地以子路径静态伺服 `out/`，三个路由与静态资源无 404
- [ ] 无头 Chrome 走一遍：首页 / 列表 / 大屏各无 console error；导出卡片 PNG 为 1080×1080
- [ ] Lighthouse（移动）Performance ≥ 85、Accessibility ≥ 95
- [ ] 手测 §13 风险条目 + §8 各「验收」

---

## 11. 关键技术实现注意

### 11.1 背景层看起来不对时的排查顺序

背景是 `<Backdrop>`（纯静态，无需 `'use client'`）：三层纯 CSS Aura（`.aura-layer-1/2/3`）+ SVG 颗粒（`.aura-grain`）+ 压暗面纱（`.aura-veil`）。**没有 WebGL**。

若背景看起来「发灰 / 发白 / 太暗 / 整个糊掉」：

1. **先确认底色在哪**。`#100e0b` 只应在 `<body>` / 页面根容器上（红线 1）。
2. 检查 `<Backdrop>` 的容器是否被误设了 `background-color`——它必须**完全透明**，否则会盖掉 body 底色。
3. 检查容器有没有显式 `min-height`（红线 2）。绝对定位子层不贡献高度，漏了就会「背景只出现在首屏上面一截」。
4. 检查是否有父元素设了 `isolation: isolate` / `transform` / `filter`——会创建新的层叠上下文，让 `mix-blend-mode` 的参照物改变。
5. **背景发灰/发白**：九成是容器被塞了 `background-color`，导致 `mix-blend-mode` 的合成基准变成容器本身（红线 1）。另外 `.aura-veil` 是压暗层——嫌暗只调它的 alpha，别动三层渐变。
6. 本地 WebGL 正常但导出卡片是透明板 → 那是导出链路的问题，不是背景的问题（见 §8.8 红线 11/12）。

### 11.2 避免 hydration mismatch

```ts
// hooks/use-hydrated.ts
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
```

- Zustand：`persist(..., { skipHydration: true })`，在客户端 `useEffect` 里 `useStore.persist.rehydrate()`
- 所有依赖 `Date.now()` 的渲染：`if (!hydrated) return <Skeleton />`
- `next.config.ts` 外的根 `<html>` 加 `suppressHydrationWarning`（应对浏览器插件注入属性）

### 11.3 秒级刷新只影响最小子树

`use-now.ts` 用单例 ticker（`useSyncExternalStore` + 对齐秒边界），订阅者用 selector 精确拿所需字段。**不要让秒级更新触发整个页面重渲染**——需要逐秒跳动的数字收进 `FlipClock` 内部自管状态，页面其余部分只订阅到分钟级。

### 11.4 卡片导出的字体陷阱

`html-to-image` 在导出时不会自动内嵌 web font。若发现导出图字体回退：导出前 `document.fonts.ready` 等待完成；字体走 `next/font` 自托管（同源 `/_next/static/media/*`）而非 CDN，避免 CORS 导致字体丢失。
另注意导出模板的 `FONT_DISPLAY` / `FONT_SANS` **必须以 `var(--font-grotesk)` 打头**，否则 `next/font` 生成的字体族名对不上。

### 11.5 PWA 与 basePath

`manifest.webmanifest` 里的 `start_url`、`scope`、`icons[].src` 以及 `sw.js` 的 `self.registration.scope` 都必须带 `/Countdown` 前缀。

**实际做法**：manifest 不用占位符替换，而是走 Next 的 metadata 路由 `app/manifest.ts`，在函数体内读 `process.env.NEXT_PUBLIC_BASE_PATH` 拼出全部路径，构建期直接产成静态文件。
`sw.js` 更省事——所有资源路径从 `self.registration.scope` 推导，天生适配任意子路径，不需要 `Service-Worker-Allowed` 响应头。

> 最终实现：manifest 走 `app/manifest.ts`（Next 官方 metadata 路由，构建期读 `NEXT_PUBLIC_BASE_PATH`）；`sw.js` 不从构建期注入，而是在运行时读 `self.registration.scope` 推导全部路径——SW 放在 `public/` 下时 scope 天然就是脚本所在目录，不需要 `Service-Worker-Allowed`。

### 11.6 Radix Portal 里测宽度：`useRef + useEffect([])` 一定读到 null

**这是本次踩到的真坑，症状是「预览区一片空白」。**

Radix 的 `Portal` 首次提交时渲染 `null`（portal 容器靠它自己的 `useLayoutEffect` 才被 setState 挂上），所以在 `DialogContent` 内部：

```tsx
const boxRef = useRef<HTMLDivElement>(null);
useEffect(() => {
  const box = boxRef.current;   // ← 一定是 null
  if (!box) return;
  setWidth(box.clientWidth);
}, []);                          // ← ref 挂上了也不会重跑
```

结果：宽度永远是 0，预览被 `scale(0)` + `visibility: hidden` 吃掉。

**正确写法：用回调 ref + state，让 effect 依赖该 state 重跑。**

```tsx
const [box, setBox] = useState<HTMLDivElement | null>(null);   // ref={setBox}
useEffect(() => {
  if (!box) return;
  const sync = () => setWidth(box.clientWidth);
  sync();
  const ro = new ResizeObserver(sync);
  ro.observe(box);
  return () => ro.disconnect();
}, [box]);
```

排查手法（可复用）：在 effect 里打一行 `console.log(box ? box.clientWidth : 'NULL')`，
再用 CDP 抓 `Runtime.consoleAPICalled`——比盯截图猜快得多。

### 11.7 导出卡片的坐标系

`html-to-image` 的 `pixelRatio` 是「节点 CSS 尺寸 × 倍率 = 输出像素」，所以节点不能直接按
1080px 渲染，否则 2× 出来是 2160。做法是 **节点 CSS 尺寸 = 预设 / 倍率**（桌面 2、移动 3），
再把设计基准 1080 通过 `u(n) = n * logicalWidth / 1080` 换算成像素，模板里只写设计单位。
这样任意倍率下构图一致，输出也精确落在 1080 / 1920 上。

预览缩放只作用在**祖先**节点上（`transform: scale()` + `overflow: hidden`），
卡片节点自身不带 transform——`html-to-image` 克隆时不看祖先变换，所以导出不受预览缩放影响。

---

## 12. 可访问性

- 装饰层 `aria-hidden` + `pointer-events: none`（已含在 §4.3）
- 倒计时容器 `role="timer"`；秒级区域 `aria-live="off"`，分钟级变化用固定 `aria-live="polite"` 区域播报，避免读屏器每秒打断
- 焦点环使用 `--color-accent`，`outline-offset: 2px`，不 `outline: none`
- 对话框/Sheet 必须焦点陷阱 + `Esc` 关闭 + 触发元素回焦
- 对比度（实测值，Diamond Storm，底色 `base #100e0b`，相对亮度 ≈ 0.0044）：

| 前景 | 对比度 | 结论 |
| --- | --- | --- |
| `ink #f4f4f5` | ≈ 17.5:1 | ✅ 正文/标题 |
| `ink-2 #a1a1aa` | ≈ 8.0:1 | ✅ 次要文字 |
| `ink-3 #7c7c86` | ≈ **4.7:1** | ✅ 刚过 AA 4.5:1。仍建议只用于非必要信息（时间戳、辅助说明、禁用态） |
| `accent #60a5fa` | ≈ 7.6:1 | ✅ 强调色可作正文/图标 |
| `accent-ink #061021` on `accent` | ≈ 7.9:1 | ✅ 强调底上的文字 |

> `ink-3` 是已知的临界项。要把某段文字从 `ink-2` 降到 `ink-3` 省视觉重量时，先确认它不含用户必须读到的信息。
- 图标按钮必须有 `aria-label`；不依赖颜色单独传达信息（补班日 = 颜色 + 图标）

---

## 13. 决议记录

> 本表原为「待拍板项」，现**全部关闭**，保留作为决策存档。

> 2026-09-21 已拍板：主倒计时用**方案 A**、**不做**「今日速览」统计块、**Hero 占满首屏**、PWA 走**手写方案**、2027 走**法定节假日口径且无角标**。
> 2026-09-22 追加：**Diamond Storm 主题**、**中英双语**、三页结构（删 `/settings`）、React Bits、Space Grotesk。

| # | 问题 | 结论 | 状态 |
| --- | --- | --- | --- |
| 1 | 部署形态 | 项目页，`basePath = /Countdown` | ✅ 已定（D3） |
| 2 | 展示字体 | **Space Grotesk**（`next/font/google`，只带 latin 子集，构建期自托管）；中文走系统栈 | ✅ 已定（D19） |
| 3 | PWA 方案 | 手写 `manifest` + 轻量 `sw.js` | ✅ 已定（D7） |
| 4 | 额外依赖 | 只留 `qrcode`（`ogl` 已随背景改纯 CSS 卸载）。**`lunar-javascript` 不引入**——农历改为数据里直接写 `lunar` / `lunarEn` 字段 | ✅ 已定（§2.1 / §8.12） |
| 5 | 翻牌时钟时机 | 首页只在最后 24h；大屏模式常驻 | ✅ 已定（M5） |
| 6 | 鼓励语 | **已从范围移除**，不做 320 条文案库 | ❌ 不做（§8.13） |
| 7 | 进度条基准 | 假期 `start`；事件 `createdAt`；假期进度条仅 `ongoing` 时展示 | ✅ 已定（D11） |
| 8 | 2027 数据展示 | 13 天法定节假日，**无角标** | ✅ 已定（D8） |
| 9 | `.ics` 日历下载 | 需要（纯前端生成，无依赖） | ✅ 已定（M4） |
| 10 | 时区 | 锁 UTC+8；非中国时区用户看到的仍是北京时间，页脚注明 | ✅ 已定（D4） |
| 11 | 视觉主题 | **Diamond Storm**（`#100e0b` + `#60a5fa`），取代 Cosmic Ash | ✅ 已定（D13） |
| 12 | 国际化 | 中英双语客户端字典，用户可切，不做 URL 路由 | ✅ 已定（D14/D15） |

**当前无阻塞项。** 上一版遗留的「中文字体是否随仓库提交」已随 D19 关闭——展示字体走
`next/font/google` 构建期自托管，中文用系统栈，仓库里不放字体文件。

---

## 14. 里程碑与验收

| 阶段 | 内容 | 验收 | 进度 |
| --- | --- | --- | --- |
| **M0** 骨架 | Next 16 + TS + Tailwind v4 + shadcn 初始化；背景层；`output: 'export'`；Actions 工作流 | 空首页推到 main 后，`https://tickhaijun.github.io/Countdown/` 可访问，无 404 | ✅ 完成（背景层已随 v2 重构为纯 CSS Aura） |
| **M1** 假期核心 | 节假日数据层 + 状态机 + Hero + 进度 + 里程碑 + 工作日统计 | 改系统时间走完三种状态；`countdown.ts` / `workdays.ts` 单测全绿 | ✅ 完成（26 条单测） |
| **M2** 事件系统 | CRUD + 重复规则引擎 + 发薪日模板 + 排序 / 标签 / 搜索 | `recurrence.ts` 8 种规则 + 边界单测全绿；搜索命中三类字段 | ✅ 完成。CRUD / 8 种重复 / 发薪日模板 / 排序 / 标签筛选 / 搜索 / 置顶 / 回收站 + 16 条单测 |
| **M3** 数据管理 | persist + 回收站 + 导入导出 + 清空确认 + 设置 Sheet | 刷新/重开数据不丢；导入非法 JSON 被拦截并报错；回收站可还原 | ✅ 完成。设置收进顶栏齿轮 Sheet（D21），`merge` 兜底新设置项 |
| **M4** 卡片导出 | 7 套模板 + PNG/JPEG + 剪贴板 + 系统分享 + 二维码 + 隐私导出 | 1080×1080 七套模板无破图；复制到剪贴板在 Chrome/Edge 成功 | ✅ 完成。7 套模板（ambient/minimal/grid/ticket/poster/glass/terminal）× 3 尺寸预设，无头 Chrome 实测 PNG 落盘 1080×1080 |
| **M5** 体验增强 | PWA（安装 + 离线 + 快捷方式）+ 大屏模式 + 快捷键 + 隐私模式 | Chrome 可安装；断网刷新可用；1920×1080 大屏排版完好 | ✅ 完成。`app/manifest.ts` 构建期注入 basePath；手写 `sw.js`；大屏底部提示胶囊（不遮内容）；快捷键 + 帮助弹窗；隐私模式顶栏眼睛 + `P` 切换 |
| **M6** 双语与视觉重构 | **v2 重构**：Diamond Storm 主题 + 中英双语 i18n + React Bits 组件层 + 三页结构 + 自研 FlipClock + 导出模板重制 | 切语言整站生效且刷新后保持；三页无 console error；`tsc` / `vitest` / `build` 全绿 | ✅ **已完成**（原「农历 + 鼓励语」内容目标已取消，见 §8.12 / §8.13） |
| **M7** 打磨 | 响应式全覆盖 + A11y + 性能 + Lighthouse + ESLint 配置 | §10.2 自检清单全勾；Lighthouse 移动端 Performance ≥ 85、Accessibility ≥ 95 | ⏳ 未开始 |

### 14.1 已落地文件清单（M0–M3）

```
next.config.ts / tsconfig.json / postcss.config.mjs / vitest.config.ts / components.json
.github/workflows/deploy.yml
public/.nojekyll
src/app/{layout,page,globals.css,manifest.ts}
src/app/{countdowns,fullscreen}/page.tsx
src/components/layout/{Backdrop,TopBar,SiteFooter}.tsx
src/components/countdown/{FlipClock,ProgressBar,MilestoneBadges}.tsx
src/components/holiday/{HolidayHero,OngoingSection,HolidayCard}.tsx
src/components/events/{EventCard,MyCountdownsSection,EventFormDialog}.tsx
src/components/countdowns/CountdownsBoard.tsx
src/components/settings/SettingsSheet.tsx
src/components/common/{StoreHydration,DeepLinkHandler}.tsx
src/components/ui/{button,dialog,input,sheet,switch}.tsx
src/hooks/{use-now,use-hydrated}.ts
src/lib/{utils,time,countdown,milestones,workdays,recurrence,recurrence-label,occurrence,tags}.ts
src/lib/holidays/{types,index}.ts + data/{2026,2027}.ts
src/store/{countdown-store,ui-store}.ts
src/i18n/{index.tsx,format.ts} + locales/{zh,en}.ts
tests/{countdown,workdays,milestones,recurrence,format}.test.ts
```

### 14.2 已落地文件清单（M4–M6）

```
public/sw.js                                  # 手写 SW，路径全部由 registration.scope 推导
public/icons/{icon-192,icon-512,icon-512-maskable,apple-touch-icon}.png
scripts/generate_icons.py                     # 图标生成器（纯标准库，可复现）
src/components/common/ServiceWorkerRegister.tsx
src/components/export/{ExportDialog,ShareCard}.tsx
src/components/export/templates/index.tsx     # 7 套模板，全部纯 CSS 背景
src/lib/export/{types,templates-registry,card-model,to-image,ics,download}.ts
src/components/keyboard/{ShortcutProvider,ShortcutHelpDialog}.tsx
src/components/reactbits/*                    # 31 个 React Bits 组件（shadcn CLI 安装，@ts-nocheck）
src/hooks/{use-media-query,use-prefers-reduced-motion}.ts
tests/ics.test.ts
```

**M4/M5 遗留的一条已知项**：Next 16 静态导出会为「segment prefetch」生成请求 URL
`/fullscreen/__next.fullscreen.__PAGE__.txt`，而产物实际落在
`out/fullscreen/__next.fullscreen/__PAGE__.txt`（目录形式）。悬停 `/fullscreen/`
的导航链接时会出现 404 预取请求。**已实测不影响功能**（客户端跳转与
浏览器后退均正常，失败请求只是少了一次预取优化）。GitHub Pages 与本机静态服务器
行为一致，非部署配置问题。无头 Chrome 复查时已按规则忽略这类请求。

---

## 附录 A：2026 年全年节假日数据（可选启用）

用于「今年已休多少天 / 今年还剩多少天」的精确统计（需求只要求 2026 提供中秋与国庆，此表为可选增强）。

| 节日 | 放假区间 | 天数 | 调休上班日 |
| --- | --- | --- | --- |
| 元旦 | 1/1（四）–1/3（六） | 3 | 1/4（日） |
| 春节 | 2/15（日）–2/23（一） | 9 | 2/14（六）、2/28（六） |
| 清明节 | 4/4（六）–4/6（一） | 3 | — |
| 劳动节 | 5/1（五）–5/5（二） | 5 | 5/9（六） |
| 端午节 | 6/19（五）–6/21（日） | 3 | — |
| 中秋节 | 9/25（五）–9/27（日） | 3 | — |
| 国庆节 | 10/1（四）–10/7（三） | 7 | 9/20（日）、10/10（六） |

全年放假调休合计 **33 天**。
来源：国务院办公厅《关于2026年部分节假日安排的通知》（国办发明电〔2025〕7号），2025-11-04 发布。

## 附录 B：本文档的变更记录

| 日期 | 变更 |
| --- | --- |
| 2026-09-21 | 初版。依据需求整理，核实 2026 官方放假安排、2027 法定节日日期、`@hasthiya_/flip-clock` 包名与 props、Next 16 与 next-pwa 的 Turbopack 冲突 |
| 2026-09-21 | 修订：拍板 §13 全表（方案 A / 无统计块 / Hero 占满首屏 / PWA 手写）；新增 §4.8 留白预算、§4.9 卡片装饰边界；2027 改法定节假日 13 天口径、去角标 |
| 2026-09-21 | M4–M5 落地。新增 §11.6（Radix Portal 里测宽度的坑）、§11.7（导出卡片坐标系）、§14.2 文件清单与静态导出 prefetch 已知项。**未加 `npm run lint`**：Next 16 已移除 `next lint`，现阶段质量门为 typecheck + vitest + build，ESLint 平铺配置列入 M7 |
| 2026-09-22 | **Diamond Storm 主题 + 首页落地页**。主题从 Diamond Storm 换成 Diamond Storm（底 `#100e0b`、强调蓝 `#60a5fa`）；背景从 React Bits `<Aurora>`（WebGL/ogl）改为三层纯 CSS Aura + 颗粒 + `.aura-veil` 压暗，`ogl` 与 `Aurora.tsx` 删除；首页改为落地页（Hero 只留一个最近日期 + 功能区 + 收尾 CTA），`MyCountdownsSection` 删除；页脚精简并新增微信联系弹窗（`components/layout/ContactDialog.tsx`）；`next.config.ts` 新增 `allowedDevOrigins` 修复局域网访问不 hydrate |
| 2026-09-21 | **v2 视觉与架构重构**（本次）。全文对齐实现：D13–D22 新增 10 项决策；红线扩到 13 条；§2 技术栈换成 React Bits/gsap/ogl + 自研 `FlipClock` + 手写日期格式化，移除 date-fns / framer-motion / `@hasthiya_/flip-clock`；§4 重写为 Diamond Storm；§6 Settings 与 Store Schema 按实际 `partialize` 对齐；§8.12 / §8.13 明确降级与移除；§9 目录树按真实文件重写；§10.1 补 `ics` / `format` 测试（62 条）；§11.1 改为 Aurora 背景排查清单；§13 补 11/12 两项并关闭全部遗留项；§14 新增 M6 重构里程碑。质量门实测：`tsc --noEmit` 0 error、`vitest run` 62/62 通过、`next build` 产出 3 个静态路由，无头 Chrome 走查三页 + 导出 PNG 无 console/网络错误 |
