#!/usr/bin/env python3
"""링크 미리보기 이미지(public/og.png)를 그린다.

카톡·DM 으로 링크를 보냈을 때 뜨는 그림이다.
결과는 기기마다 다르므로 특정 운을 보여주지 않고, 부적 한 벌과 제목만 보인다.

    pip install pillow && python3 scripts/make-og.py

나눔명조는 저장소에 넣지 않고 필요할 때 받아 쓴다.
"""
import math, pathlib, sys, urllib.request
from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 630
GROUND, LIFT, DEEP = (0x14, 0x30, 0x2E), (0x1B, 0x3E, 0x3B), (0x0E, 0x23, 0x21)
TALIS, CINNABAR, SOOT = (0xF0, 0xC9, 0x3F), (0xB3, 0x2B, 0x1E), (0x24, 0x17, 0x08)

BRAND, DOMAIN = "운뽑", "luck.zzam.today"
TITLE = ["오늘 당신에게", "있는 운"]

HERE = pathlib.Path(__file__).parent
OUT = HERE.parent / "public" / "og.png"
CACHE = HERE / ".fonts"
FONT_URL = "https://github.com/google/fonts/raw/main/ofl/nanummyeongjo/NanumMyeongjo-{}.ttf"
HANJA_URL = "https://github.com/google/fonts/raw/main/ofl/notoserifkr/NotoSerifKR%5Bwght%5D.ttf"


def font(style: str, size: int) -> ImageFont.FreeTypeFont:
    CACHE.mkdir(exist_ok=True)
    path = CACHE / f"NanumMyeongjo-{style}.ttf"
    if not path.exists():
        print(f"나눔명조 {style} 내려받는 중…")
        urllib.request.urlretrieve(FONT_URL.format(style), path)
    return ImageFont.truetype(str(path), size)


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


def ground() -> Image.Image:
    """방사형 그라디언트 한 겹. 작게 그려 늘리면 부드럽게 번진다"""
    sw, sh = 80, 42
    small = Image.new("RGB", (sw, sh))
    px = small.load()
    for y in range(sh):
        for x in range(sw):
            dx, dy = (x / sw - 0.5) / 0.45, (y / sh - 0.0) / 0.5
            t = min(1.0, math.hypot(dx, dy) / 1.6)
            a, b = (LIFT, GROUND) if t < 0.4 else (GROUND, DEEP)
            k = t / 0.4 if t < 0.4 else (t - 0.4) / 0.6
            px[x, y] = tuple(round(a[i] + (b[i] - a[i]) * k) for i in range(3))
    return small.resize((W, H), Image.BICUBIC)


def talisman(w: int, h: int) -> Image.Image:
    """부적 한 장의 뒷면. 시작 화면과 같은 능화판 격자 — 꽉 찬 금 도장에 붉은 運"""
    card = Image.new("RGBA", (w, h), CINNABAR + (255,))
    d = ImageDraw.Draw(card)
    for off in range(-h, w + h, 6):  # 능화판 격자
        d.line([(off, 0), (off + h, h)], fill=TALIS + (56,))
        d.line([(off + h, 0), (off, h)], fill=TALIS + (56,))
    m = 4  # 가장자리 민무늬 띠 + 금테
    d.rectangle([0, 0, w - 1, m - 1], fill=CINNABAR)
    d.rectangle([0, h - m, w - 1, h - 1], fill=CINNABAR)
    d.rectangle([0, 0, m - 1, h - 1], fill=CINNABAR)
    d.rectangle([w - m, 0, w - 1, h - 1], fill=CINNABAR)
    d.rectangle([m, m, w - m - 1, h - m - 1], outline=TALIS + (178,), width=1)
    d.line([(0, 0), (0, h)], fill=(0, 0, 0, 70))
    d.line([(w - 1, 0), (w - 1, h)], fill=(255, 255, 255, 40))
    cx, cy, r = w // 2, h // 2, round(w * 0.22)
    d.ellipse([cx - r - 3, cy - r - 3, cx + r + 3, cy + r + 3], fill=CINNABAR)
    d.ellipse([cx - r - 3, cy - r - 3, cx + r + 3, cy + r + 3], outline=TALIS + (178,), width=1)
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=TALIS)
    d.text((cx, cy), "運", font=hanja(max(9, round(r * 1.1))), fill=CINNABAR, anchor="mm")
    return card


def main() -> None:
    img = ground().convert("RGBA")

    # ── 부채 · 오른쪽 ──
    cw, ch, n, step = 80, 129, 13, 5.15
    radius = ch * 2.63
    mid_x, mid_y = 872, 322
    pivot_y = mid_y + radius
    card = talisman(cw, ch)
    for i in range(n):
        t = math.radians((i - (n - 1) / 2) * step)
        x = mid_x + radius * math.sin(t)
        y = pivot_y - radius * math.cos(t)
        rot = card.rotate(-math.degrees(t), resample=Image.BICUBIC, expand=True)
        shadow = Image.new("RGBA", rot.size, (0, 0, 0, 0))
        shadow.paste((0, 0, 0, 70), (0, 0), rot.split()[3])
        img.alpha_composite(shadow, (round(x - rot.width / 2) - 2, round(y - rot.height / 2) + 3))
        img.alpha_composite(rot, (round(x - rot.width / 2), round(y - rot.height / 2)))

    d = ImageDraw.Draw(img)

    # ── 글자 · 왼쪽 ──
    x0 = 96
    d.text((x0, 196), BRAND, font=font("Bold", 30), fill=TALIS + (150,), anchor="ls")
    f = font("ExtraBold", 78)
    for i, line in enumerate(TITLE):
        d.text((x0, 292 + i * 92), line, font=f, fill=TALIS + (255,), anchor="ls")
    d.text((x0, 452), "끌리는 한 장을 골라보세요", font=font("Bold", 26), fill=TALIS + (120,), anchor="ls")

    d.line([(x0, 496), (x0 + 300, 496)], fill=TALIS + (40,), width=2)
    d.text((x0, 536), DOMAIN, font=font("Bold", 24), fill=TALIS + (135,), anchor="ls")

    OUT.parent.mkdir(exist_ok=True)
    img.convert("RGB").save(OUT, "PNG", optimize=True)
    kb = OUT.stat().st_size / 1024
    print(f"{OUT} · {W}x{H} · {kb:.0f}KB")
    if kb > 300:
        print("경고: 카톡 미리보기는 300KB 아래가 안전하다", file=sys.stderr)


if __name__ == "__main__":
    main()
