import type { Theme } from './types'
import { lattice } from './patterns'

// 기본 옷. design-system-v1.html 의 색을 그대로 옮긴 곳이다.
// 시즌 테마는 이 파일을 복사해 바꿀 것만 바꾼다.
const TALIS = '#F0C93F' // 부적 노랑 · 브랜드 색
const CINNABAR = '#B32B1E' // 주사 · 도장 색
const BONE = '#DDD3B6' // 바랜 종이
const SOOT = '#241708' // 먹

const GOLD = 'rgba(240, 201, 63, ' // 뒷면 위에 얹는 금은 노랑의 투명도만 바꾼다

export const basic: Theme = {
  id: 'basic',
  label: '기본',

  ground: {
    base: '#14302E',
    lift: '#1B3E3B',
    deep: '#0E2321',
    ink: TALIS,
    dark: SOOT,
  },

  back: {
    paper: CINNABAR,
    ring: `${GOLD}0.7)`,
    pattern: lattice(`${GOLD}0.26)`),
    sealPaper: TALIS,
    sealInk: CINNABAR,
    glyph: '運',
  },

  // 종이는 세 가지뿐이다 — 좋음 세 단계는 같은 금색 종이를 쓰고 도장 글자로만 갈린다
  papers: {
    great: { paper: TALIS, ink: SOOT, band: CINNABAR, bandInk: TALIS, accent: CINNABAR },
    good: { paper: TALIS, ink: SOOT, band: CINNABAR, bandInk: TALIS, accent: CINNABAR },
    small: { paper: TALIS, ink: SOOT, band: CINNABAR, bandInk: TALIS, accent: CINNABAR },
    soso: { paper: BONE, ink: '#3A2E18', band: '#3A2E18', bandInk: BONE, accent: '#A8321F' },
    caution: { paper: CINNABAR, ink: TALIS, band: SOOT, bandInk: TALIS, accent: TALIS },
  },

  spell: '急急如律令',
}
