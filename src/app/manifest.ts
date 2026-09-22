import type { MetadataRoute } from 'next';

/**
 * PWA manifest。
 *
 * 走 Next 的 metadata 路由（`app/manifest.ts`）而不是 `public/manifest.webmanifest`，
 * 这样 `basePath` 可以在构建期注入，GitHub Pages 项目页下 `start_url` / `scope` /
 * `icons[].src` 全都自动带 `/Countdown` 前缀，不用手工替换占位符（§11.5）。
 */
export const dynamic = 'force-static';

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '倒计时 · 距下一个假期还有几天',
    short_name: '倒计时',
    description:
      '中国法定节假日与自定义事件倒计时：假期余额、工作日统计、发薪日与纪念日，数据只保存在本机浏览器。',
    lang: 'zh-CN',
    dir: 'ltr',
    start_url: `${BASE_PATH}/?src=pwa`,
    scope: `${BASE_PATH}/`,
    display: 'standalone',
    display_override: ['standalone', 'minimal-ui'],
    orientation: 'any',
    background_color: '#100e0b',
    theme_color: '#100e0b',
    categories: ['utilities', 'lifestyle'],
    icons: [
      {
        src: `${BASE_PATH}/icons/icon-192.png`,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: `${BASE_PATH}/icons/icon-512.png`,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: `${BASE_PATH}/icons/icon-512-maskable.png`,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: '最近倒计时',
        short_name: '最近',
        description: '直接看最近一个假期还剩几天',
        url: `${BASE_PATH}/?focus=next&src=shortcut`,
        icons: [{ src: `${BASE_PATH}/icons/icon-192.png`, sizes: '192x192' }],
      },
    ],
  };
}
