export type LuckType = 'good' | 'bad' | 'ambiguous'

export interface Luck {
  id: number
  name: string
  prophecy: string
  /** 조언 2~3개. 나쁜 운은 타개·처방 형태로 쓴다 */
  advice: string[]
  type: LuckType
}

export type Phase = 'intro' | 'result'
