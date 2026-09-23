import type { Metadata, Viewport } from 'next';
import { Space_Grotesk } from 'next/font/google';
import './globals.css';
import { ServiceWorkerRegister } from '@/components/common/ServiceWorkerRegister';
import { StoreHydration } from '@/components/common/StoreHydration';
import { ShortcutProvider } from '@/components/keyboard/ShortcutProvider';
import { Backdrop } from '@/components/layout/Backdrop';
import { I18nProvider } from '@/i18n';
import { APPEARANCE_BOOTSTRAP } from '@/lib/appearance';

/*
 * 只自托管拉丁子集，中文走系统字体栈（PingFang SC / Microsoft YaHei）。
 * 中文子集动辄 1–3MB，为了几个标题字重去背这个体积不划算。
 */
const grotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-grotesk',
  display: 'swap',
});

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

/*
 * 静态导出下 metadata 在构建期就固化成 HTML，无法按客户端语言切换。
 * 所以这里固定用中文——它是默认语言，也是 og 卡片会抓到的内容。
 */
export const metadata: Metadata = {
  title: '倒计时 · 距下一个假期还有几天',
  description:
    '中国法定节假日与自定义事件倒计时：假期余额、工作日统计、发薪日与纪念日，数据只保存在本机浏览器。',
  applicationName: 'Countdown',
  appleWebApp: {
    capable: true,
    title: '倒计时',
    statusBarStyle: 'black-translucent',
  },
  icons: {
    icon: [
      { url: `${BASE_PATH}/icons/icon-192.png`, sizes: '192x192', type: 'image/png' },
      { url: `${BASE_PATH}/icons/icon-512.png`, sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: `${BASE_PATH}/icons/apple-touch-icon.png`, sizes: '180x180' }],
  },
  formatDetection: { telephone: false, email: false, address: false },
  openGraph: {
    type: 'website',
    title: '倒计时 · 距下一个假期还有几天',
    description:
      '中国法定节假日与自定义事件倒计时：假期余额、工作日统计、发薪日与纪念日，数据只保存在本机浏览器。',
    locale: 'zh_CN',
  },
};

export const viewport: Viewport = {
  /*
   * 静态导出下 metadata 构建期固化，写死一个中性值即可。
   * 真正的主题色由 lib/appearance.ts 在客户端改写（含首屏内联脚本那一步）。
   *
   * 这里刻意不设 `colorScheme`：它会固化一个 `<meta name="color-scheme">`，
   * 而 color-scheme 需要跟着主题在两档之间切换——那由 CSS 的
   * `:root[data-theme='golden'] { color-scheme: light }` 负责。
   */
  themeColor: '#000000',
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className={grotesk.variable} suppressHydrationWarning>
      <body>
        {/*
          首屏防闪烁：必须在 React 之前、在内容绘制之前，把 <html data-theme>
          与 --fs-scale 按 localStorage 设好。放在 body 的第一个子节点上——
          解析到这里时后面的内容还没画出来，所以不会闪。
          suppressHydrationWarning 已加在 <html> 上，覆盖这几个属性差异。
        */}
        <script dangerouslySetInnerHTML={{ __html: APPEARANCE_BOOTSTRAP }} />
        <I18nProvider>
          <StoreHydration />
          <ShortcutProvider />
          <Backdrop />
          <div className="app-content relative">{children}</div>
        </I18nProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
