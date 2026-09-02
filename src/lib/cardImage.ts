import type { Luck } from '../types'
import { BRAND, DOMAIN } from './brand'
import { GROUND, SEAL, SPELL, nameSize, paletteOf } from './spec'
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
  ctx.rotate((-5 * Math.PI) / 180) // 화면 .seal 의 기울기와 같은 값
  ctx.strokeStyle = color
  ctx.lineWidth = 3
  ctx.strokeRect(-23, -23, 46, 46)
  ctx.fillStyle = color
  ctx.font = `800 22px ${MYEONGJO}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(glyph, 0, 1)
  ctx.restore()
}

async function ensureFonts(nameFont: number): Promise<void> {
  const wanted = [
    `800 ${nameFont}px ${MYEONGJO}`,
    `800 12px ${MYEONGJO}`,
    `700 15.5px ${MYEONGJO}`,
    `700 9px ${MYEONGJO}`,
    `800 22px ${MYEONGJO}`,
    `400 14px ${MYEONGJO}`,
    `500 10px ${PLEX}`,
    `600 10px ${PLEX}`,
  ]
  try {
    // 한자는 별도 서체라 따로 불러야 한다. 안 부르면 캔버스에 네모로 찍힌다
    await Promise.all([
      ...wanted.map((f) => document.fonts.load(f, '가나다')),
      document.fonts.load(`700 22px "Bujeok Hanja"`, '運急如律令吉凶半'),
      document.fonts.load(`700 9px "Bujeok Hanja"`, '急如律令'),
    ])
    await document.fonts.ready
  } catch {
    // 폰트를 못 불러와도 기본 서체로 그린다. 안 그리는 것보다 낫다
  }
}

export async function renderCard(luck: Luck, now: Date): Promise<Blob> {
  const p = paletteOf(luck.type)
  const nameFont = nameSize(luck.name.length)
  await ensureFonts(nameFont)

  const inner = W - PAD * 2
  const measure = document.createElement('canvas').getContext('2d')
  if (!measure) throw new Error('캔버스를 만들지 못했습니다')

  measure.font = `700 15.5px ${MYEONGJO}`
  const prophecy = wrap(measure, luck.prophecy, inner)
  measure.font = `400 14px ${MYEONGJO}`
  const advice = wrap(measure, luck.advice, inner)

  // 세로 배치를 먼저 계산해 카드 높이를 정한다
  const ySpell = BAND + 26
  const yDate = ySpell + 17
  const yLead = yDate + 24
  const yName = yLead + 16
  const yRule = yName + nameFont * 1.06 + 13
  const yProphecy = yRule + 3 + 11
  const yAdvice = yProphecy + prophecy.length * 15.5 * 1.62 + 12
  const ySeal = yAdvice + advice.length * 14 * 1.6 + 14
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
  ctx.fillStyle = GROUND
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
  ctx.fillText(SPELL, cx + 1.5, ySpell)
  ctx.restore()

  ctx.globalAlpha = 0.6
  ctx.fillStyle = p.ink
  ctx.font = `500 9.5px ${PLEX}`
  ctx.fillText(formatDate(now), cx, yDate)

  ctx.globalAlpha = 0.75
  ctx.font = `700 14px ${MYEONGJO}`
  ctx.fillText('오늘 당신에게는', cx, yLead)

  // 카드에서 큰 것은 운 이름 하나뿐이다
  ctx.globalAlpha = 1
  ctx.fillStyle = p.accent
  ctx.font = `800 ${nameFont}px ${MYEONGJO}`
  ctx.fillText(luck.name, cx, yName)

  ctx.globalAlpha = 0.3
  ctx.fillStyle = p.ink
  ctx.fillRect(cx - 22, yRule, 44, 3)

  ctx.globalAlpha = 1
  ctx.font = `700 15.5px ${MYEONGJO}`
  prophecy.forEach((line, i) => ctx.fillText(line, cx, yProphecy + i * 15.5 * 1.62))

  ctx.globalAlpha = 0.85
  ctx.font = `400 14px ${MYEONGJO}`
  advice.forEach((line, i) => ctx.fillText(line, cx, yAdvice + i * 14 * 1.6))
  // 조언을 여는 붉은 점 · 첫 줄 앞에 붙는다
  const firstW = ctx.measureText(advice[0] ?? '').width
  ctx.globalAlpha = 1
  ctx.fillStyle = p.accent
  ctx.beginPath()
  ctx.arc(cx - firstW / 2 - 10, yAdvice + 8, 3, 0, Math.PI * 2)
  ctx.fill()

  drawSeal(ctx, cx, ySeal + 23, SEAL[luck.type] ?? '半', p.accent)

  ctx.globalAlpha = 0.55
  ctx.fillStyle = p.ink
  ctx.fillRect(PAD, yFine, inner, 1)
  ctx.font = `400 9.5px ${PLEX}`
  ctx.textAlign = 'left'
  ctx.fillText('본 부적은 아무런 효력이 없습니다.', PAD, yFine + 8)
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

export type SaveResult = 'shared' | 'downloaded'

/**
 * 저장. iOS 는 <a download> 가 잘 듣지 않아 공유 시트로 넘긴다.
 * 거기서 "이미지 저장"을 고르면 사진첩에 들어간다.
 */
export async function saveCard(luck: Luck, now: Date): Promise<SaveResult> {
  const blob = await renderCard(luck, now)
  const name = fileNameFor(luck, now)
  const file = new File([blob], name, { type: 'image/png' })

  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file] })
    return 'shared'
  }

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return 'downloaded'
}
