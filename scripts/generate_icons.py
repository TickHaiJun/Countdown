"""生成 PWA 图标（纯标准库，无第三方依赖）。

设计：Cosmic Ash 底色 + 靛蓝光晕 + 一段「走完 73%」的倒计时圆弧 + 暖色端点。
同一套绘制逻辑输出 192 / 512 / 512-maskable / apple-touch-180。

用法：
    python scripts/generate_icons.py
输出：
    public/icons/*.png
"""

from __future__ import annotations

import math
import os
import struct
import zlib

OUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public", "icons")

BASE = (0x10, 0x0E, 0x0B)          # #100e0b
INK = (0xF2, 0xEE, 0xE9)           # #f2eee9
ACCENT = (0x81, 0x8C, 0xF8)        # #818cf8
WARM = (0xF0, 0xB6, 0x75)          # #f0b675

SS = 3  # 每像素 3×3 超采样，抗锯齿


def _mix(a, b, t):
    t = max(0.0, min(1.0, t))
    return tuple(a[i] + (b[i] - a[i]) * t for i in range(3))


def _screen(a, b, strength=1.0):
    out = []
    for i in range(3):
        value = 255.0 - (255.0 - a[i]) * (255.0 - b[i]) / 255.0
        out.append(a[i] + (value - a[i]) * strength)
    return tuple(out)


def _blend(dst, src, alpha):
    return tuple(dst[i] + (src[i] - dst[i]) * alpha for i in range(3))


def render(size: int, maskable: bool) -> bytearray:
    """返回 RGB 字节流。maskable 版本把内容缩到安全区（居中 78%）。"""
    content_scale = 0.78 if maskable else 1.0
    radius_ratio = 0.30 * content_scale
    stroke_ratio = 0.058 * content_scale
    dot_ratio = 0.055 * content_scale
    glow_center = (0.42, 0.34)
    glow_radius = 0.62
    glow_strength = 0.34
    # 对角底色：与站点 aura-layer-1 同族，但压暗到不抢圆弧的对比度
    corner_far = (0x24, 0x21, 0x38)

    # 圆弧：从正上方开始顺时针走 73%，剩余部分是「还没走完」的留白
    start_angle = -math.pi / 2
    sweep = 0.73 * 2 * math.pi
    end_angle = start_angle + sweep

    pixels = bytearray(size * size * 3)

    for y in range(size):
        for x in range(size):
            acc = [0.0, 0.0, 0.0]
            for sy in range(SS):
                for sx in range(SS):
                    fx = (x + (sx + 0.5) / SS) / size
                    fy = (y + (sy + 0.5) / SS) / size

                    color = BASE  # type: tuple

                    # 0) 140° 对角底色渐变
                    t = min(1.0, max(0.0, (fx * 0.77 + fy * 0.64) / 1.41))
                    color = _mix(BASE, corner_far, t**1.25)

                    # 1) 靛蓝光晕（screen 混合，模拟 aura-layer-2）
                    dx = fx - glow_center[0]
                    dy = fy - glow_center[1]
                    dist = math.sqrt(dx * dx + dy * dy)
                    if dist < glow_radius:
                        falloff = 1.0 - (dist / glow_radius) ** 2.2
                        color = _screen(color, ACCENT, glow_strength * falloff)

                    # 2) 圆弧描边
                    rx = fx - 0.5
                    ry = fy - 0.5
                    r = math.sqrt(rx * rx + ry * ry)
                    angle = math.atan2(ry, rx)
                    delta = (angle - start_angle) % (2 * math.pi)
                    on_arc = delta <= sweep

                    if on_arc:
                        edge = abs(r - radius_ratio)
                        if edge < stroke_ratio / 2:
                            alpha = 1.0 - (edge / (stroke_ratio / 2)) ** 3
                            color = _blend(color, INK, alpha)
                        elif edge < stroke_ratio / 2 + 0.006:
                            alpha = (1.0 - (edge - stroke_ratio / 2) / 0.006) * 0.35
                            color = _blend(color, INK, alpha)

                    # 3) 圆弧末端暖色端点
                    ex = 0.5 + radius_ratio * math.cos(end_angle)
                    ey = 0.5 + radius_ratio * math.sin(end_angle)
                    dd = math.sqrt((fx - ex) ** 2 + (fy - ey) ** 2)
                    if dd < dot_ratio:
                        color = _blend(color, WARM, 1.0 - (dd / dot_ratio) ** 2)

                    # 4) 未走完的那段用极暗的轨道补齐，交代「进度」语义
                    if not on_arc:
                        track_edge = abs(r - radius_ratio)
                        if track_edge < stroke_ratio / 2:
                            alpha = (1.0 - (track_edge / (stroke_ratio / 2)) ** 3) * 0.16
                            color = _blend(color, INK, alpha)

                    acc[0] += color[0]
                    acc[1] += color[1]
                    acc[2] += color[2]

            samples = SS * SS
            offset = (y * size + x) * 3
            for i in range(3):
                pixels[offset + i] = max(0, min(255, int(round(acc[i] / samples))))

    return pixels


def write_png(path: str, size: int, pixels: bytearray) -> None:
    stride = size * 3
    raw = bytearray()
    for y in range(size):
        raw.append(0)  # filter type 0
        raw += pixels[y * stride : (y + 1) * stride]

    def chunk(tag: bytes, data: bytes) -> bytes:
        return (
            struct.pack(">I", len(data))
            + tag
            + data
            + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
        )

    png = b"\x89PNG\r\n\x1a\n"
    png += chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0))
    png += chunk(b"IDAT", zlib.compress(bytes(raw), 9))
    png += chunk(b"IEND", b"")

    with open(path, "wb") as handle:
        handle.write(png)


def main() -> None:
    os.makedirs(OUT_DIR, exist_ok=True)
    targets = [
        ("icon-192.png", 192, False),
        ("icon-512.png", 512, False),
        ("icon-512-maskable.png", 512, True),
        ("apple-touch-icon.png", 180, False),
    ]
    for name, size, maskable in targets:
        pixels = render(size, maskable)
        path = os.path.join(OUT_DIR, name)
        write_png(path, size, pixels)
        print(f"{name}: {size}x{size} -> {os.path.getsize(path)} bytes")


if __name__ == "__main__":
    main()
