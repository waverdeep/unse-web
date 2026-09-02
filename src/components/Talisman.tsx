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
        <p className="t-lead">오늘 당신에게는</p>
        {/* 카드에서 큰 것은 운 이름 하나뿐이다 */}
        <div className="t-name" style={{ fontSize: `${nameSize(luck.name.length)}px` }}>{luck.name}</div>
        <div className="t-rule" />
        <p className="t-prophecy">{luck.prophecy}</p>
        {luck.advice.map((a) => (
          <p className="t-advice" key={a}>
            <span className="dot" aria-hidden="true" />
            <span>{a}</span>
          </p>
        ))}

        {/* 도장은 흐름 안에 둔다. absolute 로 고정하면 두 줄짜리 조언 위에 얹힌다 */}
        <div className="seal" aria-hidden="true">{SEAL[luck.type] ?? '半'}</div>

        <div className="t-fine">
          <span>본 부적의 효력은 오늘 자정까지입니다.</span>
          <span>{DOMAIN || `${LUCKS.length}종 중 1종`}</span>
        </div>
      </div>
    </article>
  )
})
