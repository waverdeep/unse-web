import type { Theme } from './types'
import { basic } from './basic'
import { lattice } from './patterns'

// 시즌 테마의 본보기. 밤하늘 바탕에 남색 뒷면 — 앞면 종이는 그대로다.
// 지금은 자동으로 켜지지 않는다. ?theme=newyear 로 본다.
// 켜려면 season 을 채운다: season: { from: '12-31', to: '01-02' }
const NAVY = '#1E2A5A'
const GOLD = 'rgba(240, 201, 63, '

export const newyear: Theme = {
  ...basic,
  id: 'newyear',
  label: '새해',

  ground: {
    ...basic.ground,
    base: '#121A38',
    lift: '#1B2650',
    deep: '#0A0F24',
  },

  back: {
    ...basic.back,
    paper: NAVY,
    pattern: lattice(`${GOLD}0.22)`, 9),
    sealInk: NAVY,
  },
}
