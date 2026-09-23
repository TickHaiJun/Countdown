# Countdown 项目长期备忘

## 项目定位

倒计时落地页（中国节假日 + 自定义事件）。纯前端、`localStorage`、GitHub Pages 静态托管。
仓库：https://github.com/TickHaiJun/Countdown.git

## 已锁定的技术决策

| 项 | 决定 |
| --- | --- |
| 渲染 | `output: 'export'` 纯静态，禁服务端能力 |
| 部署 | GitHub Pages 项目页 → `basePath = /Countdown`（构建期由 `NEXT_PUBLIC_BASE_PATH` 注入）。**`out/` 不入库**，由 `.github/workflows/deploy.yml` 在 CI 里构建后 `deploy-pages@v4` 发布。**前提：Settings → Pages → Source 必须选「GitHub Actions」**，否则 `configure-pages` 那步直接失败（症状：run 11 秒挂、后续步骤全 skipped） |
| 时区 | 锁 Asia/Shanghai (UTC+8)，字面量带 `+08:00`，不做本地换算 |
| 主题 | **四套可选，`<html data-theme>` 切换**（2026-09-23 上线）：`grain`（默认，黑底 + shader）、`golden`（**唯一浅色**，奶油 `#faf8f2` / 暖琥珀 `#92400e`）、`blueprint`（`#100e0b` / 天蓝 `#38bdf8`）、`aurora`（`#100e0b` / 薄荷 `#34d399`）。**实现只靠两处**：`globals.css` 末尾的 `:root[data-theme='x']` token 块 + `Backdrop` 里对应的背景层 `display:block`。~~Diamond Storm / Slate & Lime 都已废弃~~ |
| 外观配置 | 除主题外还有字号（`--fs-scale` 0.94/1/1.08，紧凑/标准/宽松）与字色档位（`data-heading` 默认/强调色/高对比、`data-body-tone` 默认/更强/更淡），全在顶栏齿轮 Sheet 的「文字」区 |
| 状态 | Zustand + persist，`skipHydration: true` + 客户端 rehydrate |
| 翻牌 | **自研 `src/components/countdown/FlipClock.tsx`**（逐字变化触发 `FlipTile` 翻转）。~~`@hasthiya_/flip-clock` 已卸载~~；`SplitFlapText` 也不合用（单 `text` 模式是瞬跳）。仅最后 24h + 大屏常驻 |
| UI 组件 | React Bits，走 shadcn CLI：`npx shadcn@latest add https://reactbits.dev/r/<Name>-TS-TW`。registry 名 `@react-bits`；变体 `-TS-TW`/`-TS-CSS`/`-JS-TW`/`-JS-CSS`。**已补 `components.json`**；30 个组件落在 `src/components/reactbits/`，统一 `@ts-nocheck` |
| 背景 | 四组纯 CSS 层（`.aura-base` / `.aura-fallback-*` / `.aura-g*` / `.bp-l*` / `.abo-l*` / `.aura-veil` / `.aura-grain`），按 `data-theme` 显隐。**默认主题 `grain` 额外挂一个 WebGL `GrainGradient`**（`@paper-design/shaders-react@0.0.81`，**唯一允许的 canvas**，`dynamic(ssr:false)`；其余三套主题纯 CSS + 兜底近似层）。~~`ogl` / `reactbits/Aurora.tsx` 已删，不回滚~~ |
| 字体 | `--font-display` = Space Grotesk（`next/font/google`，只带 latin 子集）→ 中文回落系统栈。`--font-sans` / `--font-mono` 另设 |
| 国际化 | **中英双语，用户可切换**。方案 A：客户端字典 + context + localStorage + `navigator.language`，**不改路由**（静态导出下不开 `/[locale]/`）。农历/节气英文**用拼音** |
| 页面 | **四个**：`/` 首页、`/countdowns/` 全部倒计时、`/fullscreen/` 大屏、`/pomodoro/` 番茄钟。**`/settings` 已删**，功能收进顶栏齿轮的 Sheet 浮层 |
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
16. **禁止直接调只在安全上下文存在的 API** —— `crypto.randomUUID` / `navigator.clipboard` /
    `navigator.serviceWorker` 在 `http://<局域网 IP>` 下全是 `undefined`，直接调会抛
    `TypeError: ... is not a function`。一律走 `lib/uuid.ts` 的 `createId()`、`lib/clipboard.ts` 的
    `copyText()`，或先用 `isSecureContext` 判断。
    （注意：`crypto.getRandomValues` 在非安全上下文**依然可用**，这是兜底方案的立足点。）
17. **`GlareHover` 的根节点是 `grid place-items-center`（居中，不是撑满）** —— 中文文案换行数比英文多一行时，
    内容顶部偏移就不同 → 中英切换下卡片错位。修法：内联 `style={{ placeItems: 'stretch' }}` 覆盖，
    **不改上游文件**。配合描述 `flex-1` + `FadeContent` 加 `h-full`。
18. **服务端链路（`layout.tsx` → `lib/appearance.ts`）不许从带 `'use client'` 的模块读非组件导出。**
    Next 会把这种跨边界导入换成**客户端引用代理**，取值恒 `undefined` 且**不报错**。
    跨链路共享的常量放中性模块（`src/lib/storage-keys.ts`）。`appearance.ts` 有构建期断言兜底。
    > 踩过：`JSON.stringify(undefined)` 返回的不是字符串而是 `undefined`，模板字面量把字面量
    > `undefined` 烙进产物 → 脚本退化成 `localStorage.getItem(undefined)` → 首屏防闪**静默失效**
    > （浅色主题刷新先闪一帧深色）。**单测抓不到**，因为测试环境没有这条模块边界。
19. **写断言别用 `expect(str).toContain(v)` 配可能为 `undefined` 的 `v`** —— 入参会被转成字符串
    `"undefined"`，断言照样通过。这就是上面那个 bug 溜过单测的原因（自证式断言）。要钉就钉字面量。
20. **本地构建一律走 `npm run build:pages`**（= `NEXT_PUBLIC_BASE_PATH=/Countdown` + `next build`，等价 CI）。
    裸跑 `npm run build` 产出 `basePath=''`，铺到项目页下**整站资源 404**：页面零样式、React 不 hydrate、
    点按钮全无反应，**而浏览器控制台不报错**。
21. **改 `applyAppearance` 必须同步改 `APPEARANCE_BOOTSTRAP`**（两份实现不能漂移）；产物里那份是
    `<body>` 早期内联脚本，负责首屏防闪。`tests/appearance.test.ts` 穷举 4×3×3×3 在守。

## 排查手法（用过的，有效）

- 页面"看起来坏了" → 先用无头 Chrome + CDP 量真实尺寸，别改代码。三个假象（黑带/元素缺失/文字被切）全是 `--window-size` ≠ 视口造成的。
- 元素"没渲染" → 在 effect 里打一行 log，用 CDP 收 `Runtime.consoleAPICalled`，区分「没跑」和「跑了但算出 0」。
- 导出能力 → 让页面真的点一次按钮（`Browser.setDownloadBehavior` + `Runtime.evaluate` 点），读落盘 PNG 的 IHDR 反推宽高。
- `Start-Process` 起的 Chrome 会在 PowerShell 命令返回后被回收 → 启动 + probe 必须写在同一条命令里。
- **部署没上线 / workflow 失败** → 公开仓库不用登录就能查，按顺序四条命令：
  ```bash
  curl -s -o /dev/null -w "%{http_code}" https://<user>.github.io/<repo>/   # 站点是否活着
  curl -s https://api.github.com/repos/<u>/<r>/pages                        # 404 = Pages 根本没启用
  curl -s "https://api.github.com/repos/<u>/<r>/actions/runs?per_page=1"    # run 状态/结论
  curl -s "https://api.github.com/repos/<u>/<r>/actions/runs/<id>/jobs"     # 逐步骤成败
  ```
  **判据：只要 `configure-pages` 失败、后面步骤全 `skipped`，就别翻代码，直接去查 Pages 启用状态。**
- 本地想复现 CI 构建 → `CODEBUDDY_SAFE_DELETE_ENABLED=0 NEXT_PUBLIC_BASE_PATH=/Countdown npm run build`，
  然后 `grep -o '(href\|src)="/_next/[^"]*"' out/index.html`，**命中 0 条**才说明 basePath 没漏。

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

- `AGENTS.md` —— 实现规约，**已全文对齐实现**（D1–D25 决策 + 20 条红线 + §9 真实目录树，含 `/pomodoro/`）。
- 构建入口：`npm run build`（裸，`basePath=''`，别用来验 Pages）/ **`npm run build:pages`**（钉死 `/Countdown`，等价 CI）。
- 进度（2026-09-23）：**M0–M6 完成**；M7（响应式复查 / A11y / Lighthouse / ESLint 平铺配置）未开始。
- 质量门实测（2026-09-23）：`tsc --noEmit` 0 error · `vitest run` **8 文件 96 测试**全绿 ·
  `npm run build:pages` **7 条静态路由**成功（`/`、`/countdowns`、`/fullscreen`、`/pomodoro`、
  `/manifest.webmanifest`、`/_not-found` + 404）。
- 端到端：`e2e-round4.mjs` **62 / 62 通过**；`audit-landed.mjs` **164 / 164 通过**。
- 验证脚本在 `.preview/verify/`（已 gitignore）：`e2e-round4.mjs`（四主题 / 字号 / 字色 / 防闪 / 大屏 Esc /
  网络层 404，自带静态服务与 Chrome，自动读 basePath 前缀）、`audit-landed.mjs`（落盘状态 164 项断言）、
  `e2e-round3.mjs`（LAN-IP 全链路，含 non-secure context 断言）、`measure-features.mjs`、
  `verify-settle.mjs`、`shots-round3.mjs`，以及更早的 `probe.mjs` / `i18n-flow.mjs` / `stale-text.mjs`。

## 无头验证的反直觉点（再遇到别重踩）

1. `Emulation.setLocaleOverride` **不改 `navigator.language`** → 别用它测语言切换。要钉死语言用
   `--lang=zh-CN` **加** CDP `Emulation.setUserAgentOverride({ acceptLanguage })`（后者才真的动
   `navigator.language`）。`detectLocale()` 读的就是它，而无头 Chrome 默认 en-US。
2. `FadeContent` 卡片未滚入视口时 `opacity: 0` → 截图是「一片空白」，实际是正常入场动效，不是 bug。
3. **dev server 从局域网 IP 访问时，Next 16 默认阻断 `/_next/hmr`** → 整页不 hydrate、
   点什么都「没反应」，但浏览器控制台**零报错**，只有 `.next/dev/logs/next-development.log` 里有
   `Blocked cross-origin request`。修法：`next.config.ts` 加 `allowedDevOrigins`。
   **遇到「点击全都没反应 + 页面像静态 HTML」先查这里，别翻组件代码。**
4. **资源 404 不走 CDP 的 `Runtime` 域** → 光听 console 会得出「控制台干净」的假结论（basePath 漏配
   那次整站 404 就是这么被放过的）。必须 `Network.enable` + 收 `Network.loadingFailed` 与
   `responseReceived(status >= 400)`。**过滤规则也千万别写 `/404 \(/`**，那恰好吃掉最关键的信号。
   同类症状：**四组背景层「全部同时可见」** = CSS 根本没加载。
5. **`setInterval(0)` 在无头页面会被节流到秒级** → 想在文档解析期埋探针却等到 `load` 才挂上，
   把解析期的变化整个错过、假报「没写入」。改成 `MutationObserver` 观察 `document`
   （`subtree` 天然覆盖 `documentElement`，不必等 `<html>` 出现、也不用定时器）。
6. **验证「无闪烁」要看历史值序列，不能看终态** —— 「刷新后仍是 golden」什么也证明不了
   （hydration 迟早改对）。用 `Page.addScriptToEvaluateOnNewDocument` 抢先埋观察器记录
   `<html data-theme>` 的取值轨迹，首个非空值必须就是目标主题、且 `readyState === 'loading'`。
7. **生产构建会改写字面量**，断言前必须规范化：`#ffffff`→`#fff`、`rgba(28,20,8,0.045)`→8 位 hex
   `#1c14080b`（**alpha 只 256 级，0.045→0.043 有精度损失，别比字符串、判语义**）、
   `0.35`→`.35`、`opacity(0.45)`→`opacity(.45)`。不规范化会把「压缩器改写」误判成「功能坏了」。
8. **`fs.rm` 在 Windows 会走安全删除垫片并超时**（脚本启动阶段就炸）。清 localStorage 用
   CDP `Storage.clearDataForOrigin`，别碰文件系统。
9. **hydration 是异步的**：固定 `sleep` 必然偶发失败，症状是「点了但没反应」且失败点漂移、
   看着像随机 bug。要用轮询 `waitFor(条件)` 等到 `data-theme` 落地再往下走。
10. `e2e-round4.mjs` **自己起静态服务 + 自己拉 Chrome**、全程一个进程（`Start-Process` 起的
    Chrome 会在 PowerShell 命令返回后被回收），并**自动从 `out/index.html` 读 basePath 前缀**，
    不会再出现「脚本硬编码 /Countdown、产物却是 `basePath=''`」的静默 404 组合。

## 待海军决策

1. ~~display 字体~~ → 已定 **Space Grotesk**（2026-09-22 他拍板）。
2. ~~每日一句~~ → **功能已移除**。
3. ~~`git init` + 推到 TickHaiJun/Countdown~~ → **已推送**（2026-09-22，commit `0d7adc4`）。
   **新的唯一阻塞项：去 Settings → Pages → Source 选「GitHub Actions」**，否则部署工作流必挂
   （`out/` **不需要提交**，已在 `.gitignore` 里，这是正确做法）。
4. 可选清理：`locales/{zh,en}.ts` 里的 `quote` 字典块是死键，确认不做每日一句后删掉。
5. `lib/export/templates/index.tsx` 里的 `LIME` / `lime()` 命名是改色前的遗留（值已是蓝），
   要不要顺手改名。
6. 部署方式取舍：现在是纯 CI 构建（推荐）。若哪天改成 `gh-pages` 分支发布，再考虑是否要提交产物。
