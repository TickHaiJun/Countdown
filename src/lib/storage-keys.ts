/**
 * localStorage 键名常量。
 *
 * ⚠️ 为什么单独放一个文件，而不是留在 `@/store/countdown-store`：
 * 那个模块带 `'use client'`。服务端组件（`app/layout.tsx`）间接引到它，
 * 并从里面读一个**非组件导出**（字符串常量）时，Next 会把这次导入换成
 * 客户端引用代理 —— 取到的值是 `undefined`，而且**不报任何错**。
 *
 * 后果相当隐蔽：`APPEARANCE_BOOTSTRAP` 里 `JSON.stringify(undefined)` 返回的
 * 不是字符串而是 `undefined`，模板字面量于是把字面量 `undefined` 烙进产物，
 * 脚本变成 `localStorage.getItem(undefined)` —— 取不到存档、首行就 return，
 * 整套「首屏防闪烁」静默失效。现象是浅色主题刷新时先闪一帧深色。
 *
 * 所以：任何需要在服务端链路里读到的常量，都必须来自不带 `'use client'`
 * 的中性模块（本文件）。`appearance.ts` 里另有构建期断言兜底。
 */
export const STORAGE_KEY = 'countdown:v1';
