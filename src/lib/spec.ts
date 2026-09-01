// 디자인 시스템(design-system-v1.html)의 수치를 그대로 옮긴 곳.
// 화면 코드에 숫자를 흩뿌리지 않고 여기 한 곳에서만 바꾼다.

export const FAN = {
  count: 13,
  mid: 6,
  stepWide: 6.5,          // 각도 간격
  stepNarrow: 5.6,        // 좁은 화면
  origin: '50% 313%',     // 회전축
  lift: 24,               // 최대 들림
  falloff: 9,             // 이웃 한 장당 감쇠
  wave: 16,               // 물결 시차. 이 시차가 물결을 만든다
  maxWave: 3,             // 3장 밖은 반응하지 않는다
  grow: 0.053,            // 들림에 따라 아주 조금 커진다
  dealMs: 440,            // 펼침
  dealStagger: 46,        // 가운데부터 바깥으로
  hoverMs: 260,
  hoverEase: 'cubic-bezier(.34,1.28,.5,1)',
} as const

// 뽑기 3박자. 박자를 조금씩 겹쳐야 하나의 연속된 동작으로 읽힌다.
export const BEAT = {
  one: 190,        // 뽑은 장이 솟는다
  two: 380,        // 남은 부채가 접힌다
  three: 590,      // 뽑은 장이 돌아누워 얇아진다
  twoStagger: 13,  // 바깥 장부터
  rise: 46,
  riseScale: 1.16,
  flipScale: 1.62,
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
export function nameSize(len: number): string {
  const map: Record<number, number> = { 2: 66, 3: 60, 4: 52, 5: 46, 6: 41 }
  return `${map[len] ?? 37}px`
}
