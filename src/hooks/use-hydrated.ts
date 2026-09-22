'use client';

import { useEffect, useState } from 'react';

/** 挂载完成前一律返回 false，用于隔离依赖当前时间/本地数据的渲染 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
