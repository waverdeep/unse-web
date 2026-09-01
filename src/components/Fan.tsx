import { useCallback, useEffect, useRef } from 'react'
import { BEAT, FAN, shadowFor } from '../lib/spec'

interface Props {
  /** 3박자가 끝나는 순간. 몇 번째 장을 집었는지가 결과를 가른다 */
  onDrawn: (index: number) => void
  reduced: boolean
}

/**
 * 부적 아홉 장.
 *
 * 쓸어 넘기는 동안 카드마다 transform 을 초당 수십 번 고쳐야 해서
 * 상태로 관리하지 않고 DOM 을 직접 만진다. React 는 카드를 만드는 데까지만 쓴다.
 */
export function Fan({ onDrawn, reduced }: Props) {
  const cardsRef = useRef<(HTMLButtonElement | null)[]>([])
  const drawnRef = useRef(false)
  const activeRef = useRef<number | null>(null)
  const timersRef = useRef<number[]>([])

  const step = () => (window.innerWidth <= 560 ? FAN.stepNarrow : FAN.stepWide)

  const place = useCallback((i: number, lift: number) => {
    const el = cardsRef.current[i]
    if (!el) return
    const scale = (1 + FAN.grow * (lift / FAN.lift)).toFixed(4)
    el.style.transform = `rotate(${(i - FAN.mid) * step()}deg) translateY(${-lift}px) scale(${scale})`
    el.style.boxShadow = shadowFor(lift)
  }, [])

  /** 카드가 겹쳐 있어 클릭 영역 대신 각 장의 x 중심과의 거리로 판정한다 */
  const nearest = useCallback((x: number) => {
    let best: number = FAN.mid
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

  /** 물결은 들림의 크기가 아니라 시차에서 나온다. 동시에 움직이면 한 덩어리가 출렁인다 */
  const hover = useCallback(
    (idx: number | null) => {
      if (drawnRef.current) return
      cardsRef.current.forEach((el, i) => {
        if (!el) return
        const d = idx === null ? FAN.maxWave : Math.abs(i - idx)
        const lift = idx === null ? 0 : Math.max(0, FAN.lift - FAN.falloff * d)
        el.style.transitionDelay = `${Math.min(d, FAN.maxWave) * FAN.wave}ms`
        // 쌓임 순서는 고정하고 들림만 움직인다. 순서를 바꾸면 겹침이 흔들린다
        el.style.zIndex = String(i === idx ? 100 : i)
        place(i, lift)
      })
    },
    [place],
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
      const push = (fn: () => void, ms: number) => timersRef.current.push(window.setTimeout(fn, ms))

      // 1박 · 뽑은 장이 솟아 똑바로 서고 그림자가 깊어진다. 나머지는 물러난다
      pick.style.zIndex = '200'
      pick.style.transition = `transform ${BEAT.one}ms ${BEAT.ease}, box-shadow ${BEAT.one}ms ease`
      pick.style.transitionDelay = '0ms'
      pick.style.transform = `rotate(0deg) translateY(${-BEAT.rise}px) scale(${BEAT.riseScale})`
      pick.style.boxShadow = '0 20px 30px rgba(0,0,0,.42), -2px 12px 34px rgba(0,0,0,.24)'
      cards.forEach((el, i) => {
        if (!el || i === idx) return
        el.style.transition = `transform ${BEAT.one}ms ease, opacity ${BEAT.one}ms ease`
        el.style.transitionDelay = '0ms'
        el.style.opacity = '.42'
      })

      // 2박 · 남은 부채가 가운데로 접히며 사라진다. 바깥 장부터
      push(() => {
        const dur = BEAT.two - BEAT.one
        cards.forEach((el, i) => {
          if (!el || i === idx) return
          const fromOutside = FAN.maxWave - Math.min(Math.abs(i - FAN.mid), FAN.maxWave)
          el.style.transition = `transform ${dur}ms ${BEAT.ease}, opacity ${dur}ms ease`
          el.style.transitionDelay = `${fromOutside * BEAT.twoStagger}ms`
          el.style.transform = 'rotate(0deg) scale(.96)'
          el.style.opacity = '0'
        })
      }, BEAT.one)

      // 3박 · 뽑은 장이 커지며 돌아누워 선처럼 얇아진다
      push(() => {
        const dur = BEAT.three - BEAT.two
        pick.style.transition = `transform ${dur}ms cubic-bezier(.4,0,.7,.2), opacity ${dur}ms ease`
        pick.style.transform =
          `rotate(0deg) translateY(${-BEAT.rise}px) scale(${BEAT.flipScale}) rotateY(${BEAT.flipDeg}deg)`
        pick.style.opacity = '.7'
      }, BEAT.two)

      push(() => onDrawn(idx), BEAT.three)
    },
    [onDrawn, reduced],
  )

  // 펼침 · 가운데부터 바깥으로 시차를 두고 열린다
  useEffect(() => {
    const cards = cardsRef.current
    cards.forEach((el, i) => {
      if (!el) return
      el.style.zIndex = String(i)
      el.style.transform = 'rotate(0deg)'
      el.style.boxShadow = shadowFor(0)
      el.style.transition =
        `transform ${FAN.dealMs}ms ${BEAT.ease}, box-shadow ${FAN.hoverMs}ms ease, opacity ${BEAT.one}ms ease`
      el.style.transitionDelay = `${Math.abs(i - FAN.mid) * FAN.dealStagger}ms`
    })

    if (reduced) {
      cards.forEach((_, i) => place(i, 0))
      return
    }

    let raf2 = 0
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => cards.forEach((_, i) => place(i, 0)))
    })
    // 다 펼쳐지면 쓸어 넘기기용 짧은 전환으로 갈아탄다
    const settle = window.setTimeout(() => {
      cards.forEach((el) => {
        if (!el) return
        el.style.transition =
          `transform ${FAN.hoverMs}ms ${FAN.hoverEase}, box-shadow ${FAN.hoverMs}ms ease, opacity ${BEAT.one}ms ease`
        el.style.transitionDelay = '0ms'
      })
    }, FAN.dealMs + FAN.dealStagger * FAN.mid + 40)

    return () => {
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
      clearTimeout(settle)
    }
  }, [place, reduced])

  // 화면 폭이 바뀌면 각도가 달라진다
  useEffect(() => {
    const onResize = () => {
      if (drawnRef.current) return
      cardsRef.current.forEach((_, i) => place(i, 0))
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [place])

  useEffect(() => {
    const timers = timersRef.current
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <div
      className="fan"
      role="group"
      aria-label="부적 아홉 장. 한 장을 고르세요"
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
          {/* 표식을 위쪽에 둔 것은 회전축이 아래라 펼쳐지면 윗부분이 가장 넓게 드러나기 때문 */}
          <i aria-hidden="true">運</i>
        </button>
      ))}
    </div>
  )
}
