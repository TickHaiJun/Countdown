/*
 * 全站背景：Diamond Storm —— 纯 CSS 三层 mix-blend-mode + SVG 颗粒。
 *
 * 为什么不再用 React Bits <Aurora>（WebGL）：
 *  1. 纯 CSS 版本零运行时开销，`ogl`（约 100KB）可以直接卸载，首屏更轻；
 *  2. `html-to-image` 走 SVG foreignObject，**截不到 WebGL canvas**——
 *     改用 CSS 后，导出卡片能和网站复用同一套背景，不必再另画一套；
 *  3. 全站不再占 GPU 上下文，React Bits 的其它动效不会被抢资源。
 *
 * 铁律：本容器必须完全透明。mix-blend-mode 合成的是 <body> 的 #100e0b，
 * 容器一旦有 background-color，三层就会被合成到错误基准上——整体发灰。
 *
 * 不需要 'use client'：它是纯静态标记，没有事件、没有状态、没有浏览器 API。
 */
export function Backdrop() {
  return (
    <div className="bg-canvas" aria-hidden="true">
      <div className="aura-layer-1" />
      <div className="aura-layer-2" />
      <div className="aura-layer-3" />
      {/* 压暗层：理由见 globals.css 的 .aura-veil 注释 */}
      <div className="aura-veil" />
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
