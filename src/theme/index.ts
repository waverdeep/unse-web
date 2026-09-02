import type { Theme } from './types'
import { basic } from './basic'
import { newyear } from './newyear'

export type { Theme, Palette } from './types'

// 등록 순서가 우선순위다. 기간이 겹치면 앞의 것이 이긴다
export const THEMES: readonly Theme[] = [basic, newyear]

/** 'MM-DD' 두 개로 된 기간 안에 있는지. 연말을 넘기는 기간(12-24 → 01-02)도 된다 */
export function inSeason(season: NonNullable<Theme['season']>, now: Date): boolean {
  const key = (m: number, d: number) => m * 100 + d
  const today = key(now.getMonth() + 1, now.getDate())
  const [fm, fd] = season.from.split('-').map(Number)
  const [tm, td] = season.to.split('-').map(Number)
  const from = key(fm ?? 1, fd ?? 1)
  const to = key(tm ?? 12, td ?? 31)
  return from <= to ? today >= from && today <= to : today >= from || today <= to
}

/** 오늘 입을 옷. ?theme=<id> 가 있으면 그걸 먼저 본다 — 시즌 전에 미리 확인하는 문 */
export function pickTheme(now: Date, search = ''): Theme {
  const wanted = new URLSearchParams(search).get('theme')
  const forced = wanted && THEMES.find((t) => t.id === wanted)
  if (forced) return forced
  return THEMES.find((t) => t.season && inSeason(t.season, now)) ?? basic
}

/**
 * 테마를 화면에 입힌다. CSS 는 색을 직접 갖지 않고 여기서 심는 변수만 읽는다.
 * <html> 인라인 스타일이라 무엇보다 우선한다.
 */
export function applyTheme(t: Theme, root: HTMLElement = document.documentElement): void {
  const vars: Record<string, string> = {
    '--ground': t.ground.base,
    '--ground-lift': t.ground.lift,
    '--ground-deep': t.ground.deep,
    '--ground-image': t.ground.image ?? 'none',
    '--talis': t.ground.ink,
    '--soot': t.ground.dark,
    '--back-paper': t.back.paper,
    '--back-ring': t.back.ring,
    '--back-pattern': t.back.pattern,
    '--back-seal-paper': t.back.sealPaper,
    '--back-seal-ink': t.back.sealInk,
  }
  for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v)
  root.dataset.theme = t.id

  // 브라우저 주소창 색도 바탕을 따라간다
  document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.setAttribute('content', t.ground.base)
}

/** 이번 방문의 테마. 앱 시작 때 한 번 정해지고 그 뒤로는 바뀌지 않는다 */
export const THEME: Theme = pickTheme(new Date(), typeof location === 'undefined' ? '' : location.search)
