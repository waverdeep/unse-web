import type { LuckType } from '../types'

/**
 * 시즌마다 갈아입는 옷. 색·뒷면·바탕은 전부 여기서 나온다.
 *
 * 화면(CSS 변수)과 저장 이미지(캔버스)가 같은 객체를 읽으므로 테마 하나를 고치면 둘 다 바뀐다.
 * 바뀌지 않는 것 — 판정 도장 글자(spec.ts SEAL), 카드 치수, 글꼴, 애니메이션.
 * 그것들은 제품의 뼈대라 시즌 옷이 아니다.
 */
export interface Palette {
  paper: string
  ink: string
  band: string
  bandInk: string
  accent: string
}

export interface Theme {
  /** ?theme=<id> 로 미리 볼 수 있다 */
  id: string
  label: string
  /**
   * 매년 반복되는 기간. 'MM-DD' 둘 다 포함이고 연말을 넘겨도 된다 (예: 12-24 → 01-02).
   * 없으면 자동으로 켜지지 않고 ?theme= 으로만 본다.
   */
  season?: { from: string; to: string }

  /** 무대. 어두운 곳에 부적이 걸려 있다 */
  ground: {
    base: string
    lift: string
    deep: string
    /** 그라디언트 위에 한 겹 더 얹을 CSS background-image (예: url('/snow.png')). 없으면 민무늬 */
    image?: string
    /** 바탕 위 글자·선·버튼 색. 보조 텍스트는 이 색의 투명도만 낮춘다 (회색 금지) */
    ink: string
    /** 진한 잉크. 채운 버튼의 글자, 토스트 바탕 */
    dark: string
  }

  /** 카드 뒷면. 뽑기 전에는 이것만 보인다 */
  back: {
    paper: string
    /** 금테·도장 고리 색 */
    ring: string
    /** CSS background-image. patterns.ts 의 도우미로 만든다 */
    pattern: string
    sealPaper: string
    sealInk: string
    /** 뒷면 도장 한 글자. 한자면 public/hanja.woff2 에 있어야 한다 → scripts/make-hanja-font.py */
    glyph: string
  }

  /** 앞면 종이. 판정마다 다르다 — "색이 판정을 대신 말한다" 는 기둥이라 시즌에도 웬만하면 유지 */
  papers: Record<LuckType, Palette>

  /** 앞면 머리 장식 주문 한 줄. 한자면 hanja.woff2 에 있어야 한다 */
  spell: string
}
