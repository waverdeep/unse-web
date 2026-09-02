#!/usr/bin/env python3
"""부적에 쓰는 한자 열한 자만 담은 폰트를 만든다 → public/hanja.woff2

나눔명조에는 한자가 한 글자도 없다. 그대로 두면 運·急急如律令·도장 글자가
기기마다 다른 서체로 떨어지고, 안드로이드에서는 명조 옆에 고딕이 섞인다.

    python3 -m pip install fonttools brotli
    python3 scripts/make-hanja-font.py
"""
import pathlib, urllib.request
from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

GLYPHS = "運急如律令大吉小平注意"  # 표식 · 세로 주문 · 도장(大吉 吉 小吉 平 注意)
WEIGHT = 700  # 본문 명조와 붙었을 때 무게가 맞는 지점

HERE = pathlib.Path(__file__).parent
CACHE = HERE / ".fonts"
OUT = HERE.parent / "public" / "hanja.woff2"
SRC = "https://github.com/google/fonts/raw/main/ofl/notoserifkr/NotoSerifKR%5Bwght%5D.ttf"


def main() -> None:
    CACHE.mkdir(exist_ok=True)
    src = CACHE / "NotoSerifKR-var.ttf"
    if not src.exists():
        print("Noto Serif KR 내려받는 중… (24MB)")
        urllib.request.urlretrieve(SRC, src)

    font = TTFont(src)
    font = instantiateVariableFont(font, {"wght": WEIGHT}, updateFontNames=False)

    opts = subset.Options()
    opts.flavor = "woff2"
    opts.desubroutinize = True
    opts.notdef_outline = False
    opts.layout_features = []
    opts.name_IDs = []
    opts.drop_tables += ["GSUB", "GPOS"]
    s = subset.Subsetter(options=opts)
    s.populate(text=GLYPHS)
    s.subset(font)

    OUT.parent.mkdir(exist_ok=True)
    font.flavor = "woff2"
    font.save(OUT)
    print(f"{OUT} · {GLYPHS} · {OUT.stat().st_size / 1024:.1f}KB")


if __name__ == "__main__":
    main()
