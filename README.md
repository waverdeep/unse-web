# 오늘의운

버튼 한 번에 오늘 나에게 있는 헛소리 운을 하나 알려주는 링크 공유형 밈 사이트.

부적 열일곱 장이 부채꼴로 펼쳐지고, 한 장을 고르면 그것이 오늘의 운이 된다.
한 번 고르면 그날은 잠긴다.

## 돌리기

```bash
pnpm install
pnpm dev          # http://localhost:5173
pnpm build        # 타입체크 + 빌드
pnpm run deploy   # 빌드 후 Cloudflare 배포
```

`deploy` 는 `pnpm run` 을 붙여야 한다. `pnpm deploy` 는 pnpm 내장 워크스페이스 명령이라
이 스크립트가 아니라 엉뚱한 것이 돌아간다.

## 운 100개

`src/data/lucks.json` 은 **사본이다. 손으로 고치지 않는다.**

원본은 이 레포 밖 `unse-knowledge/lucks.json` 에 있다. 기획서와 디자인 시스템도 거기 있다.
운을 고쳤으면 당겨온다.

```bash
pnpm sync-lucks           # 원본 → 사본
pnpm sync-lucks --check   # 다른지만 확인 (빌드가 먼저 돌린다)
```

당겨올 때 스키마·id 연속·이름 중복까지 검사한다.
원본이 옆에 없으면 `--check` 는 조용히 통과하므로 CI 빌드는 사본만으로 돈다.

## 구조

| | |
|---|---|
| `src/lib/spec.ts` | 디자인 시스템 수치를 모은 곳. 화면 코드에 숫자를 흩뿌리지 않는다 |
| `src/lib/seed.ts` | 오늘의 패 열일곱 장과 하루 잠금 |
| `src/lib/brand.ts` | 이름과 도메인. 확정되면 이 두 줄만 바꾼다 |
| `src/components/Fan.tsx` | 부적 열일곱 장과 뽑기 3박자 |
| `src/components/Talisman.tsx` | 결과 부적 |
| `src/lib/cardImage.ts` | 저장용 부적을 캔버스에 다시 그린다 |

## 배포

Cloudflare Workers 정적 자산. 서버 로직이 없어 Worker 코드가 실행되지 않는다.

Git 연동은 대시보드에서 붙인다 (Settings → Builds → Connect).

| 항목 | 값 |
|---|---|
| Root directory | (비움) |
| Build command | `pnpm run build` |
| Deploy command | `pnpm exec wrangler deploy` |

Worker 이름은 `wrangler.jsonc` 의 `name` 과 같아야 한다.

## 아직 안 정한 것

- **도메인** — 정해지면 `src/lib/brand.ts` 의 `DOMAIN` 을 채운다.
  비어 있으면 결과 부적에 주소가 실리지 않아 스크린샷이 돌아도 유입 경로가 없다.
- **OG 이미지** — `index.html` 의 TODO 자리. 링크 미리보기에 부적이 보여야 한다.
