#!/usr/bin/env python3
"""生成 public/og-default.png —— OG / Twitter Card 分享图。

设计（详见 .trellis/tasks/08-16-og-meta-tags/prd.md）：
- 1200×630，PNG
- 紫蓝青三色对角渐变（呼应 brand-accent → brand-primary → brand-glow）
- 主标题 "✦ Cool Panda ✦" 居中，serif italic，白色
- 副标题 "熊猫博客 · 不定期更新" 较小，白色 ~70%
- 左下角 mono 小字水印
- 目标：< 100KB

依赖：Pillow（用 uv venv .venv 安装）
用法：source .venv/bin/activate && python3 scripts/generate-og-image.py
"""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from pathlib import Path

# 品牌色（与 tailwind.config.js 的 brand-* token 一一对应）
COLOR_ACCENT = (0xa7, 0x8b, 0xfa)   # #a78bfa
COLOR_PRIMARY = (0x5b, 0x8d, 0xef)  # #5b8def
COLOR_GLOW = (0x4c, 0xc9, 0xf0)     # #4cc9f0
COLOR_LIGHT = (0xf8, 0xfa, 0xfc)    # #f8fafc
COLOR_DIM = (0x64, 0x74, 0x8b)      # #64748b

W, H = 1200, 630

# 字体路径（系统已装）
FONT_SERIF_ITALIC = '/usr/share/fonts/truetype/liberation/LiberationSerif-Italic.ttf'
FONT_SERIF_CJK = '/usr/share/fonts/opentype/noto/NotoSerifCJK-Regular.ttc'  # .ttc 集合
FONT_SANS_CJK = '/usr/share/fonts/truetype/fonts-japanese-gothic.ttf'
FONT_MONO = '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def draw_gradient(img):
    """对角渐变：左上 brand-accent → 中下 brand-primary → 右下 brand-glow。
    Pillow 不直接支持三色渐变，手工逐像素计算（1200×630 = 756000 像素）。"""
    pixels = img.load()
    # 三段：从 (0,0) → (W/2, H) → (W, H)
    # 简化：先做 accent→primary，再做 primary→glow，按 x 比例分配
    for y in range(H):
        for x in range(W):
            # 沿对角线的进度 t ∈ [0, 1]，用 (x + y) / (W + H) 给一个平滑过渡
            t = (x + y) / (W + H)
            # 把 t 分两段：[0, 0.5] 用 accent→primary；[0.5, 1.0] 用 primary→glow
            if t < 0.5:
                local = t / 0.5
                color = lerp(COLOR_ACCENT, COLOR_PRIMARY, local)
            else:
                local = (t - 0.5) / 0.5
                color = lerp(COLOR_PRIMARY, COLOR_GLOW, local)
            pixels[x, y] = color + (255,)


def main():
    img = Image.new('RGBA', (W, H), (0, 0, 0, 255))
    draw_gradient(img)

    # 主标题 "Cool Panda"：Liberation Serif Italic，最大尺寸
    # 注：Liberation Serif 不包含 ✦（U+2726 BLACK FOUR POINTED STAR），
    # 如果加 ✦ 会渲染为空字符。这里用纯文字版，纯净大方。
    title_font = ImageFont.truetype(FONT_SERIF_ITALIC, 140)
    title = 'Cool Panda'

    # 创建 ImageDraw 对象（后续 glow 层与主标题都要用）
    draw = ImageDraw.Draw(img)

    # 用 textbbox 居中（比 textsize 更准确，处理 unicode）
    bbox = draw.textbbox((0, 0), title, font=title_font)
    title_w = bbox[2] - bbox[0]
    title_x = (W - title_w) // 2 - bbox[0]
    title_y = int(H * 0.30) - bbox[1]

    # 主标题白字 + 紫光阴影（先画一层 alpha 较低的发光版，模糊，再画白字）
    glow_layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow_layer)
    glow_color = (167, 139, 250, 140)  # brand-accent / ~55% opacity
    glow_draw.text((title_x, title_y), title, font=title_font, fill=glow_color)
    glow_layer = glow_layer.filter(ImageFilter.GaussianBlur(radius=18))
    img.alpha_composite(glow_layer)

    # 白字主标题（draw 已在上面创建）
    draw.text((title_x, title_y), title, font=title_font, fill=COLOR_LIGHT + (255,))

    # 副标题 "熊猫博客 · 不定期更新"：用 Japanese Gothic（覆盖中文 + 拉丁）
    sub_font = ImageFont.truetype(FONT_SANS_CJK, 38)
    sub = '熊猫博客  ·  不定期更新'
    sub_bbox = draw.textbbox((0, 0), sub, font=sub_font)
    sub_w = sub_bbox[2] - sub_bbox[0]
    sub_x = (W - sub_w) // 2 - sub_bbox[0]
    sub_y = int(H * 0.62) - sub_bbox[1]
    sub_color = COLOR_LIGHT + (220,)  # 白色 ~86% opacity
    draw.text((sub_x, sub_y), sub, font=sub_font, fill=sub_color)

    # 左下角 mono 小水印：英文 caption
    mono_font = ImageFont.truetype(FONT_MONO, 22)
    caption = 'cool panda · blog'
    cap_bbox = draw.textbbox((0, 0), caption, font=mono_font)
    cap_x = 36 - cap_bbox[0]
    cap_y = H - 36 - (cap_bbox[3] - cap_bbox[1]) + cap_bbox[1]
    cap_color = COLOR_LIGHT + (160,)  # 白色 ~63%
    draw.text((cap_x, cap_y), caption, font=mono_font, fill=cap_color)

    # 右下角 mono：tagline
    tagline = '2 entries · since 2026'
    tag_bbox = draw.textbbox((0, 0), tagline, font=mono_font)
    tag_x = W - 36 - (tag_bbox[2] - tag_bbox[0]) + tag_bbox[0]
    tag_y = H - 36 - (tag_bbox[3] - tag_bbox[1]) + tag_bbox[1]
    draw.text((tag_x, tag_y), tagline, font=mono_font, fill=cap_color)

    # 保存：PNG 8-bit + palette（减小体积）
    out = Path('public/og-default.png')
    # 转 RGB（去 alpha），PNG 优化
    rgb = img.convert('RGB')
    rgb.save(out, format='PNG', optimize=True)

    size_kb = out.stat().st_size / 1024
    print(f'✓ 写入 {out} ({size_kb:.1f} KB)')


if __name__ == '__main__':
    main()