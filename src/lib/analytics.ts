/**
 * GA4 이벤트. 스니펫은 index.html 에 있다.
 *
 * 통계는 곁다리다. 광고 차단기로 gtag 가 없거나 실패해도
 * 앱은 아무 일 없던 것처럼 굴러가야 한다.
 */

type Params = Record<string, string | number | boolean>

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

export function track(event: string, params?: Params): void {
  try {
    window.gtag?.('event', event, params)
  } catch {
    // 무시
  }
}
