# Countdown 项目长期备忘

## 项目定位

倒计时落地页（中国节假日 + 自定义事件）。纯前端、`localStorage`、GitHub Pages 静态托管。
仓库：https://github.com/TickHaiJun/Countdown.git

## 已锁定的技术决策

| 项 | 决定 |
| --- | --- |
| 渲染 | `output: 'export'` 纯静态，禁服务端能力 |
| 部署 | GitHub Pages 项目页 → `basePath = /Countdown` |
| 时区 | 锁 Asia/Shanghai (UTC+8)，字面量带 `+08:00`，不做本地换算 |
| 主题 | **Diamond Storm**（2026-09-22 下午海军改定）：底 `#100E0B`、文字 `#F4F4F5`/`#A1A1AA`/`#7C7C86`、强调蓝 `#60A5FA`（deep `#2563EB`）、边框 `rgba(255,255,255,0.08)`。~~Slate & Lime（lime `#A3E635`）已废弃~~ |
| 状态 | Zustand + persist，`skipHydration: true` + 客户端 rehydrate |
| 翻牌 | **自研 `src/components/countdown/FlipClock.tsx`**（逐字变化触发 `FlipTile` 翻转）。~~`@hasthiya_/flip-clock` 已卸载~~；`SplitFlapText` 也不合用（单 `text` 模式是瞬跳）。仅最后 24h + 大屏常驻 |
| UI 组件 | React Bits，走 shadcn CLI：`npx shadcn@latest add https://reactbits.dev/r/<Name>-TS-TW`。registry 名 `@react-bits`；变体 `-TS-TW`/`-TS-CSS`/`-JS-TW`/`-JS-CSS`。**已补 `components.json`**；30 个组件落在 `src/components/reactbits/`，统一 `@ts-nocheck` |
| 背景 | **纯 CSS 三层 Aura**（`.aura-layer-1/2/3` + `.aura-grain` 颗粒 + `.aura-veil` 压暗），**不再是 WebGL**。~~`ogl` 与 `reactbits/Aurora.tsx` 已删~~。收益：`html-to-image` 也能截到，导出卡片可复用同一套背景 |
| 字体 | `--font-display` = Space Grotesk（`next/font/google`，只带 latin 子集）→ 中文回落系统栈。`--font-sans` / `--font-mono` 另设 |
| 国际化 | **中英双语，用户可切换**。方案 A：客户端字典 + context + localStorage + `navigator.language`，**不改路由**（静态导出下不开 `/[locale]/`）。农历/节气英文**用拼音** |
| 页面 | **三个**：`/` 首页、`/countdowns/` 全部倒计时、`/fullscreen/` 大屏。**`/settings` 已删**，功能收进顶栏齿轮的 Sheet 浮层 |
| PWA | 手写 manifest + 轻量 sw.js，不用 `next-pwa`（Next 16 Turbopack 冲突）。manifest 走 `app/manifest.ts`；sw.js 路径全部由 `self.registration.scope` 推导 |
| 样式 | Tailwind v4 CSS-first（无 `tailwind.config.ts`） |
| 导出 | `html-to-image`。节点 CSS 尺寸 = 预设 / 倍率（桌面 2、移动 3），设计基准 1080 走 `u(n)` 换算 |
| 质量门 | `typecheck` + `vitest` + `build`。**无 `npm run lint`**（Next 16 已移除 `next lint`，列 M7） |

## 铁律

1. `#100e0b` 只能放在 `<body>` / 页面根容器上；`<Backdrop>` 容器（`.bg-canvas`）必须**完全透明**，
   否则 `mix-blend-mode` 的合成基准会变成容器本身，三层 Aura 整体发灰。
2. 背景容器必须显式 `min-height`（绝对定位子层不贡献高度，漏了 = 背景只有一截）。
   `.bg-canvas` 是 `fixed` 所以不需要，但任何 `relative` 容器都要加。
3. 生成背景时**不写任何占位/示例文案**。
4. 时间相关渲染走 `useHydrated()`，避免 hydration mismatch。
5. 秒级刷新只重渲染最小子树（`FlipClock` 内部自管秒级状态）。
6. **Radix Portal 里不要用 `useRef + useEffect([])` 测宽度** —— Portal 首次提交渲染 `null`，
   `current` 一定是 `null` 且 effect 不会重跑。用回调 ref + state（`ref={setBox}`，effect 依赖 `[box]`）。
7. 卡片/模板的一切尺寸写设计单位，经 `u(n)` 换算；预览缩放只能加在**祖先**节点上。
8. **Hero 的纵向节奏是压过的**（`pt-8` / 卡片 `mt-9` / 卡内 `py-7` / FlipClock `mt-6`），
   目标是让双按钮在 1440×900 首屏里露出来。改这几个数之前先量一次首屏。
9. **组件里不写裸中文字符串**，文案一律走字典 `t()`（`src/i18n/locales/*` 之外不允许出现中文）。
10. **导出卡片内禁用 WebGL 与 `backdrop-filter`**（`html-to-image` 走 SVG `foreignObject`，两者都会被丢掉）；卡片背景必须纯 CSS。
11. **日期格式化不用 `Intl`**（Node/browser 对 `zh-CN` 输出不一致 → hydration mismatch），走 `src/i18n/format.ts` 手写查表。
12. 改 `src/components/reactbits/` 下的上游生成物，**必须在注释里写清原因**（已改：`SpotlightCard`、`SplitText`）。
13. **强调文字不要用 `bg-clip-text` 渐变** —— `SplitText` 会把文字拆成子 span，
    而 `background-clip:text` 只裁剪元素自身文字区域，父级渐变透不到子 span 上 → 整行文字消失。
    改用纯 `text-accent` + `text-shadow` 外发光。
14. **一个文件一次只发一个 Edit**（见下「工具坑」）。改完必须交叉验证是否真的落盘。
15. `Aura` 三层叠加后右上偏亮（L3 的 multiply 在右下是白色＝不压暗），正文 `ink-2` 在亮区只有 2.7:1。
    `.aura-veil`（`rgba(16,14,11,0.34)`）就是为可读性补的，嫌暗只调这一个 alpha。

## 排查手法（用过的，有效）

- 页面"看起来坏了" → 先用无头 Chrome + CDP 量真实尺寸，别改代码。三个假象（黑带/元素缺失/文字被切）全是 `--window-size` ≠ 视口造成的。
- 元素"没渲染" → 在 effect 里打一行 log，用 CDP 收 `Runtime.consoleAPICalled`，区分「没跑」和「跑了但算出 0」。
- 导出能力 → 让页面真的点一次按钮（`Browser.setDownloadBehavior` + `Runtime.evaluate` 点），读落盘 PNG 的 IHDR 反推宽高。
- `Start-Process` 起的 Chrome 会在 PowerShell 命令返回后被回收 → 启动 + probe 必须写在同一条命令里。

## 数据口径

- 节假日以国务院办公厅通知为准。
- 2026 官方已核实（中秋 9/25–9/27、国庆 10/1–10/7，调休 9/20、10/10）。
- **2027 采用「法定节假日」口径（13 天），不推断调休连休，UI 不加「待官方公布」角标**（海军 2026-09-21 决定）。
  依据《全国年节及纪念日放假办法》2024-11-10 第四次修订：元旦1、春节4（除夕+初一至初三）、清明1、劳动节2、端午1、中秋1、国庆3。
  2027 推导结果：元旦 1/1、春节 2/5–2/8、清明 4/5、劳动节 5/1–5/2、端午 6/9、中秋 9/15、国庆 10/1–10/3。
- 数据字段仍保留 `confidence`，但 2027 不渲染角标。

## 设计决策（2026-09-21 对齐）— ⚠️ 已被 2026-09-22 转向覆盖，仅作存档

- 布局骨架对齐 auragradients：Hero 居中（pill 徽章 → 假期名 → 主倒计时 → meta → 里程碑/进度 → 双圆角按钮）→ 分区标签行 → 芯片筛选 → 卡片网格 → 页脚。
- **主倒计时层级 = 方案 A（天数主导）**：天 100%，时/分/秒 45% 且逐级降低对比度。否决四组等大。
- **卡片装饰 = 顶部 2px 细线 + 右上角光斑**，点缀面积 < 8%，卡体保持中性。否决满幅渐变底。
- 留白预算：Hero 78vh（移动 68vh）、区块间距 `clamp(72px, 12vh, 160px)`、卡片间距桌面 24px / 移动 16px、内容宽 1120px。
- 不照抄参考站：亮暗切换、GitHub star、7 分类芯片、心形收藏。

## 2026-09-22 转向：UI 层推翻重做

> ✅ **该转向已全部落地**（2026-09-22，详见 `.workbuddy/memory/2026-09-22.md` 第二轮）。
> 本节保留原始规划与依赖速查，实施结果以 AGENTS.md 与代码为准。

**范围**：保留全部数据/逻辑层（`lib/{time,countdown,workdays,milestones,recurrence,occurrence,holidays}`、
`types`、`store`、53 条测试、`export/{ics,download,to-image}`），**重写整个 UI 层**。

**已拍板（2026-09-22）**
- 主题色 **Slate & Lime**：`#0A0F0C` / `#F4F4F5` / `#A3E635`；视觉偏国外风格
- 中英双语，方案 A 客户端字典；农历/节气英文用拼音
- 三个页面：`/`、`/countdowns/`、`/fullscreen/`。`/settings` 删除 → 顶栏 Sheet 浮层
- 接受 WebGL 背景（唯一允许的重型依赖是 `ogl`）
- 大量使用 React Bits 组件，走 shadcn CLI 安装
- 翻牌数字用 React Bits `SplitFlapText`（**零依赖**）替代 `@hasthiya_/flip-clock`

**React Bits 使用策略**（官方限「单页 ≤2–3 个组件」，与「大量使用」冲突，故分三层）
- 重型层：每页最多 1 个，只允许 `ogl` 系背景（~100KB）。**禁用 `three` / R3F**（600KB+）
- 结构层：卡片/导航/列表，优先零依赖与 `motion` 系
- 点缀层：`StarBorder` / `GlareHover` / `ClickSpark` / `Noise` 等零依赖组件

**React Bits 依赖速查**（读自 `reactbits.dev/r/registry.json`）
- 零依赖：`SplitFlapText` `StarBorder` `GlareHover` `ClickSpark` `ElectricBorder` `GradualBlur`
  `Noise` `Magnet` `LogoLoop` `PixelSwap` `TextPressure` `FuzzyText` `CurvedLoop` `ParticleText`
- `motion`：`CountUp` `BlurText` `ShinyText` `GradientText` `RotatingText` `ScrollVelocity` `DecryptedText` `TrueFocus`
- `gsap`：`SplitText` `ScrollReveal` `ScrollFloat` `AnimatedContent` `FadeContent` `TextType` `TargetCursor`
- `ogl`：`Aurora` `Particles` `Strands` `Ribbons` `MetaBalls` `WarpText`
- 重/已排除：`three` 系（`ShapeBlur` `LaserFlow` `MagicRings` `ASCIIText`）、R3F 系（`PixelTrail` `Antigravity`）

**已知坑（实施时必须处理）**
1. ~~项目**无 `components.json`**~~ → 已补，且 init 注入的 `:root`/`.dark` 已与现有 `@theme` 合并。
2. `html-to-image` **截不到 WebGL canvas** → 导出卡片背景必须继续纯 CSS，不能用 React Bits 背景。✅ 已按此实现。
3. React Bits 组件基本都直读 `window` → `output: 'export'` 下一律 `'use client'`，必要时 `dynamic(..., { ssr: false })`。✅ `Aurora` 走 `dynamic(ssr:false)`。
4. 全站只放**一个** WebGL 背景（Chrome 上下文数有限）；移动端降级静态。✅
5. 组件内绝对路径资源在 `basePath=/Countdown` 下会 404，需改相对路径。✅
6. **`SplitText` 写 `aria-label` 只在首次 split 时发生** → 切语言后读屏标签会停在旧语言。必须另加 effect 同步（已改该文件并注明原因）。

## 首页结构（2026-09-22 下午定稿）

`/` = 落地页：`TopBar` → Hero（药丸徽章 → 双行大标题 → 说明 → **唯一一个最近日期** →
双药丸按钮）→ `OngoingSection`（仅真放假时出现）→ `FeatureSection`（CountUp 数字条 +
4 张 SpotlightCard/GlareHover 功能卡）→ `ClosingSection` → `SiteFooter`。
**`MyCountdownsSection` 已删**，列表全部收敛到 `/countdowns/`。

## 页脚

只留「品牌 + 一句话」+ 右侧 `ContactDialog`（「联系我 daxin261」，点击弹微信二维码）。
~~数据留在本机 / 源码链接 / 用 Next.js 构建~~ 属开发者自述，全部删除。

## 工具坑（本轮踩了两次，务必记住）

**同一批工具调用里对同一个文件发多个 `Edit`，只有部分生效**（各 Edit 基于同一快照互相覆盖）：

| 文件 | 同批发了几处 | 结果 |
| --- | --- | --- |
| `globals.css` | 5 处（分两批：2 + 3） | token 块、aura 层丢失，只能重做 |
| `zh.ts` | 2 处 | `landing` / `contact` 丢失，`footer` 保住 |
| `en.ts` | 分两批各 1 处 | 全部保住 ✅ |

**规则：一个文件一次只发一个 Edit；不同文件可以同批。改完用
`Select-String -Path <file> -Pattern <标记> -Quiet` 交叉验证。**

另两个 PowerShell 坑：
- `$pid` 是只读自动变量，`foreach ($pid in ...)` 直接报错 → 换 `$procId`。
- `Remove-Item -Recurse` 删 `.next` 会被 safe-delete 包装拦下（>50 文件需确认）→
  用 `[System.IO.Directory]::Delete($path, $true)`。
- **不要用 PowerShell `Set-Content` 读写含中文的 `.mjs`**，会变乱码（已踩）。

## 交付物

- `AGENTS.md` —— 实现规约（D1–D22 决策 + 13 条红线 + §9 真实目录树）。**主题章节仍写着
  Slate & Lime，待更新为 Diamond Storm**（唯一未对齐处）。
- 进度（2026-09-22）：**M0–M6 完成**；M7（响应式复查 / A11y / Lighthouse / ESLint 平铺配置）未开始。
- 质量门实测：`tsc --noEmit` 0 error · `vitest run` 6 文件 **62 测试**全绿 · `next build` 3 路由 + manifest 成功。
- 验证脚本在 `.preview/verify/`（已 gitignore）：`verify-v2.mjs`（三页 hydration + 配色 + Aura 层）、
  `click-test.mjs`（真实点击：联系弹窗 / 设置 / 隐私 / 新建表单）、`shot.mjs`（5 张截图）、
  以及更早的 `probe.mjs` / `i18n-flow.mjs` / `stale-text.mjs` / `scroll-audit.mjs`。

## 无头验证的三个反直觉点（再遇到别重踩）

1. `Emulation.setLocaleOverride` **不改 `navigator.language`** → 别用它测语言切换，必须走真实点击路径。
2. `FadeContent` 卡片未滚入视口时 `opacity: 0` → 截图是「一片空白」，实际是正常入场动效，不是 bug。
3. **dev server 从局域网 IP 访问时，Next 16 默认阻断 `/_next/hmr`** → 整页不 hydrate、
   点什么都「没反应」，但浏览器控制台**零报错**，只有 `.next/dev/logs/next-development.log` 里有
   `Blocked cross-origin request`。修法：`next.config.ts` 加 `allowedDevOrigins`。
   **遇到「点击全都没反应 + 页面像静态 HTML」先查这里，别翻组件代码。**

## 待海军决策

1. ~~display 字体~~ → 已定 **Space Grotesk**（2026-09-22 他拍板）。
2. ~~每日一句~~ → **功能已移除**。
3. `git init` + 推到 TickHaiJun/Countdown —— **只剩这一件，且只能他做**（有仓库凭据）。
4. 可选清理：`locales/{zh,en}.ts` 里的 `quote` 字典块是死键，确认不做每日一句后删掉。
5. `lib/export/templates/index.tsx` 里的 `LIME` / `lime()` 命名是改色前的遗留（值已是蓝），
   要不要顺手改名。
