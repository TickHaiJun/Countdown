'use client';

import { useEffect, useState } from 'react';

/**
 * 系统级「减弱动效」偏好。
 *
 * 用于关掉 WebGL 背景这类持续渲染的东西——它不是为了省电，是因为前庭敏感人群
 * 真的会被缓慢漂移的大面积色块弄难受。用户设置里的开关与它取或值。
 */
export function usePrefersReducedMotion(): boolean {
  const [prefers, setPrefers] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setPrefers(query.matches);

    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);

  return prefers;
}
