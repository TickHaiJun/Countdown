import { GrainGradientBackdrop } from './GrainGradientBackdrop';

/*
 * 全站背景：四套主题共用一套骨架，靠 <html data-theme> 决定谁可见。
 *
 * 为什么把四套的层**全部**挂在 DOM 里，而不是按主题条件渲染：
 *  1. 服务端渲染时不知道主题（它存在 localStorage），条件渲染必然产生
 *     hydration 不一致；display:none 的层不参与渲染、blur 也不会被计算，
 *     所以"全放"的成本接近于零。
 *  2. 切换主题时零重新挂载，只有一次 CSS 重算。
 *
 * 为什么不再用 React Bits <Aurora>（`ogl`）：
 *  `html-to-image` 走 SVG foreignObject，**截不到 WebGL canvas**。
 *  默认主题改用 `@paper-design/shaders-react` 是产品决定，代价由
 *  「导出卡片固定 Diamond Storm、不跟随主题」承担掉（见 AGENTS.md D23）。
 *
 * 铁律：`.bg-canvas` 必须完全透明，底色只能由 `.aura-base`（铺 --color-base）
 * 与 <body> 提供，否则 mix-blend-mode 的合成基准会变成容器本身，整体发灰。
 */
export function Backdrop() {
  return (
    <div className="bg-canvas" aria-hidden="true">
      {/* 合成基准：四套主题的 blend mode 都靠它才有正确的底 */}
      <div className="aura-base" />

      {/* ---------- 默认主题：Grain Gradient（WebGL + CSS 近似兜底） ---------- */}
      <div data-tx="grain" className="aura-fallback-1" />
      <div data-tx="grain" className="aura-fallback-2" />
      <GrainGradientBackdrop />

      {/* ---------- 主题 1：Golden Hour ---------- */}
      <div data-tx="golden" className="aura-g1" />
      <div data-tx="golden" className="aura-g2" />

      {/* ---------- 主题 2：Blueprint ---------- */}
      <div data-tx="blueprint" className="bp-l1" />
      <div data-tx="blueprint" className="bp-l2" />
      <div data-tx="blueprint" className="bp-l3" />

      {/* ---------- 主题 3：Aurora Borealis ---------- */}
      <div data-tx="aurora" className="abo-l1" />
      <div data-tx="aurora" className="abo-l2" />
      <div data-tx="aurora" className="abo-l3" />
      <div data-tx="aurora" className="abo-l4" />
      <div data-tx="aurora" className="abo-l5" />
      <div data-tx="aurora" className="abo-l6" />

      {/* 面纱：理由见 globals.css 的 .aura-veil 注释（浅色主题下是透明的） */}
      <div className="aura-veil" />

      {/* 颗粒：四套主题共用，强度由 --grain-opacity 定 */}
      <div className="aura-grain">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <filter id="cd-grain">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.7"
              numOctaves="4"
              stitchTiles="stitch"
            />
            <feColorMatrix
              type="matrix"
              values="0.181 0.608 0.061 0 0.075
                      0.181 0.608 0.061 0 0.075
                      0.181 0.608 0.061 0 0.075
                      0     0     0     1 0"
            />
          </filter>
          <rect width="100%" height="100%" filter="url(#cd-grain)" />
        </svg>
      </div>
    </div>
  );
}
