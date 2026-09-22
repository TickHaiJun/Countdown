import type { Metadata, Viewport } from 'next';
import { Space_Grotesk } from 'next/font/google';
import './globals.css';
import { ServiceWorkerRegister } from '@/components/common/ServiceWorkerRegister';
import { StoreHydration } from '@/components/common/StoreHydration';
import { ShortcutProvider } from '@/components/keyboard/ShortcutProvider';
import { Backdrop } from '@/components/layout/Backdrop';
import { I18nProvider } from '@/i18n';

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
  themeColor: '#100e0b',
  colorScheme: 'dark',
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className={grotesk.variable} suppressHydrationWarning>
      <body>
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
