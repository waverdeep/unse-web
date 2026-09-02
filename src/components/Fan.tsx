import { useCallback, useEffect, useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { DEAL, DRAW, FAN, IDLE, SHUFFLE, deckTilt, shadowFor } from '../lib/spec'

gsap.registerPlugin(useGSAP)

interface Props {
  /** 3박자가 끝나는 순간. 몇 번째 장을 집었는지가 결과를 가른다 */
  onDrawn: (index: number) => void
  /** 다시 섞기. 부모가 덱의 순서를 갈아끼운다 — 뒷면이라 갈아끼우는 순간은 보이지 않는다 */
  onShuffle: () => void
  reduced: boolean
}

/**
 * 부적 열한 장. 뒷면이 보이는 채로 덱에서 촤라락 펼쳐진다.
 *
 * 쓸어 넘기는 동안 카드마다 transform 을 초당 수십 번 고쳐야 해서
 * 상태로 관리하지 않고 GSAP 으로 DOM 을 직접 만진다. React 는 카드를 만드는 데까지만 쓴다.
 */
export function Fan({ onDrawn, onShuffle, reduced }: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const cardsRef = useRef<(HTMLButtonElement | null)[]>([])
  const dealTl = useRef<gsap.core.Timeline | null>(null)
  const drawnRef = useRef(false)
  const dealtRef = useRef(false)
  const activeRef = useRef<number | null>(null)
  const lastHoverRef = useRef<number | null | undefined>(undefined)
  const breathRef = useRef<gsap.core.Tween | null>(null)
  const beckonRef = useRef<gsap.core.Tween | null>(null)

  const angle = (i: number) => (i - FAN.mid) * FAN.step

  /** 쉬는 동작을 멈춘다. 갸웃하던 부채는 제자리로 — 기운 채 모으면 덱이 삐뚤어진다 */
  const stopIdle = useCallback(() => {
    breathRef.current?.kill()
    breathRef.current = null
    beckonRef.current?.kill()
    beckonRef.current = null
    if (rootRef.current) gsap.to(rootRef.current, { rotation: 0, duration: 0.25, ease: 'power2.out' })
  }, [])

  /**
   * 펼쳐진 뒤 화면이 죽지 않게 한다. 부채 전체가 아주 천천히 숨을 쉬고,
   * 이따금 아무 장이나 삐죽 올라왔다 내려간다 — 만지라고 부르는 신호.
   * 손이 올라가 있는 동안은 부르지 않는다. 손 아래 장이 곧 신호다.
   */
  const startIdle = useCallback(() => {
    stopIdle()
    const root = rootRef.current
    if (reduced || drawnRef.current || !root) return
    breathRef.current = gsap.to(root, {
      rotation: IDLE.breatheDeg,
      transformOrigin: '50% 100%',
      duration: IDLE.breatheS,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut',
    })
    const later = (s: number) => {
      beckonRef.current = gsap.delayedCall(s, beckon)
    }
    const beckon = () => {
      if (drawnRef.current || !dealtRef.current) return
      if (typeof lastHoverRef.current !== 'number') {
        const cards = cardsRef.current.filter((el): el is HTMLButtonElement => el !== null)
        const el = cards[Math.floor(Math.random() * cards.length)]
        if (el) {
          gsap
            .timeline()
            .to(el, { y: -IDLE.beckonY, duration: IDLE.beckonUpS, ease: 'back.out(2)' })
            .to(el, { y: 0, duration: IDLE.beckonDownS, ease: 'power2.out' }, `+=${IDLE.beckonHoldS}`)
        }
      }
      later(IDLE.beckonEveryS + Math.random() * IDLE.beckonRandS)
    }
    later(IDLE.beckonFirstS)
  }, [reduced, stopIdle])

  useEffect(() => () => stopIdle(), [stopIdle])

  /** 움찔 한 번, 그리고 촤라락. 첫 등장과 다시 섞기가 같은 박자를 쓴다 */
  const unfold = (tl: gsap.core.Timeline, cards: HTMLButtonElement[], at: gsap.Position) =>
    tl
      .to(cards, { y: DEAL.deckY + DEAL.dipY, duration: DEAL.dipS, ease: 'power2.in' }, at)
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
          startIdle()
        },
      })
      dealTl.current = tl

      tl.set(cards, {
        rotation: deckTilt,
        y: DEAL.deckY,
        scale: 0.97,
        boxShadow: shadowFor(0),
      })
      // 펴기 직전 한 번 움찔. 이 다운스윙이 있어야 펼침이 던져진 것처럼 읽힌다
      unfold(tl, cards, DEAL.holdS)
    },
    { scope: rootRef, dependencies: [reduced, startIdle] },
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

  /**
   * 부채가 덱으로 되감겼다가 다시 펼쳐진다.
   * 순서는 모인 사이에 부모가 갈아끼우지만, 뒷면뿐이라 눈에는 섞는 동작만 보인다.
   */
  const shuffle = useCallback(() => {
    if (drawnRef.current || !dealtRef.current) return
    onShuffle()

    const cards = cardsRef.current.filter((el): el is HTMLButtonElement => el !== null)
    if (reduced) return // 움직임 없이 순서만 바뀐다. 피드백은 부모의 토스트가 맡는다

    dealtRef.current = false // 되감기는 동안 쓸기·연타를 막는다. 펼쳐지면 다시 풀린다
    lastHoverRef.current = undefined
    stopIdle()
    gsap.killTweensOf(cards)
    cards.forEach((el, i) => {
      el.style.zIndex = String(i) // 들려 있던 장이 있었다면 쌓임 순서를 되돌린다
    })

    const tl = gsap.timeline({
      defaults: { transformOrigin: FAN.origin },
      onComplete: () => {
        dealtRef.current = true
        startIdle()
      },
    })
    dealTl.current = tl // 되감기 중에 집으면 등장 때처럼 그 자리에서 끊긴다

    tl.to(cards, {
      rotation: deckTilt,
      y: DEAL.deckY,
      scale: 0.97,
      boxShadow: shadowFor(0),
      duration: SHUFFLE.gatherS,
      ease: SHUFFLE.gatherEase,
      stagger: { each: SHUFFLE.gatherStaggerS, from: 'edges' },
    })
    unfold(tl, cards, `>+=${DEAL.holdS}`)
  }, [onShuffle, reduced, startIdle, stopIdle])

  const draw = useCallback(
    (idx: number) => {
      if (drawnRef.current) return
      drawnRef.current = true
      stopIdle()

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
    [onDrawn, reduced, stopIdle],
  )

  return (
    <>
      {/* 부적이 곧 버튼인 화면이라 이 버튼은 목소리를 낮춘다. 부채 밖에 두어 쓸기 판정에 안 걸린다 */}
      <button type="button" className="shuffle" onClick={shuffle}>
        다시 섞기
      </button>
      <div
        ref={rootRef}
        className="fan"
        role="group"
        aria-label="부적 열한 장. 한 장을 눌러 뽑으세요"
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
    </>
  )
}
