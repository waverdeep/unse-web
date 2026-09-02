import { forwardRef } from 'react'
import type { Luck } from '../types'
import { BRAND, DOMAIN } from '../lib/brand'
import { LUCKS } from '../data/lucks'
import { SEAL, SPELL, nameSize } from '../lib/spec'
import { formatDate, serialOf } from '../lib/seed'

interface Props {
  luck: Luck
  now: Date
}

/** 부적 한 장. 색이 판정을 대신 말한다. */
export const Talisman = forwardRef<HTMLElement, Props>(function Talisman({ luck, now }, ref) {
  const seal = SEAL[luck.type] ?? '平'
  return (
    <article className="talisman" data-type={luck.type} ref={ref}>
      <div className="t-band">
        <b>{BRAND}</b>
        <span>{serialOf(luck.id)}</span>
      </div>

      <div className="t-body">
        {/* 주문은 머리 장식 한 줄. 정보가 아니라 밀도라 읽히지 않아도 된다 */}
        <div className="t-spell" aria-hidden="true">{SPELL}</div>
        <div className="t-date">{formatDate(now)}</div>
        {/* 카드에서 큰 것은 운 이름 하나뿐이다. 리드 문구 없이 이름이 바로 받는다 */}
        <div className="t-name" style={{ fontSize: `${nameSize(luck.name.length)}px` }}>{luck.name}</div>
        <div className="t-rule" />
        <p className="t-prophecy">{luck.prophecy}</p>
        {/* 조언은 목록이 아니라 말이다. 점 없이 짧은 문단으로 — 줄바꿈이 박자다 */}
        {luck.advice.map((a) => (
          <p className="t-advice" key={a}>{a}</p>
        ))}

        {/* 도장은 흐름 안에 둔다. absolute 로 고정하면 두 줄짜리 조언 위에 얹힌다 */}
        <div className="seal" data-len={seal.length} aria-hidden="true">
          {[...seal].map((ch, i) => (
            <span key={i}>{ch}</span>
          ))}
        </div>

        <div className="t-fine">
          <span>본 운의 효력은 오늘 자정까지입니다.</span>
          <span>{DOMAIN || `${LUCKS.length}종 중 1종`}</span>
        </div>
      </div>
    </article>
  )
})
