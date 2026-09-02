// 원본은 unse-knowledge/lucks.json 이다. 이 파일은 사본이므로 손으로 고치지 않는다.
// 운을 고쳤으면 pnpm sync-lucks 로 당겨온다.
import raw from './lucks.json'
import type { Luck, LuckType } from '../types'

const TYPES: readonly string[] = ['great', 'good', 'small', 'soso', 'caution']

function assertLuck(x: unknown, i: number): Luck {
  const o = x as Record<string, unknown>
  if (typeof o?.id !== 'number' || typeof o?.name !== 'string' ||
      typeof o?.prophecy !== 'string' ||
      !Array.isArray(o?.advice) || o.advice.some((a) => typeof a !== 'string') ||
      typeof o?.type !== 'string' || !TYPES.includes(o.type)) {
    throw new Error(`lucks.json ${i}번째 항목의 형태가 맞지 않습니다`)
  }
  return { id: o.id, name: o.name, prophecy: o.prophecy, advice: o.advice as string[], type: o.type as LuckType }
}

export const LUCKS: readonly Luck[] = (raw as unknown[]).map(assertLuck)
