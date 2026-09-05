import type { Luck } from '../types'
import { BRAND, DOMAIN } from './brand'
import { SEAL, nameSize } from './spec'
import { THEME, type Theme } from '../theme'
import { formatDate, serialOf } from './seed'

/**
 * 결과 부적을 그림 파일로 그린다.
 *
 * 화면을 그대로 캡처하지 않고 새로 그리는 이유는 두 가지다.
 * 스크린샷은 기기 해상도에 따라 뭉개지고, 무엇보다 주소를 넣을 자리가 없다.
 * 퍼지는 것은 이 그림이므로 여기에 주소가 실려야 루프가 닫힌다.
 *
 * 레이아웃은 화면의 홍패(가운데 정렬 상장)와 같다. 화면 쪽을 고치면 여기도 고친다.
 */

const S = 3 // 인스타·카톡에서 뭉개지지 않을 배율
const W = 360 // 카드 폭 (CSS px)
const M = 34 // 카드 바깥 여백
const BAND = 30
const FRAME = 10 // 상장 틀의 카드 가장자리로부터의 여백
const PAD = 29 // 본문 좌우 여백 (틀 여백 + 테두리 + 안쪽 패딩)

const MYEONGJO = '"Nanum Myeongjo", "Bujeok Hanja", AppleMyungjo, Batang, "Noto Serif KR", serif'
const PLEX = '"IBM Plex Sans KR", sans-serif'

/** 한글은 어절 단위로만 끊는다. CSS 의 word-break: keep-all 과 같은 규칙 */
function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const lines: string[] = []
  let cur = ''
  for (const word of text.split(' ')) {
    const next = cur ? `${cur} ${word}` : word
    if (!cur || ctx.measureText(next).width <= maxW) {
      cur = next
    } else {
      lines.push(cur)
      cur = word
    }
  }
  if (cur) lines.push(cur)
  return lines
}

function drawSeal(ctx: CanvasRenderingContext2D, cx: number, cy: number, glyph: string, color: string) {
  ctx.save()
  ctx.globalAlpha = 0.55
  ctx.translate(cx, cy)
  ctx.strokeStyle = color
  ctx.lineWidth = 3
  ctx.strokeRect(-23, -23, 46, 46)
  ctx.fillStyle = color
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  if (glyph.length === 2) {
    // 두 글자는 위아래로 쌓는다. 화면의 .seal[data-len='2'] 와 같은 크기·간격
    ctx.font = `800 15px ${MYEONGJO}`
    ctx.fillText(glyph[0]!, 0, -7)
    ctx.fillText(glyph[1]!, 0, 9)
  } else {
    ctx.font = `800 22px ${MYEONGJO}`
    ctx.fillText(glyph, 0, 1)
  }
  ctx.restore()
}

async function ensureFonts(nameFont: number): Promise<void> {
  const wanted = [
    `800 ${nameFont}px ${MYEONGJO}`,
    `800 12px ${MYEONGJO}`,
    `700 15.5px ${MYEONGJO}`,
    `700 9px ${MYEONGJO}`,
    `800 22px ${MYEONGJO}`,
    `800 15px ${MYEONGJO}`,
    `400 14px ${MYEONGJO}`,
    `500 10px ${PLEX}`,
    `600 10px ${PLEX}`,
  ]
  try {
    // 한자는 별도 서체라 따로 불러야 한다. 안 부르면 캔버스에 네모로 찍힌다
    await Promise.all([
      ...wanted.map((f) => document.fonts.load(f, '가나다')),
      document.fonts.load(`700 22px "Bujeok Hanja"`, '運急如律令大吉小平注意'),
      document.fonts.load(`700 9px "Bujeok Hanja"`, '急如律令'),
    ])
    await document.fonts.ready
  } catch {
    // 폰트를 못 불러와도 기본 서체로 그린다. 안 그리는 것보다 낫다
  }
}

export async function renderCard(luck: Luck, now: Date, theme: Theme = THEME): Promise<Blob> {
  const p = theme.papers[luck.type]
  const nameFont = nameSize(luck.name.length)
  await ensureFonts(nameFont)

  const inner = W - PAD * 2
  const measure = document.createElement('canvas').getContext('2d')
  if (!measure) throw new Error('캔버스를 만들지 못했습니다')

  measure.font = `700 15.5px ${MYEONGJO}`
  const prophecy = wrap(measure, luck.prophecy, inner)
  measure.font = `400 14px ${MYEONGJO}`
  const advice = luck.advice.map((a) => wrap(measure, a, inner))
  const ADV_LH = 14 * 1.6
  const ADV_GAP = 10 // 문단 사이. 화면의 .t-advice margin-top 과 같다
  const adviceH =
    advice.reduce((s, lines) => s + lines.length * ADV_LH, 0) + (advice.length - 1) * ADV_GAP

  // 세로 배치를 먼저 계산해 카드 높이를 정한다
  const ySpell = BAND + 26
  const yDate = ySpell + 17
  const yName = yDate + 26
  const yRule = yName + nameFont * 1.06 + 15
  const yProphecy = yRule + 3 + 13
  const yAdvice = yProphecy + prophecy.length * 15.5 * 1.62 + 15
  const ySeal = yAdvice + adviceH + 18
  const yFine = ySeal + 46 + 16
  const cardH = yFine + 50

  const canvas = document.createElement('canvas')
  canvas.width = (W + M * 2) * S
  canvas.height = (cardH + M * 2) * S
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('캔버스를 만들지 못했습니다')
  ctx.scale(S, S)
  ctx.textBaseline = 'top'

  // 바탕
  ctx.fillStyle = theme.ground.base
  ctx.fillRect(0, 0, W + M * 2, cardH + M * 2)

  ctx.save()
  ctx.translate(M, M)

  // 종이 · 단단한 그림자 하나. 부적은 빛나지 않는다
  ctx.fillStyle = 'rgba(0,0,0,.32)'
  ctx.fillRect(0, 3, W, cardH)
  ctx.fillStyle = p.paper
  ctx.fillRect(0, 0, W, cardH)

  // 머리띠
  ctx.fillStyle = p.band
  ctx.fillRect(0, 0, W, BAND)
  ctx.fillStyle = p.bandInk
  ctx.textAlign = 'left'
  ctx.font = `800 12px ${MYEONGJO}`
  ctx.fillText(BRAND, 13, 9)
  ctx.textAlign = 'right'
  ctx.font = `600 10px ${PLEX}`
  ctx.fillText(serialOf(luck.id), W - 13, 10)

  // 상장 틀 · 두꺼운 바깥 선과 가는 안쪽 선
  ctx.strokeStyle = p.accent
  ctx.globalAlpha = 0.6
  ctx.lineWidth = 2.5
  ctx.strokeRect(FRAME + 1, BAND + FRAME + 1, W - FRAME * 2 - 2, cardH - BAND - FRAME * 2 - 2)
  ctx.globalAlpha = 0.3
  ctx.lineWidth = 1
  ctx.strokeRect(FRAME + 7, BAND + FRAME + 7, W - FRAME * 2 - 14, cardH - BAND - FRAME * 2 - 14)
  ctx.globalAlpha = 1

  const cx = W / 2
  ctx.textAlign = 'center'

  // 주문 머리 장식 한 줄
  ctx.save()
  ctx.globalAlpha = 0.45
  ctx.fillStyle = p.accent
  ctx.font = `700 9px ${MYEONGJO}`
  try {
    ctx.letterSpacing = '3px' // 미지원 브라우저에서는 그냥 붙여 그린다
  } catch {
    // 무시
  }
  ctx.fillText(theme.spell, cx + 1.5, ySpell)
  ctx.restore()

  ctx.globalAlpha = 0.6
  ctx.fillStyle = p.ink
  ctx.font = `500 9.5px ${PLEX}`
  ctx.fillText(formatDate(now), cx, yDate)

  // 카드에서 큰 것은 운 이름 하나뿐이다
  ctx.globalAlpha = 1
  ctx.fillStyle = p.accent
  ctx.font = `800 ${nameFont}px ${MYEONGJO}`
  ctx.fillText(luck.name, cx, yName)

  ctx.globalAlpha = 0.3
  ctx.fillStyle = p.ink
  ctx.fillRect(cx - 22, yRule, 44, 3)

  // 제목부는 가운데, 읽는 글은 왼끝
  ctx.textAlign = 'left'
  ctx.globalAlpha = 1
  ctx.font = `700 15.5px ${MYEONGJO}`
  prophecy.forEach((line, i) => ctx.fillText(line, PAD, yProphecy + i * 15.5 * 1.62))

  ctx.font = `400 14px ${MYEONGJO}`
  let ay = yAdvice
  // 조언은 점 없는 짧은 문단이다. 화면(.t-advice)과 같은 규칙
  ctx.globalAlpha = 0.78
  ctx.fillStyle = p.ink
  for (const lines of advice) {
    lines.forEach((line, i) => ctx.fillText(line, PAD, ay + i * ADV_LH))
    ay += lines.length * ADV_LH + ADV_GAP
  }
  ctx.globalAlpha = 1

  drawSeal(ctx, W - PAD - 23, ySeal + 23, SEAL[luck.type] ?? '平', p.accent)

  ctx.globalAlpha = 0.55
  ctx.fillStyle = p.ink
  ctx.fillRect(PAD, yFine, inner, 1)
  ctx.font = `400 9.5px ${PLEX}`
  ctx.textAlign = 'left'
  ctx.fillText('본 운의 효력은 오늘 자정까지입니다.', PAD, yFine + 8)
  ctx.textAlign = 'right'
  ctx.fillText(DOMAIN || '100종 중 1종', W - PAD, yFine + 8)

  ctx.restore()

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('그림을 만들지 못했습니다'))), 'image/png')
  })
}

export function fileNameFor(luck: Luck, now: Date): string {
  const d = formatDate(now).slice(0, 10).replace(/\./g, '')
  return `운뽑_${luck.name}_${d}.png`
}

// ── 저장 ──
//
// "저장"이 뜻하는 동작은 기기마다 다르다.
//   iOS          — <a download> 는 사진첩에 안 들어간다. 공유 시트의 "이미지 저장"이 유일한 길이다.
//   안드로이드·PC — <a download> 가 곧 저장이다. 공유 시트를 열면 "저장이 어딨어?"가 된다.
//   인앱 브라우저 — 카톡·인스타 안의 웹뷰는 blob 다운로드를 조용히 삼킨다. 토스트만 뜨고 파일은 없다.
//                  이미지를 화면에 띄워 길게 눌러 저장하게 한다.
// 한 길이 막히면 다음 길로 넘어간다. 스크린샷 안내는 마지막이다.

export type SaveResult =
  | { how: 'shared' }
  | { how: 'downloaded' }
  | { how: 'preview'; url: string } // 화면에 띄워 길게 눌러 저장하게 한다. 닫을 때 URL.revokeObjectURL
  | { how: 'cancelled' } // 공유 시트를 그냥 닫았다. 아무 말도 하지 않는다

const UA = typeof navigator === 'undefined' ? '' : navigator.userAgent

/** iPhone·iPad. 아이패드는 데스크톱 UA 를 쓰므로 터치로 가른다 */
export const IS_IOS =
  /iPhone|iPad|iPod/.test(UA) ||
  (typeof navigator !== 'undefined' && navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

/** 카톡·인스타·페북·라인·네이버 안의 웹뷰. iOS 웹뷰는 UA 에 "Safari/" 가 없다 */
export const IN_APP =
  /KAKAOTALK|Instagram|FBAN|FBAV|FB_IAB|Line\/|NAVER\(inapp|DaumApps|; wv\)/i.test(UA) ||
  (IS_IOS && !/Safari\//.test(UA))

const cache = new Map<string, Promise<Blob>>()

/**
 * 결과 화면이 뜨면 미리 그려 둔다. 누를 때 그리면 폰트 내려받는 사이에
 * 사파리가 손가락을 잊어 (transient activation 만료) 공유 시트가 안 열린다.
 */
export function prepareCard(luck: Luck, now: Date, theme: Theme = THEME): Promise<Blob> {
  const key = `${theme.id}|${luck.id}|${formatDate(now)}`
  let p = cache.get(key)
  if (!p) {
    p = renderCard(luck, now, theme)
    p.catch(() => cache.delete(key)) // 실패한 그림은 다음 누름에 다시 그린다
    cache.set(key, p)
  }
  return p
}

export async function saveCard(luck: Luck, now: Date): Promise<SaveResult> {
  const blob = await prepareCard(luck, now)
  const name = fileNameFor(luck, now)

  if (IS_IOS && typeof File !== 'undefined') {
    const file = new File([blob], name, { type: 'image/png' })
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file] })
        return { how: 'shared' }
      } catch (e) {
        if ((e as Error)?.name === 'AbortError') return { how: 'cancelled' }
        // 손가락을 잊었거나 웹뷰가 막았다. 아래 길로 넘어간다
      }
    }
  }

  const url = URL.createObjectURL(blob)

  if (IS_IOS || IN_APP) return { how: 'preview', url }

  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return { how: 'downloaded' }
}
