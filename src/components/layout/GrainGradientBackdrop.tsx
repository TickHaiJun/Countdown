'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useCountdownStore } from '@/store/countdown-store';
import { useUiStore } from '@/store/ui-store';

/*
 * 默认主题的 WebGL 背景。
 *
 * 三个必须做成这样的理由：
 *
 * 1. **`ssr: false`**。shader 要拿到 WebGL 上下文，静态导出下服务端根本没有；
 *    而且它内部直读 window。走 dynamic 才能保证只在客户端挂载。
 *
 * 2. **等 rehydrate 完成再挂**。主题存在 localStorage 里，首屏的 store 是默认值。
 *    若不等，一个选了 Golden Hour 的用户会先看到一次 shader 挂载再被卸载。
 *    所以 gate 在 ui-store 的 `storeHydrated` 上。
 *
 * 3. **永远留着 CSS 近似层在当前元素下面**（见 Backdrop 里的 `aura-fallback-*`）。
 *    shader 挂载失败 / 上下文创建失败 / 未 hydrate，都会自然落到那两层上，
 *    不需要额外的错误处理。
 */

const GrainGradient = dynamic(
  () => import('@paper-design/shaders-react').then((mod) => mod.GrainGradient),
  { ssr: false },
);

/* 就是海军给的那组取值，不要随手改——默认主题的观感以此为准 */
const COLORS = ['#7300ff', '#eba8ff', '#00bfff', '#2b00ff'];

/** 系统级「减少动效」，与设置里的开关是两条独立输入，任一命中就冻结 */
function useSystemReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return reduced;
}

export function GrainGradientBackdrop() {
  const theme = useCountdownStore((state) => state.settings.theme);
  const reduceMotion = useCountdownStore((state) => state.settings.reduceMotion);
  const storeHydrated = useUiStore((state) => state.storeHydrated);
  const systemReducedMotion = useSystemReducedMotion();

  /*
   * 再压一层"已挂载"：`dynamic(ssr:false)` 在首次客户端渲染时就是 null，
   * 但这里显式一句能保证 store 还没 hydrate 时绝不会提前挂载。
   */
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  /* 主题已确定为"非默认"时直接不挂：别白占一个 WebGL 上下文 */
  if (!mounted || !storeHydrated || theme !== 'grain') return null;

  const frozen = reduceMotion || systemReducedMotion;

  return (
    <div className="grain-gradient-host">
      <GrainGradient
        colorBack="#000000"
        colors={COLORS}
        softness={0.5}
        intensity={0.5}
        noise={0.25}
        shape="corners"
        /* 减弱动效时冻结成静态帧，而不是降到很慢——慢速漂移仍然会分心 */
        speed={frozen ? 0 : 1}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}
