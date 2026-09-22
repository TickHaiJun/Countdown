import type { NextConfig } from 'next';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

const nextConfig: NextConfig = {
  output: 'export',
  basePath,
  assetPrefix: basePath || undefined,
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,

  /*
   * Next 16 默认只允许 localhost 访问 dev 资源（/_next/hmr 等）。
   * 从局域网 IP（192.168.x.x）打开时会被判为跨源并**静默阻断**，
   * 表现为整页 React 不 hydrate、点任何按钮都没反应——但浏览器控制台不报错，
   * 只有 dev server 自己的日志里有 "Blocked cross-origin request"。
   * 这里显式放行局域网网段，避免再次踩坑。
   */
  allowedDevOrigins: [
    'localhost',
    '127.0.0.1',
    '192.168.0.39',
    '192.168.*.*',
    '10.*.*.*',
    '172.16.*.*',
  ],
};

export default nextConfig;
