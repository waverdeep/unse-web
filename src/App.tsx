import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Fan } from './components/Fan'
import { Talisman } from './components/Talisman'
import { LUCKS } from './data/lucks'
import { BRAND } from './lib/brand'
import { BEAT, FAN, SPELL } from './lib/spec'
import { readDrawn, todaysDeck, writeDrawn } from './lib/seed'
import { useReducedMotion } from './lib/useReducedMotion'
import type { Luck } from './types'

const TOAST_MS = 2600

export function App() {
  const reduced = useReducedMotion()
  const [toast, setToast] = useState('')
  const cardRef = useRef<HTMLElement>(null)
  const toastTimer = useRef<number | undefined>(undefined)

  const now = useMemo(() => new Date(), [])

  // 오늘 이 기기 앞에 놓이는 열세 장. 날짜와 기기로만 정해진다
  const deck = useMemo(() => todaysDeck(LUCKS, now, FAN.count), [now])

  // 무엇을 집을지는 손이 정한다. 한 번 집으면 그날은 잠긴다
  const [luck, setLuck] = useState<Luck | null>(() => {
    const id = readDrawn(now)
    return id === null ? null : (LUCKS.find((l) => l.id === id) ?? null)
  })

  const say = useCallback((msg: string) => {
    setToast(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(''), TOAST_MS)
  }, [])

  useEffect(() => () => clearTimeout(toastTimer.current), [])

  // 결과가 나오면 배경 주문이 카드 뒤로 물러난다
  useEffect(() => {
    document.documentElement.style.setProperty('--spell', luck ? '.020' : '.045')
  }, [luck])

  const drawn = useCallback(
    (index: number) => {
      const picked = deck[index]
      if (!picked) return
      writeDrawn(now, picked.id)
      setLuck(picked)
    },
    [deck, now],
  )

  // 결과 · 반대쪽에서 펼쳐지며 나타난다
  useLayoutEffect(() => {
    const el = cardRef.current
    if (!luck || !el) return
    if (reduced) {
      el.style.opacity = '1'
      return
    }
    el.style.transition = 'none'
    el.style.transform = `rotateY(${BEAT.revealFrom}deg) scale(1.04)`
    el.style.opacity = '0'
    let raf2 = 0
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        el.style.transition =
          `transform ${BEAT.revealMs}ms ${BEAT.ease}, opacity ${BEAT.revealMs}ms ${BEAT.ease}`
        el.style.transform = 'rotateY(0deg) scale(1)'
        el.style.opacity = '1'
      })
    })
    return () => {
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
    }
  }, [luck, reduced])

  const share = useCallback(() => {
    if (!luck) return
    // 받은 사람은 내 결과가 아니라 자기 결과를 받는다. 그래서 링크는 주소 하나뿐이다
    const url = location.origin + location.pathname
    const text = `오늘 나에게 있는 운은 「${luck.name}」입니다.\n당신 것도 뽑아보세요.`
    if (navigator.share) {
      navigator.share({ title: BRAND, text, url }).catch(() => {})
      return
    }
    if (navigator.clipboard?.writeText) {
      navigator.clipboard
        .writeText(`${text}\n${url}`)
        .then(() => say('링크를 복사했습니다. 붙여넣어 보내세요.'))
        .catch(() => say('주소창의 링크를 복사해 보내세요.'))
      return
    }
    say('주소창의 링크를 복사해 보내세요.')
  }, [luck, say])

  return (
    <>
      {/* 시작 화면과 결과 화면이 같은 세계에 있게 만드는 유일한 연결 고리 */}
      <div className="spell" aria-hidden="true">
        {Array.from({ length: 5 }, (_, i) => (
          <i key={i}>{SPELL.repeat(14)}</i>
        ))}
      </div>

      <main className="stage">
        {!luck ? (
          <section>
            <h1 className="intro-title">
              오늘 당신에게
              <br />
              있는 운
            </h1>
            <p className="intro-sub">한 장을 고르세요</p>
            <Fan reduced={reduced} onDrawn={drawn} />
          </section>
        ) : (
          <section>
            <Talisman luck={luck} now={now} ref={cardRef} />
            <div className="btns">
              <button type="button" className="act primary" onClick={share}>
                친구에게 보내기
              </button>
              <button
                type="button"
                className="act"
                onClick={() => say('스크린샷으로 저장하세요. 부적만 잘라내면 됩니다.')}
              >
                캡처해서 자랑하기
              </button>
            </div>
            {/* 오늘은 이미 골랐다. 다시 뽑기를 두면 고른 것이 무의미해진다 */}
            <p className="closed">오늘 몫은 여기까지입니다. 내일 다시 열립니다.</p>
          </section>
        )}
      </main>

      <div className={`toast${toast ? ' on' : ''}`} role="status" aria-live="polite">
        {toast}
      </div>
    </>
  )
}
