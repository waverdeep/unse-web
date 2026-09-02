import { useCallback, useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { DEAL, DRAW, FAN, shadowFor } from '../lib/spec'

gsap.registerPlugin(useGSAP)

interface Props {
  /** 3박자가 끝나는 순간. 몇 번째 장을 집었는지가 결과를 가른다 */
  onDrawn: (index: number) => void
  reduced: boolean
}

/**
 * 부적 열아홉 장. 뒷면이 보이는 채로 덱에서 촤라락 펼쳐진다.
 *
 * 쓸어 넘기는 동안 카드마다 transform 을 초당 수십 번 고쳐야 해서
 * 상태로 관리하지 않고 GSAP 으로 DOM 을 직접 만진다. React 는 카드를 만드는 데까지만 쓴다.
 */
export function Fan({ onDrawn, reduced }: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const cardsRef = useRef<(HTMLButtonElement | null)[]>([])
  const dealTl = useRef<gsap.core.Timeline | null>(null)
  const drawnRef = useRef(false)
  const dealtRef = useRef(false)
  const activeRef = useRef<number | null>(null)
  const lastHoverRef = useRef<number | null | undefined>(undefined)

  const angle = (i: number) => (i - FAN.mid) * FAN.step

  // 등장 · 덱 → 움찔 → 촤라락. 왼쪽부터 훑고 지나간다.
  // 가운데부터 펴면 좌우가 동시에 움직여 한 덩어리가 벌어지는 것처럼 보인다.
  useGSAP(
    () => {
      const cards = cardsRef.current.filter((el): el is HTMLButtonElement => el !== null)
      cards.forEach((el, i) => {
        el.style.zIndex = String(i)
      })

      if (reduced) {
        gsap.set(cards, {
          rotation: (i: number) => angle(i),
          y: 0,
          transformOrigin: FAN.origin,
          boxShadow: shadowFor(0),
        })
        dealtRef.current = true
        return
      }

      const tl = gsap.timeline({
        defaults: { transformOrigin: FAN.origin },
        onComplete: () => {
          dealtRef.current = true
        },
      })
      dealTl.current = tl

      tl.set(cards, {
        rotation: (i: number) => ((i % 3) - 1) * DEAL.deckJitter,
        y: DEAL.deckY,
        scale: 0.97,
        boxShadow: shadowFor(0),
      })
        // 펴기 직전 한 번 움찔. 이 다운스윙이 있어야 펼침이 던져진 것처럼 읽힌다
        .to(cards, { y: DEAL.deckY + DEAL.dipY, duration: DEAL.dipS, ease: 'power2.in' }, DEAL.holdS)
        .to(
          cards,
          {
            rotation: (i: number) => angle(i),
            y: 0,
            scale: 1,
            duration: DEAL.spreadS,
            ease: DEAL.ease,
            stagger: DEAL.staggerS,
          },
          '>-0.02',
        )
    },
    { scope: rootRef, dependencies: [reduced] },
  )

  /** 카드가 겹쳐 있어 클릭 영역 대신 각 장의 x 중심과의 거리로 판정한다 */
  const nearest = useCallback((x: number) => {
    let best = 0
    let bestDist = Infinity
    cardsRef.current.forEach((el, i) => {
      if (!el) return
      const r = el.getBoundingClientRect()
      const d = Math.abs(x - (r.left + r.width / 2))
      if (d < bestDist) {
        bestDist = d
        best = i
      }
    })
    return best
  }, [])

  /**
   * 물결의 모양은 감쇠 곡선이, 이동은 손이, 잔상은 느린 내리막이 만든다.
   * 손 아래로 들어오는 장은 경쾌하게 솟고, 벗어난 장은 천천히 가라앉는다.
   * 이웃들은 바깥으로 살짝 벌어지며 비켜난다 — 종이 사이를 비집는 질감.
   */
  const hover = useCallback(
    (idx: number | null) => {
      if (drawnRef.current || !dealtRef.current) return
      if (idx === lastHoverRef.current) return // 같은 장 위에서는 다시 겨누지 않는다
      lastHoverRef.current = idx
      cardsRef.current.forEach((el, i) => {
        if (!el) return
        const d = idx === null ? Infinity : Math.abs(i - idx)
        const lift = idx === null ? 0 : Math.max(0, FAN.lift - FAN.falloff * d)
        const away = idx === null ? 0 : Math.sign(i - idx)
        const lean = away * FAN.lean * Math.max(0, 1 - d / FAN.leanSpan)
        // 손가락 아래 장만 맨 위로 올리고 나머지 쌓임 순서는 고정한다. 이웃끼리 순서가 바뀌면 겹침이 흔들린다
        el.style.zIndex = String(i === idx ? 100 : i)
        const rising = lift > -(gsap.getProperty(el, 'y') as number)
        gsap.to(el, {
          y: -lift,
          scale: 1 + FAN.grow * (lift / FAN.lift),
          rotation: angle(i) + lean,
          boxShadow: shadowFor(lift),
          duration: reduced ? 0 : rising ? FAN.riseS : FAN.fallS,
          ease: rising ? FAN.riseEase : FAN.fallEase,
          transformOrigin: FAN.origin,
          overwrite: true,
        })
      })
    },
    [reduced],
  )

  const draw = useCallback(
    (idx: number) => {
      if (drawnRef.current) return
      drawnRef.current = true

      const cards = cardsRef.current
      const pick = cards[idx]
      if (reduced || !pick) {
        onDrawn(idx)
        return
      }

      // 아직 펴는 중이면 그 자리에서 끊고 뽑기로 넘어간다. 성질 급한 손이 이긴다
      dealTl.current?.kill()
      dealtRef.current = true
      const others = cards.filter((el): el is HTMLButtonElement => el !== null && el !== pick)
      gsap.killTweensOf([pick, ...others])

      pick.style.zIndex = '200'
      const tl = gsap.timeline({ defaults: { transformOrigin: FAN.origin } })

      // 1박 · 뽑은 장이 스프레드에서 위로 삭 빠져나온다. 나머지는 물러난다
      tl.to(
        pick,
        {
          rotation: 0,
          y: -DRAW.rise,
          scale: DRAW.riseScale,
          boxShadow: '0 24px 34px rgba(0,0,0,.44), -2px 14px 40px rgba(0,0,0,.26)',
          duration: DRAW.oneS,
          ease: DRAW.riseEase,
        },
        0,
      )
        .to(others, { y: 6, scale: 0.97, opacity: 0.36, duration: DRAW.oneS * 0.8, ease: 'power2.out' }, 0)
        // 2박 · 남은 부채가 가운데로 접히며 사라진다. 바깥 장부터
        .to(
          others,
          {
            rotation: 0,
            y: 12,
            scale: 0.92,
            opacity: 0,
            duration: DRAW.twoS,
            ease: 'power3.in',
            stagger: { each: DRAW.twoStaggerS, from: 'edges' },
          },
          DRAW.oneS * 0.55,
        )
        // 3박 · 뽑은 장이 커지며 돌아누워 선처럼 얇아진다
        .to(
          pick,
          {
            scale: DRAW.flipScale,
            rotationY: DRAW.flipDeg,
            transformPerspective: DRAW.perspective,
            y: -DRAW.rise - 8,
            opacity: 0.65,
            duration: DRAW.threeS,
            ease: 'power2.in',
          },
          '>-0.05',
        )
        .call(() => onDrawn(idx))
    },
    [onDrawn, reduced],
  )

  return (
    <div
      ref={rootRef}
      className="fan"
      role="group"
      aria-label="부적 열아홉 장. 한 장을 고르세요"
      onPointerDown={(e) => {
        if (drawnRef.current) return
        activeRef.current = nearest(e.clientX)
        hover(activeRef.current)
        try {
          e.currentTarget.setPointerCapture(e.pointerId)
        } catch {
          // 캡처가 안 되면 그냥 진행한다
        }
      }}
      onPointerMove={(e) => {
        if (drawnRef.current) return
        if (e.pointerType === 'mouse' && e.buttons === 0) {
          hover(nearest(e.clientX))
          return
        }
        if (activeRef.current === null) return
        activeRef.current = nearest(e.clientX)
        hover(activeRef.current)
      }}
      onPointerLeave={() => {
        if (activeRef.current === null) hover(null)
      }}
      onPointerUp={(e) => {
        if (drawnRef.current) return
        const idx = activeRef.current ?? nearest(e.clientX)
        activeRef.current = null
        draw(idx) // 손을 떼는 순간 확정. 확인 단계 없음
      }}
      onPointerCancel={() => {
        activeRef.current = null
        hover(null)
      }}
    >
      {Array.from({ length: FAN.count }, (_, i) => (
        <button
          key={i}
          type="button"
          className="card"
          aria-label={`부적 ${i + 1}번`}
          ref={(el) => {
            cardsRef.current[i] = el
          }}
          onClick={() => draw(i)}
        >
          {/* 뒷면 문장(紋章). 겹친 장은 왼쪽 테두리 선만 드러나 켜켜이 쌓인 리듬을 만든다 */}
          <i aria-hidden="true">運</i>
        </button>
      ))}
    </div>
  )
}
