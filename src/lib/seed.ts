import type { Luck } from '../types'

// 하루 고정이 이 제품의 기둥이다.
// 같은 날 새로고침해서 다른 결과가 나오면 "운세"라는 프레임이 즉시 붕괴한다.
//
// 다만 고정되는 것은 "결과"가 아니라 "오늘 당신 앞에 놓인 열일곱 장"이다.
// 그중 무엇을 집을지는 손이 정하고, 한 번 집으면 그날은 잠긴다.

const DEVICE_KEY = 'unse.deviceId'
const DRAWN_KEY = 'unse.drawn'

function readLocal(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null // 사파리 프라이빗 등에서는 접근 자체가 던진다
  }
}

function writeLocal(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    // 저장에 실패해도 이번 화면은 그대로 굴러간다
  }
}

export function deviceId(): string {
  let v = readLocal(DEVICE_KEY)
  if (!v) {
    v = Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
    writeLocal(DEVICE_KEY, v)
  }
  return v
}

export function dateKey(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

export function fnv1a(s: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0
  }
  return h >>> 0
}

/** 시드 하나로 같은 수열을 다시 만들어내는 난수기 */
function seeded(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * 오늘 이 기기 앞에 놓이는 패.
 * 날짜와 기기로만 정해지므로 새로고침해도 같은 열일곱 장이 나온다.
 */
export function todaysDeck(lucks: readonly Luck[], now: Date, size: number): Luck[] {
  const rnd = seeded(fnv1a(`${dateKey(now)}|${deviceId()}`))
  const idx = Array.from({ length: lucks.length }, (_, i) => i)
  const n = Math.min(size, idx.length)
  // 앞에서 n장만 필요하므로 부분 셔플이면 충분하다
  for (let i = 0; i < n; i++) {
    const j = i + Math.floor(rnd() * (idx.length - i))
    const a = idx[i]!
    const b = idx[j]!
    idx[i] = b
    idx[j] = a
  }
  return idx.slice(0, n).map((i) => lucks[i]!)
}

/** 오늘 이미 뽑았다면 그 운의 id. 아직이면 null */
export function readDrawn(now: Date): number | null {
  const raw = readLocal(DRAWN_KEY)
  if (!raw) return null
  try {
    const saved = JSON.parse(raw) as { date?: unknown; id?: unknown }
    if (saved.date === dateKey(now) && typeof saved.id === 'number') return saved.id
  } catch {
    // 남의 손을 탄 값이면 없던 것으로 친다
  }
  return null
}

/** 한 번 집으면 그날은 잠긴다 */
export function writeDrawn(now: Date, id: number): void {
  writeLocal(DRAWN_KEY, JSON.stringify({ date: dateKey(now), id }))
}

const DAYS = ['일', '월', '화', '수', '목', '금', '토'] as const

export function formatDate(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}.${m}.${day} ${DAYS[d.getDay()]}요일`
}

export function serialOf(id: number): string {
  return `제 ${String(id).padStart(3, '0')} 호`
}
