'use client';

import type { CSSProperties, ReactNode } from 'react';
import {
  FONT_DISPLAY,
  FONT_MONO,
  FONT_SANS,
  pad2,
  type CardModel,
  type TemplateId,
  type TemplateProps,
} from '@/lib/export/types';

/* ------------------------------------------------------------------ *
 * 设计令牌
 *
 * 模板里不出现任何语言判断、不引用 store、不发请求——只吃 CardModel。
 * 所有文案（kicker / headline / title / targetLabel / watermark / dayUnit）
 * 都由 card-model 按当前语言定稿后传进来。
 * ------------------------------------------------------------------ */

/*
 * `LIME` / `lime()` 是主题改版前的遗留命名，值已经换成 Diamond Storm 的蓝。
 * 刻意不改名：改名要动 30+ 个引用点，而这次只是换色——把风险收在一个常量里。
 */
const BASE = '#100e0b';
const ELEV = '#191922';
const INK = '#f4f4f5';
const LIME = '#60a5fa';

/** 白色文字按透明度取阶，避免到处写 rgba */
const ink = (alpha: number) => `rgba(244,244,245,${alpha})`;
/** 主强调色按透明度取阶 */
const lime = (alpha: number) => `rgba(96,165,250,${alpha})`;

/* ------------------------------------------------------------------ *
 * 模板共用零件
 * ------------------------------------------------------------------ */

function digitsLine(model: CardModel): string {
  const { hours, minutes, seconds } = model.digits;
  return `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`;
}

function days(model: CardModel): number {
  return Math.max(0, Math.floor(model.digits.days));
}

function Progress({
  value,
  color,
  height,
  track,
  radius = 999,
}: {
  value: number;
  color: string;
  height: number;
  track: string;
  radius?: number;
}) {
  return (
    <div
      style={{
        width: '100%',
        height,
        borderRadius: radius,
        background: track,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: `${Math.round(Math.min(1, Math.max(0, value)) * 100)}%`,
          height: '100%',
          borderRadius: radius,
          background: color,
        }}
      />
    </div>
  );
}

function SegmentedProgress({
  value,
  color,
  dim,
  u,
  segments = 28,
  block,
}: {
  value: number;
  color: string;
  dim: string;
  u: (n: number) => number;
  segments?: number;
  block: number;
}) {
  const filled = Math.round(Math.min(1, Math.max(0, value)) * segments);
  return (
    <div style={{ display: 'flex', gap: u(block * 0.6), width: '100%' }}>
      {Array.from({ length: segments }, (_, index) => (
        <div
          key={index}
          style={{
            flex: 1,
            height: u(block),
            background: index < filled ? color : dim,
          }}
        />
      ))}
    </div>
  );
}

function QrBlock({
  src,
  size,
  padding,
  radius,
}: {
  src: string;
  size: number;
  padding: number;
  radius: number;
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        background: 'rgba(255,255,255,0.94)',
        padding,
        borderRadius: radius,
        boxSizing: 'border-box',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        width={size - padding * 2}
        height={size - padding * 2}
        style={{ display: 'block', width: '100%', height: '100%' }}
      />
    </div>
  );
}

/** 卡片外壳：统一尺寸与溢出裁切；背景一律纯 CSS，不用 WebGL */
function Shell({
  width,
  height,
  background,
  children,
  style,
}: {
  width: number;
  height: number;
  background: string;
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        width,
        height,
        position: 'relative',
        overflow: 'hidden',
        background,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** 绝对定位铺满的装饰层 */
function Layer({ style }: { style: CSSProperties }) {
  return <div style={{ position: 'absolute', inset: 0, ...style }} />;
}

/** 天数 + 天/时/分 的主数字区 */
function DayDisplay({
  model,
  u,
  daySize,
  unitSize,
  subSize,
  color,
  unitColor,
  subColor,
  align = 'center',
  dayWeight = 500,
  dayFont = FONT_DISPLAY,
  gapScale = 0.6,
}: {
  model: CardModel;
  u: (n: number) => number;
  daySize: number;
  unitSize: number;
  subSize: number;
  color: string;
  unitColor: string;
  subColor: string;
  align?: 'center' | 'flex-start';
  dayWeight?: number;
  dayFont?: string;
  gapScale?: number;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: align,
        gap: u(subSize * gapScale),
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: u(unitSize * 0.3) }}>
        <span
          style={{
            fontFamily: dayFont,
            fontSize: u(daySize),
            lineHeight: 0.86,
            fontWeight: dayWeight,
            color,
            letterSpacing: '-0.02em',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {days(model)}
        </span>
        <span
          style={{
            fontFamily: FONT_SANS,
            fontSize: u(unitSize),
            lineHeight: 1,
            color: unitColor,
            paddingBottom: u(unitSize * 0.22),
          }}
        >
          {model.dayUnit}
        </span>
      </div>
      <span
        style={{
          fontFamily: FONT_MONO,
          fontSize: u(subSize),
          color: subColor,
          letterSpacing: '0.1em',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {digitsLine(model)}
      </span>
    </div>
  );
}

/** 顶部小标签：kicker + 可选状态点 */
function Kicker({
  model,
  u,
  color,
  size = 26,
  dot,
  uppercase = false,
  prefix,
}: {
  model: CardModel;
  u: (n: number) => number;
  color: string;
  size?: number;
  dot?: string;
  uppercase?: boolean;
  prefix?: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: u(size * 0.45) }}>
      {dot ? (
        <span
          style={{
            width: u(size * 0.32),
            height: u(size * 0.32),
            borderRadius: 999,
            background: dot,
            display: 'block',
          }}
        />
      ) : null}
      <span
        style={{
          fontFamily: FONT_MONO,
          fontSize: u(size),
          letterSpacing: '0.22em',
          color,
          textTransform: uppercase ? 'uppercase' : 'none',
        }}
      >
        {prefix}
        {model.kicker}
      </span>
    </div>
  );
}

/** 站点字标，与 TopBar 的 COUNTDOWN 同源 */
function BrandMark({ u, color, size = 20, letterSpacing = '0.24em' }: {
  u: (n: number) => number;
  color: string;
  size?: number;
  letterSpacing?: string;
}) {
  return (
    <span
      style={{
        fontFamily: FONT_MONO,
        fontSize: u(size),
        letterSpacing,
        color,
      }}
    >
      COUNTDOWN
    </span>
  );
}

/** 页脚一行：水印 + 可选二维码 */
function FooterRow({
  model,
  u,
  design,
  color,
  qrSize,
  qrRadius,
  gap = 24,
}: {
  model: CardModel;
  u: (n: number) => number;
  design: { width: number; height: number };
  color: string;
  qrSize: number;
  qrRadius: number;
  gap?: number;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        width: '100%',
        gap: u(gap),
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: u(12), minWidth: 0 }}>
        {model.visible.target ? (
          <span style={{ fontFamily: FONT_SANS, fontSize: u(23), color: ink(0.66) }}>
            {model.targetLabel}
          </span>
        ) : null}
        <span
          style={{
            fontFamily: FONT_MONO,
            fontSize: u(17),
            letterSpacing: '0.16em',
            color,
          }}
        >
          {model.watermark}
        </span>
      </div>
      {model.visible.qr && model.qrDataUrl ? (
        <QrBlock
          src={model.qrDataUrl}
          size={qrSize}
          padding={u(Math.min(design.width, design.height) * 0.012)}
          radius={qrRadius}
        />
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 1. ambient —— 站点主视觉的静态复刻
 * ------------------------------------------------------------------ */

function AmbientTemplate({ model, u, width, height, design, landscape }: TemplateProps) {
  const base = Math.min(design.width, design.height);
  const daySize = base * (landscape ? 0.36 : 0.3);
  const pad = u(base * 0.075);

  return (
    <Shell
      width={width}
      height={height}
      background={`linear-gradient(155deg, ${BASE} 0%, #12281c 46%, #0d1a14 78%, ${BASE} 100%)`}
    >
      <Layer
        style={{
          background: `radial-gradient(circle at 52% 34%, ${lime(0.34)} 0%, ${lime(0)} 58%)`,
        }}
      />
      <Layer
        style={{
          background: `radial-gradient(circle at 12% 88%, rgba(52,211,153,0.18) 0%, rgba(52,211,153,0) 55%)`,
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          padding: pad,
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: landscape ? 'flex-start' : 'center',
          textAlign: landscape ? 'left' : 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          {model.visible.tag ? (
            <Kicker model={model} u={u} color={ink(0.78)} dot={model.palette.primary} />
          ) : (
            <span />
          )}
          <BrandMark u={u} color={ink(0.42)} />
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: landscape ? 'flex-start' : 'center',
            gap: u(28),
          }}
        >
          {model.visible.days ? (
            <>
              <span
                style={{
                  fontFamily: FONT_SANS,
                  fontSize: u(30),
                  color: ink(0.6),
                  letterSpacing: '0.06em',
                }}
              >
                {model.headline}
              </span>
              <DayDisplay
                model={model}
                u={u}
                daySize={daySize}
                unitSize={daySize * 0.34}
                subSize={daySize * 0.09}
                color={INK}
                unitColor={ink(0.7)}
                subColor={ink(0.48)}
                align={landscape ? 'flex-start' : 'center'}
              />
            </>
          ) : null}

          {model.visible.title ? (
            <span
              style={{
                fontFamily: FONT_SANS,
                fontSize: u(base * 0.062),
                fontWeight: 500,
                color: INK,
                letterSpacing: '0.04em',
              }}
            >
              {model.title}
            </span>
          ) : null}

          {model.visible.progress ? (
            <div style={{ width: u(design.width * 0.56), marginTop: u(6) }}>
              <Progress value={model.progress} color={LIME} track={ink(0.14)} height={u(8)} />
            </div>
          ) : null}
        </div>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: u(20) }}>
          <div style={{ width: u(96), height: 1, background: lime(0.5) }} />
          <FooterRow
            model={model}
            u={u}
            design={design}
            color={ink(0.38)}
            qrSize={u(base * 0.17)}
            qrRadius={u(16)}
          />
        </div>
      </div>
    </Shell>
  );
}

/* ------------------------------------------------------------------ *
 * 2. minimal —— 只剩数字
 * ------------------------------------------------------------------ */

function MinimalTemplate({ model, u, width, height, design, landscape }: TemplateProps) {
  const base = Math.min(design.width, design.height);
  const daySize = base * (landscape ? 0.42 : 0.34);
  const pad = u(base * 0.09);

  return (
    <Shell width={width} height={height} background={BASE}>
      <Layer
        style={{
          background: `radial-gradient(circle at 18% 88%, ${lime(0.12)} 0%, ${lime(0)} 62%)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          padding: pad,
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        {model.visible.tag ? (
          <Kicker model={model} u={u} color={ink(0.45)} size={22} uppercase />
        ) : (
          <span />
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: u(base * 0.045), minHeight: 0 }}>
          {model.visible.days ? (
            <DayDisplay
              model={model}
              u={u}
              daySize={daySize}
              unitSize={daySize * 0.3}
              subSize={daySize * 0.075}
              color={INK}
              unitColor={ink(0.55)}
              subColor={ink(0.32)}
              align="flex-start"
              dayWeight={400}
            />
          ) : null}

          {model.visible.title ? (
            <span
              style={{
                fontFamily: FONT_SANS,
                fontSize: u(base * 0.05),
                color: ink(0.9),
              }}
            >
              {model.title}
            </span>
          ) : null}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: u(18) }}>
          <div style={{ width: '100%', height: 1, background: ink(0.1) }} />
          {model.visible.progress ? (
            <Progress value={model.progress} color={lime(0.75)} track={ink(0.08)} height={u(4)} />
          ) : null}
          <FooterRow
            model={model}
            u={u}
            design={design}
            color={ink(0.3)}
            qrSize={u(base * 0.14)}
            qrRadius={u(12)}
          />
        </div>
      </div>
    </Shell>
  );
}

/* ------------------------------------------------------------------ *
 * 3. grid —— 仪表盘
 * ------------------------------------------------------------------ */

function GridTemplate({ model, u, width, height, design, landscape }: TemplateProps) {
  const base = Math.min(design.width, design.height);
  const daySize = base * (landscape ? 0.38 : 0.32);
  const pad = u(base * 0.07);
  const cell = u(base * 0.05);

  const ruler = Array.from({ length: 33 }, (_, index) => index);

  return (
    <Shell width={width} height={height} background={BASE}>
      {/* 细网格 */}
      <Layer
        style={{
          backgroundImage:
            `repeating-linear-gradient(90deg, ${ink(0.05)} 0px, ${ink(0.05)} 1px, transparent 1px, transparent ${cell}px),` +
            `repeating-linear-gradient(0deg, ${ink(0.05)} 0px, ${ink(0.05)} 1px, transparent 1px, transparent ${cell}px)`,
        }}
      />
      <Layer
        style={{
          background: `radial-gradient(circle at 50% 46%, ${lime(0.16)} 0%, ${lime(0)} 62%)`,
        }}
      />

      {/* HUD 角标 */}
      {(
        [
          { top: pad * 0.5, left: pad * 0.5, borderWidth: `${u(2)}px 0 0 ${u(2)}px` },
          { top: pad * 0.5, right: pad * 0.5, borderWidth: `${u(2)}px ${u(2)}px 0 0` },
          { bottom: pad * 0.5, left: pad * 0.5, borderWidth: `0 0 ${u(2)}px ${u(2)}px` },
          { bottom: pad * 0.5, right: pad * 0.5, borderWidth: `0 ${u(2)}px ${u(2)}px 0` },
        ] as CSSProperties[]
      ).map((style, index) => (
        <div
          key={index}
          style={{
            position: 'absolute',
            width: u(base * 0.075),
            height: u(base * 0.075),
            borderStyle: 'solid',
            borderColor: lime(0.6),
            ...style,
          }}
        />
      ))}

      <div
        style={{
          position: 'absolute',
          inset: 0,
          padding: pad,
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: u(20) }}>
          {model.visible.tag ? (
            <Kicker model={model} u={u} color={lime(0.85)} size={22} dot={LIME} uppercase />
          ) : (
            <span />
          )}
          <BrandMark u={u} color={ink(0.35)} size={18} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: u(24) }}>
          {model.visible.days ? (
            <>
              <span
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: u(22),
                  letterSpacing: '0.2em',
                  color: ink(0.5),
                  textTransform: 'uppercase',
                }}
              >
                {model.headline}
              </span>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: u(16) }}>
                <span
                  style={{
                    fontFamily: FONT_DISPLAY,
                    fontSize: u(daySize),
                    lineHeight: 0.86,
                    fontWeight: 600,
                    color: INK,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {days(model)}
                </span>
                <span
                  style={{
                    fontFamily: FONT_MONO,
                    fontSize: u(daySize * 0.22),
                    color: lime(0.8),
                    paddingBottom: u(daySize * 0.1),
                  }}
                >
                  {model.dayUnit}
                </span>
              </div>
              <span
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: u(daySize * 0.13),
                  letterSpacing: '0.22em',
                  color: lime(0.72),
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {digitsLine(model)}
              </span>
            </>
          ) : null}

          {model.visible.title ? (
            <span
              style={{
                fontFamily: FONT_SANS,
                fontSize: u(base * 0.052),
                fontWeight: 500,
                color: ink(0.92),
                letterSpacing: '0.05em',
              }}
            >
              {model.title}
            </span>
          ) : null}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: u(16) }}>
          {/* 刻度尺 */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: u(4), width: '100%', height: u(20) }}>
            {ruler.map((index) => (
              <div
                key={index}
                style={{
                  flex: 1,
                  height: index % 4 === 0 ? u(16) : u(8),
                  background: index % 4 === 0 ? lime(0.55) : ink(0.16),
                }}
              />
            ))}
          </div>
          {model.visible.progress ? (
            <SegmentedProgress
              value={model.progress}
              color={LIME}
              dim={ink(0.1)}
              u={u}
              segments={32}
              block={7}
            />
          ) : null}
          <FooterRow
            model={model}
            u={u}
            design={design}
            color={ink(0.34)}
            qrSize={u(base * 0.15)}
            qrRadius={u(6)}
          />
        </div>
      </div>
    </Shell>
  );
}

/* ------------------------------------------------------------------ *
 * 4. ticket —— 票根
 * ------------------------------------------------------------------ */

function TicketTemplate({ model, u, width, height, design, landscape }: TemplateProps) {
  const base = Math.min(design.width, design.height);
  const vertical = !landscape;
  const outer = u(base * 0.045);
  const notch = u(base * 0.035);

  const stub = (
    <div
      style={{
        flex: vertical ? '0 0 auto' : '0 0 32%',
        width: vertical ? '100%' : '32%',
        height: vertical ? '34%' : '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: u(14),
        padding: u(base * 0.05),
        boxSizing: 'border-box',
        background: ink(0.03),
      }}
    >
      <span
        style={{
          fontFamily: FONT_MONO,
          fontSize: u(19),
          letterSpacing: '0.22em',
          color: ink(0.5),
          textTransform: 'uppercase',
        }}
      >
        {model.daysLeftLabel}
      </span>
      <span
        style={{
          fontFamily: FONT_DISPLAY,
          fontSize: u(base * (vertical ? 0.2 : 0.22)),
          lineHeight: 0.9,
          fontWeight: 600,
          color: LIME,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {days(model)}
      </span>
      {model.visible.qr && model.qrDataUrl ? (
        <QrBlock
          src={model.qrDataUrl}
          size={u(base * 0.14)}
          padding={u(base * 0.012)}
          radius={u(8)}
        />
      ) : null}
    </div>
  );

  return (
    <Shell width={width} height={height} background={BASE}>
      <Layer
        style={{
          background: `radial-gradient(circle at 78% 92%, ${lime(0.14)} 0%, ${lime(0)} 58%)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: outer,
          borderRadius: u(26),
          border: `${u(2)}px solid ${ink(0.13)}`,
          background: `linear-gradient(150deg, #131a16 0%, #0e1512 100%)`,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: vertical ? 'column' : 'row',
        }}
      >
        <div
          style={{
            flex: 1,
            padding: u(base * 0.065),
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: u(20) }}>
            {model.visible.tag ? (
              <Kicker model={model} u={u} color={ink(0.62)} size={22} dot={model.palette.primary} />
            ) : (
              <span />
            )}
            <span
              style={{
                fontFamily: FONT_MONO,
                fontSize: u(19),
                letterSpacing: '0.2em',
                color: ink(0.3),
              }}
            >
              NO.{pad2(days(model))}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: u(20), minHeight: 0 }}>
            {model.visible.title ? (
              <span
                style={{
                  fontFamily: FONT_SANS,
                  fontSize: u(base * 0.058),
                  fontWeight: 600,
                  color: INK,
                  letterSpacing: '0.03em',
                }}
              >
                {model.title}
              </span>
            ) : null}
            {model.visible.days ? (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: u(16) }}>
                <span
                  style={{
                    fontFamily: FONT_DISPLAY,
                    fontSize: u(base * (vertical ? 0.15 : 0.13)),
                    lineHeight: 0.9,
                    fontWeight: 600,
                    color: INK,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {days(model)}
                </span>
                <span style={{ fontFamily: FONT_SANS, fontSize: u(base * 0.032), color: ink(0.6) }}>
                  {model.dayUnit} · {digitsLine(model)}
                </span>
              </div>
            ) : null}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: u(14) }}>
            {model.visible.progress ? (
              <Progress value={model.progress} color={LIME} track={ink(0.12)} height={u(6)} />
            ) : null}
            {model.visible.target ? (
              <span style={{ fontFamily: FONT_SANS, fontSize: u(22), color: ink(0.66) }}>
                {model.targetLabel}
              </span>
            ) : null}
            <span
              style={{
                fontFamily: FONT_MONO,
                fontSize: u(16),
                letterSpacing: '0.16em',
                color: ink(0.28),
              }}
            >
              {model.watermark}
            </span>
          </div>
        </div>

        {/* 撕口 */}
        <div
          style={{
            position: 'relative',
            flex: '0 0 auto',
            ...(vertical ? { height: u(0) } : { width: u(0) }),
            borderTop: vertical ? `${u(3)}px dashed ${ink(0.22)}` : undefined,
            borderLeft: vertical ? undefined : `${u(3)}px dashed ${ink(0.22)}`,
          }}
        >
          {[0, 1].map((index) => (
            <span
              key={index}
              style={{
                position: 'absolute',
                width: notch * 2,
                height: notch * 2,
                borderRadius: 999,
                background: BASE,
                ...(vertical
                  ? {
                      left: index === 0 ? -notch : undefined,
                      right: index === 1 ? -notch : undefined,
                      top: -notch,
                    }
                  : {
                      top: index === 0 ? -notch : undefined,
                      bottom: index === 1 ? -notch : undefined,
                      left: -notch,
                    }),
              }}
            />
          ))}
        </div>

        {stub}
      </div>
    </Shell>
  );
}

/* ------------------------------------------------------------------ *
 * 5. poster —— 壁纸级大字
 * ------------------------------------------------------------------ */

function PosterTemplate({ model, u, width, height, design, landscape }: TemplateProps) {
  const base = Math.min(design.width, design.height);
  const pad = u(base * 0.085);
  const titleSize = base * (landscape ? 0.2 : 0.15);

  return (
    <Shell
      width={width}
      height={height}
      background={`linear-gradient(200deg, #16241b 0%, ${BASE} 52%, #0c1410 100%)`}
    >
      <Layer
        style={{
          background: `radial-gradient(circle at 76% 16%, ${lime(0.3)} 0%, ${lime(0)} 52%)`,
        }}
      />
      {/* 斜向条纹装饰 */}
      <Layer
        style={{
          backgroundImage: `repeating-linear-gradient(135deg, ${lime(0.07)} 0px, ${lime(0.07)} ${u(3)}px, transparent ${u(3)}px, transparent ${u(18)}px)`,
          opacity: 0.7,
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          padding: pad,
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: landscape ? 'flex-start' : 'center',
          textAlign: landscape ? 'left' : 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          {model.visible.tag ? (
            <Kicker model={model} u={u} color={lime(0.8)} size={22} uppercase />
          ) : (
            <span />
          )}
          <BrandMark u={u} color={ink(0.3)} size={18} />
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: landscape ? 'flex-start' : 'center',
            gap: u(base * 0.035),
          }}
        >
          {model.visible.title ? (
            <span
              style={{
                fontFamily: FONT_DISPLAY,
                fontSize: u(titleSize),
                lineHeight: 1.02,
                fontWeight: 700,
                color: INK,
                letterSpacing: '-0.02em',
              }}
            >
              {model.title}
            </span>
          ) : null}

          {model.visible.days ? (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: u(base * 0.02) }}>
              <span
                style={{
                  fontFamily: FONT_DISPLAY,
                  fontSize: u(base * (landscape ? 0.16 : 0.12)),
                  lineHeight: 1,
                  fontWeight: 500,
                  color: LIME,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {days(model)}
              </span>
              <span style={{ fontFamily: FONT_SANS, fontSize: u(base * 0.036), color: ink(0.62) }}>
                {model.dayUnit}
              </span>
            </div>
          ) : null}

          {model.visible.days ? (
            <span
              style={{
                fontFamily: FONT_MONO,
                fontSize: u(base * 0.028),
                letterSpacing: '0.26em',
                color: ink(0.45),
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {digitsLine(model)}
            </span>
          ) : null}
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: u(18),
            width: '100%',
            alignItems: landscape ? 'flex-start' : 'center',
          }}
        >
          <div style={{ width: u(base * 0.2), height: u(2), background: lime(0.7) }} />
          {model.visible.progress ? (
            <div style={{ width: u(design.width * 0.5) }}>
              <Progress value={model.progress} color={LIME} track={ink(0.12)} height={u(7)} />
            </div>
          ) : null}
          {model.visible.target ? (
            <span style={{ fontFamily: FONT_SANS, fontSize: u(24), color: ink(0.74) }}>
              {model.targetLabel}
            </span>
          ) : null}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: u(20),
              justifyContent: landscape ? 'flex-start' : 'center',
              width: '100%',
            }}
          >
            <span
              style={{
                fontFamily: FONT_MONO,
                fontSize: u(16),
                letterSpacing: '0.16em',
                color: ink(0.32),
              }}
            >
              {model.watermark}
            </span>
            {model.visible.qr && model.qrDataUrl ? (
              <QrBlock
                src={model.qrDataUrl}
                size={u(base * 0.13)}
                padding={u(base * 0.012)}
                radius={u(8)}
              />
            ) : null}
          </div>
        </div>
      </div>
    </Shell>
  );
}

/* ------------------------------------------------------------------ *
 * 6. glass —— 毛玻璃卡片
 *
 * 刻意不用 `backdrop-filter`：html-to-image 走的是 SVG foreignObject，
 * 模糊层会被整块丢掉，导出图会变成一张糊不上去的透明板。
 * 这里用「半透明填充 + 内高光描边 + 外投影」仿出同样的通透感，
 * 全部是可被栅格化的纯色/渐变。
 * ------------------------------------------------------------------ */

function GlassTemplate({ model, u, width, height, design, landscape }: TemplateProps) {
  const base = Math.min(design.width, design.height);
  const daySize = base * (landscape ? 0.34 : 0.28);
  const pad = u(base * 0.07);
  const cardPad = u(base * 0.07);

  return (
    <Shell
      width={width}
      height={height}
      background={`linear-gradient(140deg, #1b3324 0%, #12251b 42%, ${BASE} 100%)`}
    >
      <Layer
        style={{
          background: `radial-gradient(circle at 24% 24%, ${lime(0.38)} 0%, ${lime(0)} 52%)`,
        }}
      />
      <Layer
        style={{
          background: `radial-gradient(circle at 82% 78%, rgba(52,211,153,0.26) 0%, rgba(52,211,153,0) 50%)`,
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: pad,
          boxSizing: 'border-box',
          borderRadius: u(36),
          background: ink(0.05),
          border: `${u(2)}px solid ${ink(0.16)}`,
          boxShadow: `0 ${u(28)}px ${u(60)}px rgba(0,0,0,0.45), inset 0 ${u(2)}px 0 ${ink(0.2)}`,
          padding: cardPad,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: landscape ? 'flex-start' : 'center',
          textAlign: landscape ? 'left' : 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          {model.visible.tag ? (
            <Kicker model={model} u={u} color={ink(0.72)} size={22} dot={model.palette.primary} />
          ) : (
            <span />
          )}
          <BrandMark u={u} color={ink(0.34)} size={18} />
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: landscape ? 'flex-start' : 'center',
            gap: u(26),
          }}
        >
          {model.visible.days ? (
            <>
              <span
                style={{
                  fontFamily: FONT_SANS,
                  fontSize: u(28),
                  color: ink(0.62),
                  letterSpacing: '0.05em',
                }}
              >
                {model.headline}
              </span>
              <DayDisplay
                model={model}
                u={u}
                daySize={daySize}
                unitSize={daySize * 0.32}
                subSize={daySize * 0.085}
                color={INK}
                unitColor={ink(0.68)}
                subColor={ink(0.45)}
                align={landscape ? 'flex-start' : 'center'}
              />
            </>
          ) : null}

          {model.visible.title ? (
            <span
              style={{
                fontFamily: FONT_SANS,
                fontSize: u(base * 0.058),
                fontWeight: 500,
                color: INK,
                letterSpacing: '0.04em',
              }}
            >
              {model.title}
            </span>
          ) : null}

          {model.visible.progress ? (
            <div style={{ width: u(design.width * 0.5) }}>
              <Progress value={model.progress} color={LIME} track={ink(0.16)} height={u(7)} />
            </div>
          ) : null}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: u(18), width: '100%' }}>
          <div style={{ width: '100%', height: 1, background: ink(0.14) }} />
          <FooterRow
            model={model}
            u={u}
            design={design}
            color={ink(0.36)}
            qrSize={u(base * 0.15)}
            qrRadius={u(12)}
          />
        </div>
      </div>
    </Shell>
  );
}

/* ------------------------------------------------------------------ *
 * 7. terminal —— 命令行
 * ------------------------------------------------------------------ */

function TerminalTemplate({ model, u, width, height, design, landscape }: TemplateProps) {
  const base = Math.min(design.width, design.height);
  const daySize = base * (landscape ? 0.36 : 0.3);
  const pad = u(base * 0.075);

  return (
    <Shell width={width} height={height} background="#050806">
      {/* 扫描线 */}
      <Layer
        style={{
          backgroundImage: `repeating-linear-gradient(0deg, ${lime(0.05)} 0px, ${lime(0.05)} ${u(2)}px, transparent ${u(2)}px, transparent ${u(7)}px)`,
        }}
      />
      <Layer
        style={{
          background: `radial-gradient(circle at 50% 30%, ${lime(0.14)} 0%, ${lime(0)} 62%)`,
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          padding: pad,
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        {/* 终端标题栏 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: u(20),
            paddingBottom: u(18),
            borderBottom: `${u(1)}px solid ${lime(0.25)}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: u(10) }}>
            {[lime(0.85), ink(0.35), ink(0.2)].map((color, index) => (
              <span
                key={index}
                style={{
                  width: u(14),
                  height: u(14),
                  borderRadius: 999,
                  background: color,
                  display: 'block',
                }}
              />
            ))}
            <span
              style={{
                fontFamily: FONT_MONO,
                fontSize: u(18),
                letterSpacing: '0.16em',
                color: ink(0.4),
                marginLeft: u(10),
              }}
            >
              ~/countdown
            </span>
          </div>
          <span style={{ fontFamily: FONT_MONO, fontSize: u(17), letterSpacing: '0.2em', color: lime(0.6) }}>
            SYS.OK
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: u(22) }}>
          {model.visible.tag ? (
            <Kicker model={model} u={u} color={lime(0.85)} size={22} uppercase prefix="$ " />
          ) : null}

          {model.visible.days ? (
            <>
              <span
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: u(24),
                  letterSpacing: '0.2em',
                  color: ink(0.55),
                }}
              >
                {model.headline}
              </span>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: u(20) }}>
                <span
                  style={{
                    fontFamily: FONT_DISPLAY,
                    fontSize: u(daySize),
                    lineHeight: 0.86,
                    fontWeight: 600,
                    color: INK,
                    textShadow: `0 0 ${u(18)} ${lime(0.55)}`,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {days(model)}
                </span>
                <span
                  style={{
                    fontFamily: FONT_MONO,
                    fontSize: u(daySize * 0.22),
                    color: LIME,
                    paddingBottom: u(daySize * 0.1),
                  }}
                >
                  D
                </span>
              </div>
              <span
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: u(26),
                  letterSpacing: '0.22em',
                  color: lime(0.75),
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {digitsLine(model)}
              </span>
            </>
          ) : null}

          {model.visible.title ? (
            <span
              style={{
                fontFamily: FONT_MONO,
                fontSize: u(base * 0.046),
                fontWeight: 600,
                color: ink(0.94),
                letterSpacing: '0.08em',
              }}
            >
              {model.title}
            </span>
          ) : null}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: u(18) }}>
          {model.visible.progress ? (
            <Progress value={model.progress} color={LIME} track={lime(0.16)} height={u(5)} />
          ) : null}
          <FooterRow
            model={model}
            u={u}
            design={design}
            color={ink(0.28)}
            qrSize={u(base * 0.14)}
            qrRadius={u(4)}
          />
        </div>
      </div>
    </Shell>
  );
}

/* ------------------------------------------------------------------ *
 * 分发
 * ------------------------------------------------------------------ */

const REGISTRY: Record<TemplateId, (props: TemplateProps) => ReactNode> = {
  ambient: AmbientTemplate,
  minimal: MinimalTemplate,
  grid: GridTemplate,
  ticket: TicketTemplate,
  poster: PosterTemplate,
  glass: GlassTemplate,
  terminal: TerminalTemplate,
};

export function CardTemplate({ template, ...props }: TemplateProps & { template: TemplateId }) {
  const Component = REGISTRY[template] ?? AmbientTemplate;
  return <>{Component(props)}</>;
}
