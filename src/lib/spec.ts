// 디자인 시스템(design-system-v1.html)의 수치를 그대로 옮긴 곳.
// 화면 코드에 숫자를 흩뿌리지 않고 여기 한 곳에서만 바꾼다.
// 애니메이션은 GSAP 타임라인으로 돌리므로 시간 단위는 전부 초(s)다.

// 손패 · 화투 패처럼 화면 아래에서 솟는 부채. 카드가 크고, 양끝은 화면 밖으로 조금 나가도 된다.
export const FAN = {
  // 손패는 한 장이 카드로 읽혀야 한다 — 한 장당 드러나는 폭이 16px 이면 줄무늬, 24px 이상이면 패다.
  // 장수·카드 폭·드러나는 폭 셋은 화면 폭에 묶여 있고, 곡률은 회전축 거리라는 다른 손잡이다
  count: 15,
  get mid() {
    return (this.count - 1) / 2
  },
  // 회전축이 멀수록 같은 간격을 작은 각도로 얻는다 — 165% 에서는 9.4° 가 필요했던 간격이 300% 에서는 3.9° 다.
  // 그래서 양끝이 ±47° 로 눕지 않고 ±27° 로 선다
  step: 3.9,
  pivotY: 3, // 회전축. 카드 높이의 3배 지점 — 팔꿈치쯤이다. 손 아래 장 판정도 이 축을 기준으로 한다
  get origin() {
    return `50% ${this.pivotY * 100}%`
  },
  lift: 40, // 물결의 최대 높이
  falloff: 11, // 이웃 한 장당 감쇠. 이 감쇠 곡선이 물결의 모양이다
  // 손 아래 장은 물결 위로 한 번 더 뽑힌다. 쌓임 순서를 안 바꾸니 오른쪽 이웃(29)이 40 을 거의 따라와
  // 이 여분이 없으면 어느 장이 손 아래인지 안 읽힌다
  pick: 20,
  get liftMax() {
    return this.lift + this.pick
  },
  grow: 0.07, // 들림에 따라 아주 조금 커진다
  // 물결에 시차(delay)를 쓰지 않는다. 손이 움직이는 동안 예약된 트윈이
  // 계속 죽고 다시 잡혀 지나간 장이 공중에 걸린다. 대신 오르막과 내리막을
  // 비대칭으로 만든다 — 느린 내리막이 손 뒤에 남는 물결의 꼬리다
  riseS: 0.22, // 손 아래로 들어올 때는 경쾌하게
  riseEase: 'back.out(2)',
  fallS: 0.5, // 물러날 때는 천천히
  fallEase: 'power2.out',
  lean: 1.7, // 손가락 주변 카드가 바깥으로 벌어지는 최대 각도. 종이를 비집는 질감
  leanSpan: 3, // 벌어짐이 미치는 거리(장)
} as const

// 등장 · 덱이 잠깐 숨을 고르고 왼쪽부터 촤라락 펼쳐진다.
// 펴기 전의 움찔(다운스윙)이 있어야 펼침이 던져진 것처럼 읽힌다.
export const DEAL = {
  // 덱 상태에서 장마다 살짝 어긋난 각도. 쌓인 종이처럼 보인다.
  // 회전축이 카드 밖에 있어 각도가 곧 좌우 밀림이다 — 1°만 줘도 3px 씩 어긋나 계단이 된다
  deckJitter: 0.3,
  deckY: 10, // 덱은 살짝 아래에서 출발한다
  holdS: 0.16, // 덱이 숨 고르는 시간. 길면 멈춘 것처럼 보인다
  dipY: 5, // 펴기 직전 한 번 움찔 내려앉는 깊이
  dipS: 0.12,
  spreadS: 0.55,
  staggerS: 0.013, // 왼쪽부터. 시차가 넓으면 부채가 아니라 반쪽 부채 + 뭉치로 보인다
  ease: 'back.out(1.2)', // 살짝 넘쳤다 돌아와야 종이가 살아 있다
} as const

/** 덱에 쌓였을 때 장마다의 기울기. 3단 계단(i%3)이 아니라 5단을 흩뿌려야 종이 더미로 읽힌다 */
export function deckTilt(i: number): number {
  return ((((i * 7) % 5) - 2) / 2) * DEAL.deckJitter
}

// 다시 섞기 · 부채가 덱으로 되감겼다가 등장과 같은 박자로 다시 펼쳐진다.
export const SHUFFLE = {
  gatherS: 0.3, // 펼침(0.55s)보다 빨라야 한다. 모으기는 준비 동작이지 볼거리가 아니다
  gatherStaggerS: 0.012, // 바깥 장부터 모인다. 펼침의 역재생처럼 읽힌다
  gatherEase: 'power2.in',
} as const

// 쉬는 동안 · 펼쳐진 뒤 화면이 죽지 않게. 덱 전체가 숨을 쉬고, 이따금 한 장이 삐죽 올라와 손을 부른다.
export const IDLE = {
  breatheDeg: 1.1, // 부채 전체가 손목을 축으로 아주 천천히 갸웃한다
  breatheS: 3.4,
  beckonY: 16, // 삐죽 올라오는 높이. 들림(40)보다 확실히 낮아야 손이 아니라 신호로 읽힌다
  beckonUpS: 0.3,
  beckonHoldS: 0.25,
  beckonDownS: 0.7,
  beckonFirstS: 1.2, // 펼쳐진 뒤 첫 신호까지
  beckonEveryS: 2.2, // 이후 간격의 하한. 여기에 0~2초가 무작위로 더해진다
  beckonRandS: 2,
} as const

// 뽑기 3박자. 박자를 조금씩 겹쳐야 하나의 연속된 동작으로 읽힌다.
export const DRAW = {
  oneS: 0.26, // 1박 · 뽑은 장이 스프레드에서 솟는다
  twoS: 0.24, // 2박 · 남은 부채가 접힌다
  threeS: 0.24, // 3박 · 뽑은 장이 돌아누워 얇아진다
  twoStaggerS: 0.012, // 바깥 장부터
  rise: 120, // 확실히 빠져나왔다고 읽힐 만큼 올린다. 손패는 화면 아래에 있어 더 높이 솟아야 한다
  riseScale: 1.2,
  riseEase: 'back.out(1.7)',
  flipScale: 1.5,
  flipDeg: 88,
  perspective: 800, // 이 원근이 없으면 돌아눕는 게 아니라 눌려 접히는 것처럼 보인다
} as const

// 결과 · 부적이 반대쪽에서 돌아 나오고, 도장이 쿵 찍히고, 버튼이 따라온다.
export const REVEAL = {
  fromDeg: -82,
  cardS: 0.42,
  cardEase: 'back.out(1.2)',
  stampS: 0.26, // 도장은 떨어지는 물건이다. 커진 채 나타나 정으로 내리찍힌다
  stampFrom: 2.1,
  stampEase: 'power3.in',
  thumpY: 2, // 도장이 닿는 순간 카드가 살짝 눌린다
  tailS: 0.32, // 버튼·안내문이 아래에서 따라 올라온다
  tailStaggerS: 0.08,
} as const

export const SPELL = '急急如律令'

// 도장은 다섯 단계. 두 글자 도장은 위아래로 쌓는다 — 화면(.seal span)과 캔버스(drawSeal)가 같은 규칙이다
export const SEAL: Record<string, string> = { great: '大吉', good: '吉', small: '小吉', soso: '平', caution: '注意' }

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
// 종이는 세 가지뿐이다 — 좋음 세 단계는 같은 금색 종이를 쓰고 도장 글자로만 갈린다.
export interface Palette {
  paper: string
  ink: string
  band: string
  bandInk: string
  accent: string
}

export function paletteOf(type: string): Palette {
  if (type === 'caution') {
    return { paper: '#B32B1E', ink: '#F0C93F', band: '#241708', bandInk: '#F0C93F', accent: '#F0C93F' }
  }
  if (type === 'soso') {
    return { paper: '#DDD3B6', ink: '#3A2E18', band: '#3A2E18', bandInk: '#DDD3B6', accent: '#A8321F' }
  }
  return { paper: '#F0C93F', ink: '#241708', band: '#B32B1E', bandInk: '#F0C93F', accent: '#B32B1E' }
}

export const GROUND = '#14302E'
