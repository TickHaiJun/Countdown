#!/usr/bin/env node
/**
 * GitHub Pages 专用构建：等价于 CI 里那条 `npm run build`，只是额外注入 basePath。
 *
 * 为什么需要单独一条：`next.config.ts` 的 basePath 读 `NEXT_PUBLIC_BASE_PATH`，
 * 而 `npm run build` 自己不带这个变量。本地直接跑会构建出 basePath='' 的产物 ——
 * 铺到项目页 `/Countdown/` 下就是整站资源 404：页面零样式、React 不 hydrate、
 * 点按钮全无反应，**但浏览器控制台不报错**（资源 404 不走 CDP 的 Runtime 域），
 * 极难排查。这里把前缀钉死，让「本地构建」和「CI 构建」是同一个东西。
 */
import { spawnSync } from 'node:child_process';

const BASE_PATH = '/Countdown';
const bin = process.platform === 'win32' ? 'npm.cmd' : 'npm';

/* Node 在 Windows 上不允许直接 spawn `.cmd`，需要 shell。参数是常量，无注入面。 */
const result = spawnSync(bin, ['run', 'build'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, NEXT_PUBLIC_BASE_PATH: BASE_PATH },
});

if (result.error) {
  console.error(`构建启动失败：${result.error.message}`);
  process.exit(1);
}
if (result.status !== 0) process.exit(result.status ?? 1);

console.log(`\n✅ 已按 basePath=${BASE_PATH} 构建，out/ 可直接发布到 GitHub Pages 项目页。`);
