export type LuckType = 'good' | 'bad' | 'ambiguous'

export interface Luck {
  id: number
  name: string
  prophecy: string
  advice: string
  type: LuckType
}

export type Phase = 'intro' | 'result'
