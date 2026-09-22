/**
 * 结束提示音。
 *
 * 不用音频文件：一是省一次网络请求，二是静态导出下每个资源路径都要跟着
 * basePath 走，为一声「叮」不值得。这里用 WebAudio 现场合成一个三音和弦。
 *
 * 浏览器的 autoplay 策略要求 AudioContext 在用户手势里创建或恢复，
 * 所以「开始」按钮会先调一次 `unlockChime()`；等真正到点时再合成，
 * 就不会被挂起成静音。
 */

type AudioContextCtor = typeof AudioContext;

let context: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  const Ctor: AudioContextCtor | undefined =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: AudioContextCtor }).webkitAudioContext;
  if (!Ctor) return null;

  if (!context) {
    try {
      context = new Ctor();
    } catch {
      return null;
    }
  }
  return context;
}

/** 在用户手势里调一次，把 AudioContext 从 suspended 唤醒 */
export function unlockChime(): void {
  const ctx = getContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') void ctx.resume();
}

/**
 * A5–C#6–E6 的琶音。
 * 峰值音量压到 0.14：办公室场景下足够听见，又不会突然吓人一跳。
 */
export function playChime(): void {
  const ctx = getContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') void ctx.resume();

  const start = ctx.currentTime + 0.02;
  const notes = [880, 1108.73, 1318.51];

  for (const [index, frequency] of notes.entries()) {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    const at = start + index * 0.13;

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, at);

    // 用 exponential 包络：起音 30ms，尾部 700ms，听起来像一声轻铃而不是"哔"
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(0.14, at + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.7);

    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(at);
    oscillator.stop(at + 0.75);
  }
}
