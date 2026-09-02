// 카드 뒷면 무늬. 테마는 이 도우미로 CSS background-image 문자열을 만든다.
// 새 무늬가 필요하면 여기 함수를 하나 더 두고 테마에서 고른다 — 화면 CSS 는 손대지 않는다.

/** 옛 책 표지의 능화판 격자. 놀이 카드의 문법이다 */
export function lattice(line: string, gap = 7): string {
  return [
    `repeating-linear-gradient(45deg, ${line} 0 1px, transparent 1px ${gap}px)`,
    `repeating-linear-gradient(-45deg, ${line} 0 1px, transparent 1px ${gap}px)`,
  ].join(', ')
}

/** 점무늬. 간격이 좁으면 천, 넓으면 별밤 */
export function dots(dot: string, gap = 8, size = 1.2): string {
  return `radial-gradient(circle, ${dot} ${size}px, transparent ${size + 0.5}px) 0 0 / ${gap}px ${gap}px`
}

/** 가로줄. 편지지·괘선 */
export function lines(line: string, gap = 6): string {
  return `repeating-linear-gradient(0deg, ${line} 0 1px, transparent 1px ${gap}px)`
}

export const NONE = 'none'
