#!/usr/bin/env python3
"""앱 아이콘·파비콘을 그린다 → public/favicon-32.png · icon-192.png · icon-512.png · apple-touch-icon.png

브라우저 탭과 홈 화면에서 앱을 대신하는 그림이다.
og.png 와 같은 문법을 쓴다 — 어두운 초록 바탕에 노란 부적 한 장, 붉은 도장 運.

    pip install pillow && python3 scripts/make-icons.py
"""
import math, pathlib, urllib.request
from PIL import Image, ImageDraw, ImageFont

GROUND, LIFT = (0x14, 0x30, 0x2E), (0x1B, 0x3E, 0x3B)
TALIS, CINNABAR, SOOT = (0xF0, 0xC9, 0x3F), (0xB3, 0x2B, 0x1E), (0x24, 0x17, 0x08)

HERE = pathlib.Path(__file__).parent
PUB = HERE.parent / "public"
CACHE = HERE / ".fonts"
HANJA_URL = "https://github.com/google/fonts/raw/main/ofl/notoserifkr/NotoSerifKR%5Bwght%5D.ttf"

BASE = 512  # 기준 크기. 4배로 그려 줄이면 작은 크기에서도 선이 뭉개지지 않는다
S = 4


def hanja(size: int) -> ImageFont.FreeTypeFont:
    """나눔명조에는 한자가 없다. 사이트가 쓰는 것과 같은 명조를 쓴다"""
    CACHE.mkdir(exist_ok=True)
    path = CACHE / "NotoSerifKR-var.ttf"
    if not path.exists():
        print("Noto Serif KR 내려받는 중… (24MB)")
        urllib.request.urlretrieve(HANJA_URL, path)
    f = ImageFont.truetype(str(path), size)
    try:
        f.set_variation_by_axes([700])
    except Exception:
        pass
    return f


def ground(size: int) -> Image.Image:
    """위가 살짝 밝은 바탕. og.png 의 무대와 같은 공기"""
    small = Image.new("RGB", (16, 16))
    px = small.load()
    for y in range(16):
        for x in range(16):
            t = min(1.0, math.hypot((x / 16 - 0.5) / 0.7, (y / 16) / 0.9))
            px[x, y] = tuple(round(LIFT[i] + (GROUND[i] - LIFT[i]) * t) for i in range(3))
    return small.resize((size, size), Image.BICUBIC)


def draw_base() -> Image.Image:
    size = BASE * S
    img = ground(size).convert("RGBA")

    # 부적 한 장. 살짝 기울여야 놓인 물건으로 보인다
    cw, ch = round(0.60 * size), round(0.84 * size)
    card = Image.new("RGBA", (cw, ch), TALIS + (255,))
    d = ImageDraw.Draw(card)

    # 머리띠
    band_h = round(ch * 0.10)
    d.rectangle([0, 0, cw, band_h], fill=CINNABAR)

    # 도장 運 · 아이콘에서 큰 것은 이것 하나뿐이다
    r = round(cw * 0.30)
    cx, cy = cw // 2, round(ch * 0.42)
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=CINNABAR)
    d.text((cx, cy), "運", font=hanja(round(r * 1.15)), fill=TALIS, anchor="mm")

    # 글줄 흉내 두 줄. 읽히면 안 되고, 문서처럼만 보이면 된다
    for i, w in enumerate((0.58, 0.38)):
        lw = round(cw * w)
        ly = round(ch * (0.70 + i * 0.085))
        d.rectangle([cx - lw // 2, ly, cx + lw // 2, ly + round(ch * 0.028)], fill=SOOT + (70,))

    # 모서리 선. 종이는 빛나지 않는다 — 선과 그림자가 전부다
    d.rectangle([0, 0, cw - 1, ch - 1], outline=SOOT + (60,), width=S)

    rot = card.rotate(7, resample=Image.BICUBIC, expand=True)
    shadow = Image.new("RGBA", rot.size, (0, 0, 0, 0))
    shadow.paste((0, 0, 0, 90), (0, 0), rot.split()[3])
    ox, oy = (size - rot.width) // 2, (size - rot.height) // 2
    img.alpha_composite(shadow, (ox - 3 * S, oy + 5 * S))
    img.alpha_composite(rot, (ox, oy))
    return img


def main() -> None:
    PUB.mkdir(exist_ok=True)
    base = draw_base()
    for name, size in (
        ("icon-512.png", 512),
        ("icon-192.png", 192),
        ("apple-touch-icon.png", 180),
        ("favicon-32.png", 32),
    ):
        out = PUB / name
        base.resize((size, size), Image.LANCZOS).convert("RGB").save(out, "PNG", optimize=True)
        print(f"{out} · {size}x{size} · {out.stat().st_size / 1024:.1f}KB")


if __name__ == "__main__":
    main()
