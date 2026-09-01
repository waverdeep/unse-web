#!/usr/bin/env node
/**
 * 운 100개를 원본에서 당겨온다.
 *
 * 원본은 unse-knowledge/lucks.json 이고 이 레포에는 들어오지 않는다.
 * src/data/lucks.json 은 그 사본이므로 손으로 고치지 않는다.
 *
 *   pnpm sync-lucks          원본을 사본에 덮어쓴다
 *   pnpm sync-lucks --check  다른지만 알려주고 고치지 않는다 (종료코드 1)
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const SRC = resolve(here, '../../unse-knowledge/lucks.json')
const DST = resolve(here, '../src/data/lucks.json')
const check = process.argv.includes('--check')

if (!existsSync(SRC)) {
  console.error(`원본을 찾지 못했습니다: ${SRC}`)
  console.error('unse-knowledge 가 옆에 있을 때만 동기화할 수 있습니다.')
  process.exit(check ? 0 : 1) // --check 는 원본이 없으면 조용히 통과한다 (CI)
}

const raw = readFileSync(SRC, 'utf8')
const lucks = JSON.parse(raw)

const KEYS = ['id', 'name', 'prophecy', 'advice', 'type']
const TYPES = new Set(['good', 'bad', 'ambiguous'])
const fail = (msg) => {
  console.error(`원본이 어긋났습니다: ${msg}`)
  process.exit(1)
}

if (!Array.isArray(lucks) || lucks.length === 0) fail('배열이 아니거나 비어 있습니다')
lucks.forEach((x, i) => {
  const keys = Object.keys(x).sort().join(',')
  if (keys !== [...KEYS].sort().join(',')) fail(`${i}번째 항목의 키가 다릅니다 (${keys})`)
  if (x.id !== i + 1) fail(`${i}번째 항목의 id 가 ${x.id} 입니다. 1부터 연속이어야 합니다`)
  if (!TYPES.has(x.type)) fail(`${x.id}번 type 이 ${x.type} 입니다`)
  for (const k of ['name', 'prophecy', 'advice']) {
    if (typeof x[k] !== 'string' || !x[k].trim()) fail(`${x.id}번 ${k} 가 비어 있습니다`)
  }
})
const names = new Set(lucks.map((x) => x.name))
if (names.size !== lucks.length) fail('이름이 중복됩니다')

const current = existsSync(DST) ? readFileSync(DST, 'utf8') : ''
const dist = lucks.reduce((a, x) => ({ ...a, [x.type]: (a[x.type] ?? 0) + 1 }), {})

if (current === raw) {
  console.log(`이미 최신입니다 · ${lucks.length}개 ·`, dist)
  process.exit(0)
}
if (check) {
  console.error('사본이 원본과 다릅니다. pnpm sync-lucks 를 돌리세요.')
  process.exit(1)
}
writeFileSync(DST, raw)
console.log(`동기화했습니다 · ${lucks.length}개 ·`, dist)
