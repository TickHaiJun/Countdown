/**
 * 生成 UUID v4。
 *
 * 为什么不直接用 `crypto.randomUUID()`：它只在**安全上下文**下存在，也就是
 * HTTPS 或 localhost / 127.0.0.1。用局域网 IP 打开开发服务器时
 * （http://192.168.0.39:3000），它整个是 `undefined`，调用会直接抛
 * `TypeError: crypto.randomUUID is not a function`——表现出来就是
 * "点新建倒计时，什么都没发生"。
 *
 * 降级顺序：
 * 1. `crypto.randomUUID()` —— 有就用，最省事
 * 2. `crypto.getRandomValues()` —— **非安全上下文同样可用**，手写 v4
 * 3. `Math.random()` —— 兜底。只保证唯一，不保证密码学强度
 *
 * 这个 id 只是本地事件的主键，不参与任何安全决策，所以第 3 档可以接受。
 */

const HEX: string[] = Array.from({ length: 256 }, (_, index) =>
  (index + 0x100).toString(16).slice(1),
);

/** 把 16 字节按 RFC 4122 v4 拼成字符串，并就地写入版本位与变体位 */
function bytesToUuid(bytes: Uint8Array): string {
  // 版本位（第 7 字节高 4 位）= 0100
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40;
  // 变体位（第 9 字节高 2 位）= 10
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;

  const hex: string[] = [];
  for (let index = 0; index < 16; index += 1) {
    hex.push(HEX[bytes[index] ?? 0] ?? '00');
  }

  return [
    hex.slice(0, 4).join(''),
    hex.slice(4, 6).join(''),
    hex.slice(6, 8).join(''),
    hex.slice(8, 10).join(''),
    hex.slice(10, 16).join(''),
  ].join('-');
}

export function createId(): string {
  const cryptoObj = typeof globalThis.crypto === 'undefined' ? undefined : globalThis.crypto;

  if (cryptoObj) {
    // 安全上下文下的快路径
    if (typeof cryptoObj.randomUUID === 'function') {
      return cryptoObj.randomUUID();
    }

    // 非安全上下文：getRandomValues 依然可用，自己拼一个 v4
    if (typeof cryptoObj.getRandomValues === 'function') {
      const bytes = new Uint8Array(16);
      cryptoObj.getRandomValues(bytes);
      return bytesToUuid(bytes);
    }
  }

  const bytes = new Uint8Array(16);
  for (let index = 0; index < 16; index += 1) {
    bytes[index] = Math.floor(Math.random() * 256);
  }
  return bytesToUuid(bytes);
}
