/**
 * 法定节日的专属色相。
 *
 * 数据里的 id 形如 `2026-zhongqiu` / `2027-zhongqiujie`——两个年份的命名并不统一
 * （2026 用短 slug，2027 用全名），所以这里按「去掉年份后的 slug」建表，
 * 两种写法都列进去，别指望调用方去猜。
 *
 * 用途只是给卡片上一个彩色标签，让一屏假期能靠颜色扫读，所以取的是
 * 传统节日的印象色（春节的红、中秋的金、清明的青绿），不强求与全站强调色同调。
 * 明度统一压在中高档，保证在 #100e0b 上都读得出来。
 */

const HOLIDAY_ACCENTS: Record<string, string> = {
  /** 元旦 —— 用靛蓝而不用强调色的蓝，避免和全站唯一强调色打架 */
  yuandan: '#818cf8',
  chunjie: '#f472b6',
  qingming: '#34d399',
  liaodongjie: '#fbbf24',
  duanwujie: '#2dd4bf',
  zhongqiu: '#fcd34d',
  zhongqiujie: '#fcd34d',
  guoqing: '#f87171',
  guoqingjie: '#f87171',
};

/** 兜底色：遇到没登记过的节日就用强调色，不返回 undefined */
const FALLBACK = '#60a5fa';

/**
 * 按假期 id 取专属色。
 * 认不出来时回落到强调色——新增假期数据忘记登记时只是少一层区分，不会报错。
 */
export function holidayAccent(id: string): string {
  const slug = id.replace(/^\d{4}-/, '');
  return HOLIDAY_ACCENTS[slug] ?? FALLBACK;
}
