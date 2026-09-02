import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { Fan } from './components/Fan'
import { Talisman } from './components/Talisman'
import { LUCKS } from './data/lucks'
import { track } from './lib/analytics'
import { saveCard } from './lib/cardImage'
import { DRAW, FAN, REVEAL } from './lib/spec'
import { formatDate, readDrawn, readShuffle, todaysDeck, writeDrawn, writeShuffle } from './lib/seed'
import { useReducedMotion } from './lib/useReducedMotion'
import type { Luck } from './types'

gsap.registerPlugin(useGSAP)

const TOAST_MS = 2600

export function App() {
  const reduced = useReducedMotion()
  const [toast, setToast] = useState('')
  const [saving, setSaving] = useState(false)
  const stageRef = useRef<HTMLElement>(null)
  const cardRef = useRef<HTMLElement>(null)
  const toastTimer = useRef<number | undefined>(undefined)

  const now = useMemo(() => new Date(), [])

  // 오늘 이 기기 앞에 놓이는 열아홉 장. 날짜·기기·오늘 섞은 횟수로만 정해진다
  const [shuffles, setShuffles] = useState(() => readShuffle(now))
  const deck = useMemo(() => todaysDeck(LUCKS, now, FAN.count, shuffles), [now, shuffles])

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

  // 이미 뽑아 놓고 또 들어온 방문. 내일이 궁금해 돌아오는지를 여기서 읽는다
  useEffect(() => {
    const id = readDrawn(now)
    if (id === null) return
    const seen = LUCKS.find((l) => l.id === id)
    track('return_visit', { luck_id: id, luck_name: seen?.name ?? '' })
  }, [now])

  const drawn = useCallback(
    (index: number) => {
      const picked = deck[index]
      if (!picked) return
      writeDrawn(now, picked.id)
      setLuck(picked)
      track('draw', { luck_id: picked.id, luck_name: picked.name, luck_type: picked.type })
    },
    [deck, now],
  )

  // 다시 섞으면 열아홉 장이 통째로 갈린다. 저장해 두어야 새로고침해도 섞은 덱 그대로다
  const reshuffle = useCallback(() => {
    const next = readShuffle(now) + 1
    writeShuffle(now, next)
    setShuffles(next)
    track('reshuffle', { count: next })
    if (reduced) say('덱을 다시 섞었어요!') // 애니메이션이 없는 손에게는 말로 알린다
  }, [now, reduced, say])

  // 결과 · 부적이 반대쪽에서 돌아 나오고, 도장이 쿵 찍히고, 버튼이 따라온다
  useGSAP(
    () => {
      const card = cardRef.current
      if (!luck || !card) return
      if (reduced) {
        gsap.set(card, { opacity: 1 })
        return
      }
      gsap
        .timeline()
        .fromTo(
          card,
          { rotationY: REVEAL.fromDeg, scale: 1.04, opacity: 0, transformPerspective: DRAW.perspective },
          {
            rotationY: 0,
            scale: 1,
            opacity: 1,
            duration: REVEAL.cardS,
            ease: REVEAL.cardEase,
          },
        )
        // 도장은 떨어지는 물건이다. 커진 채 나타나 정으로 내리찍히고, 카드가 살짝 눌린다
        .fromTo(
          '.seal',
          { scale: REVEAL.stampFrom, opacity: 0 },
          { scale: 1, opacity: 0.55, duration: REVEAL.stampS, ease: REVEAL.stampEase },
          '-=0.06',
        )
        .to(card, { y: REVEAL.thumpY, duration: 0.06, yoyo: true, repeat: 1, ease: 'power1.inOut' })
        .fromTo(
          ['.btns', '.closed'],
          { y: 14, opacity: 0 },
          { y: 0, opacity: 1, duration: REVEAL.tailS, stagger: REVEAL.tailStaggerS, ease: 'power2.out' },
          '-=0.04',
        )
    },
    { scope: stageRef, dependencies: [luck, reduced] },
  )

  const share = useCallback(() => {
    if (!luck) return
    // 받은 사람은 내 결과가 아니라 자기 결과를 받는다. 그래서 링크는 주소 하나뿐이다
    const url = location.origin + location.pathname
    // 카톡은 url 필드를 본문 앞에 공백 없이 이어붙여 링크가 뭉개진다. 주소는 본문 마지막 줄에 직접 넣는다
    const text = `오늘 내 운은 「${luck.name}」이래.\n너는 뭐 나오나 봐봐.\n\n${url}`
    if (navigator.share) {
      navigator.share({ text })
        .then(() => track('share', { method: 'sheet', luck_name: luck.name }))
        .catch(() => {})
      return
    }
    if (navigator.clipboard?.writeText) {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          track('share', { method: 'clipboard', luck_name: luck.name })
          say('링크 복사 완료! 아무 데나 붙여넣어 보내세요.')
        })
        .catch(() => say('주소창의 링크를 복사해서 보내주세요.'))
      return
    }
    say('주소창의 링크를 복사해서 보내주세요.')
  }, [luck, say])

  const save = useCallback(async () => {
    if (!luck || saving) return
    setSaving(true)
    try {
      const how = await saveCard(luck, now)
      track('save_card', { method: how, luck_name: luck.name })
      if (how === 'downloaded') say('부적이 저장됐어요!')
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') return // 공유 시트를 그냥 닫은 경우
      say('저장이 안 됐어요. 스크린샷으로 남겨주세요!')
    } finally {
      setSaving(false)
    }
  }, [luck, now, say, saving])

  return (
    <>
      <main className="stage" ref={stageRef}>
        {!luck ? (
          <section className="intro">
            <div className="intro-date">{formatDate(now)}</div>
            <h1 className="intro-title">
              오늘 당신에게
              <br />
              있는 운
            </h1>
            <p className="intro-sub">끌리는 한 장을 골라보세요</p>
            <Fan reduced={reduced} onDrawn={drawn} onShuffle={reshuffle} />
          </section>
        ) : (
          <section className="result">
            <Talisman luck={luck} now={now} ref={cardRef} />
            <div className="btns">
              <button type="button" className="act primary" onClick={share}>
                친구에게 보내기
              </button>
              <button type="button" className="act" onClick={save} disabled={saving}>
                {saving ? '부적 그리는 중…' : '부적 저장하기'}
              </button>
            </div>
            {/* 오늘은 이미 골랐다. 다시 뽑기를 두면 고른 것이 무의미해진다 */}
            <p className="closed">오늘 운은 여기까지! 내일 새로 뽑을 수 있어요.</p>
          </section>
        )}
      </main>

      <div className={`toast${toast ? ' on' : ''}`} role="status" aria-live="polite">
        {toast}
      </div>
    </>
  )
}
