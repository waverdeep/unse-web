// 다섯 단계. 大吉·吉·小吉은 금색 종이, 平은 바랜 종이, 注意는 붉은 종이
export type LuckType = 'great' | 'good' | 'small' | 'soso' | 'caution'

export interface Luck {
  id: number
  name: string
  prophecy: string
  /** 조언 2~3개. 조심 운은 예방·대처가 들어간다 */
  advice: string[]
  type: LuckType
}

export type Phase = 'intro' | 'result'
