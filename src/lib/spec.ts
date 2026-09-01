// 디자인 시스템(design-system-v1.html)의 수치를 그대로 옮긴 곳.
// 화면 코드에 숫자를 흩뿌리지 않고 여기 한 곳에서만 바꾼다.

export const FAN = {
  count: 17,
  get mid() {
    return (this.count - 1) / 2
  },
  step: 5.15, // 각도 간격. 카드 크기가 달라져도 간격 비율은 유지된다
  origin: '50% 313%', // 회전축
  lift: 24, // 최대 들림
  falloff: 7, // 이웃 한 장당 감쇠. 카드가 촘촘해진 만큼 물결도 넓게 번진다
  wave: 14, // 물결 시차. 이 시차가 물결을 만든다
  maxWave: 4, // 그 밖은 반응하지 않는다
  grow: 0.06, // 들림에 따라 아주 조금 커진다

  // 촤라락 · 왼쪽에서 오른쪽으로 훑고 지나간다.
  // 가운데부터 펴면 좌우가 동시에 움직여 한 덩어리가 벌어지는 것처럼 보인다.
  dealMs: 460,
  dealStagger: 20,
  dealFrom: { y: 7, scale: 0.97 }, // 손에 쥔 덱에서 출발한다

  hoverMs: 260,
  hoverEase: 'cubic-bezier(.34,1.28,.5,1)',
} as const

// 뽑기 3박자. 박자를 조금씩 겹쳐야 하나의 연속된 동작으로 읽힌다.
export const BEAT = {
  one: 200, // 뽑은 장이 스프레드에서 솟는다
  two: 390, // 남은 부채가 접힌다
  three: 600, // 뽑은 장이 돌아누워 얇아진다
  twoStagger: 11, // 바깥 장부터
  rise: 62, // 확실히 빠져나왔다고 읽힐 만큼 올린다
  riseScale: 1.24,
  flipScale: 1.66,
  flipDeg: 88,
  revealMs: 360,
  revealFrom: -82,
  ease: 'cubic-bezier(.22,.86,.34,1)',
} as const

export const SPELL = '急急如律令'

export const SEAL: Record<string, string> = { good: '吉', bad: '凶', ambiguous: '半' }

// 종이가 떠오르면 그림자도 멀어지고 흐려진다. 고정하면 위로 이동한 것처럼 보인다.
export function shadowFor(lift: number): string {
  const ground = `0 ${(1 + lift * 0.16).toFixed(2)}px ${(2 + lift * 0.22).toFixed(2)}px rgba(0,0,0,.34)`
  const spread = `-2px ${(3 + lift * 0.34).toFixed(2)}px ${(7 + lift * 0.78).toFixed(2)}px rgba(0,0,0,.20)`
  return `${ground}, ${spread}`
}

// 운 이름은 글자수에 따라 자동으로 줄어든다.
export function nameSize(len: number): number {
  const map: Record<number, number> = { 2: 66, 3: 60, 4: 52, 5: 46, 6: 41 }
  return map[len] ?? 37
}

// 결과 부적의 판정 색. 화면과 저장 이미지가 같은 값을 쓴다.
export interface Palette {
  paper: string
  ink: string
  band: string
  bandInk: string
  accent: string
}

export function paletteOf(type: string): Palette {
  if (type === 'bad') {
    return { paper: '#B32B1E', ink: '#F0C93F', band: '#241708', bandInk: '#F0C93F', accent: '#F0C93F' }
  }
  if (type === 'ambiguous') {
    return { paper: '#DDD3B6', ink: '#3A2E18', band: '#3A2E18', bandInk: '#DDD3B6', accent: '#A8321F' }
  }
  return { paper: '#F0C93F', ink: '#241708', band: '#B32B1E', bandInk: '#F0C93F', accent: '#B32B1E' }
}

export const GROUND = '#14302E'
