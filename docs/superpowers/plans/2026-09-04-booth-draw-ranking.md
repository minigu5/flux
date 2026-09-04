# 부스 랜덤 뽑기 · 랭킹 앱 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 아이패드 전체화면에서 동작하는 단일 페이지 앱을 만든다. 슬롯머신 연출로 문구류 10종 중 하나를 뽑고, 참가자 랭킹을 기록한다.

**Architecture:** Next.js App Router의 단일 클라이언트 페이지다. 서버 로직과 API 라우트가 없고, 상태는 전부 `localStorage`에 있다. 순수 로직(뽑기 규칙, 저장, 정렬)은 `lib/`에 두고 Vitest로 검증한다. UI는 `components/`의 작은 컴포넌트로 쪼개며, 슬롯머신 애니메이션만 `requestAnimationFrame`으로 직접 제어한다.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript, Vitest + jsdom, 순수 CSS(전역 스타일시트 + CSS 변수). 런타임 의존성 추가 없음.

**Spec:** `docs/superpowers/specs/2026-09-04-booth-draw-ranking-design.md`

## Global Constraints

- Next.js 15 App Router. `app/` 디렉터리를 쓰고 Pages Router는 쓰지 않는다.
- 서버 컴포넌트에서 상태를 다루지 않는다. 상태를 쓰는 컴포넌트는 `'use client'`로 시작한다.
- 런타임 의존성은 `next`, `react`, `react-dom`뿐이다. 애니메이션·상태 관리·아이콘 라이브러리를 추가하지 않는다.
- 이모지를 UI에 쓰지 않는다. 사용자가 명시적으로 거부했다.
- 물품 아이콘은 외부 CDN 링크(`https://api.iconify.design/streamline-freehand-color/<name>.svg`)를 우선 사용하고, 로딩 실패 시 인라인 SVG로 대체한다.
- 아이콘 팔레트는 선 `#020202`, 액센트 `#0c6fff`, `viewBox="0 0 24 24"`로 통일한다.
- `localStorage` 키는 `flux.playerCount`, `flux.counts`, `flux.ranking` 세 개만 쓴다.
- 뽑기 카운트는 슬롯별로 독립이다. 슬롯 간에 공유하지 않는다.
- 슬롯머신 총 길이는 1700ms다. 등속 1100ms + 감속 600ms.
- 인원수 범위는 1~5다.
- 랭킹 개수 범위는 0~10 정수다.
- 터치 대상은 최소 44px × 44px이다.

---

### Task 1: 프로젝트 스캐폴드와 테스트 환경

Next.js 프로젝트를 만들고 Vitest를 붙인다. 이후 모든 태스크가 이 위에서 돈다.

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.mjs`, `vitest.config.ts`, `.gitignore`
- Create: `app/layout.tsx`, `app/page.tsx`, `app/globals.css`
- Test: `lib/__tests__/smoke.test.ts`

**Interfaces:**
- Consumes: 없음
- Produces: `npm test`(Vitest), `npm run build`(Next.js 프로덕션 빌드), `npm run dev`

- [ ] **Step 1: 프로젝트 파일 생성**

`package.json`:

```json
{
  "name": "flux",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "next": "^15.1.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/node": "^22.10.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "jsdom": "^25.0.1",
    "typescript": "^5.7.0",
    "vitest": "^2.1.8"
  }
}
```

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "ES2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

`next.config.mjs`:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {};

export default nextConfig;
```

`vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['lib/**/*.test.ts'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
});
```

`.gitignore`:

```
node_modules
.next
out
.env*.local
.vercel
*.tsbuildinfo
next-env.d.ts
```

- [ ] **Step 2: 최소 레이아웃과 페이지 작성**

`app/layout.tsx` — 아이패드 전체화면 대응 메타를 여기서 전부 건다.

```tsx
import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '랜덤 뽑기',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: '랜덤 뽑기' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0b0d12',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
```

`app/page.tsx` — Task 10에서 채운다. 지금은 빌드가 통과할 최소 형태다.

```tsx
export default function Page() {
  return <main />;
}
```

`app/globals.css` — 리셋과 토큰만 넣는다. 컴포넌트 스타일은 각 태스크에서 덧붙인다.

```css
:root {
  --bg: #0b0d12;
  --surface: #151922;
  --surface-2: #1d2330;
  --line: #2a3242;
  --text: #eef2f8;
  --text-dim: #8a94a6;
  --accent: #0c6fff;
  --gold: #ffc53d;
  --silver: #c7d0dd;
  --bronze: #d08a4e;
  --radius: 20px;
  --safe-t: env(safe-area-inset-top, 0px);
  --safe-b: env(safe-area-inset-bottom, 0px);
  --safe-l: env(safe-area-inset-left, 0px);
  --safe-r: env(safe-area-inset-right, 0px);
}

* { margin: 0; padding: 0; box-sizing: border-box; }

html, body {
  height: 100%;
  overscroll-behavior: none;
}

body {
  background: var(--bg);
  color: var(--text);
  font-family: -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Pretendard', system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
  -webkit-user-select: none;
  touch-action: manipulation;
}

button { font: inherit; color: inherit; background: none; border: none; cursor: pointer; }
input { font: inherit; color: inherit; }
```

- [ ] **Step 3: 스모크 테스트 작성**

`lib/__tests__/smoke.test.ts`:

```ts
import { describe, it, expect } from 'vitest';

describe('테스트 환경', () => {
  it('jsdom 환경에서 window가 존재한다', () => {
    expect(typeof window).toBe('object');
  });
});
```

- [ ] **Step 4: 설치하고 테스트 실행**

Run: `npm install && npm test`
Expected: PASS, 테스트 1개 통과

- [ ] **Step 5: 빌드 확인**

Run: `npm run build`
Expected: 빌드 성공

- [ ] **Step 6: 커밋**

```bash
git add -A
git commit -m "chore: scaffold Next.js app with Vitest"
```

---

### Task 2: 물품 정의

10종 물품을 정의한다. 7종은 Iconify CDN 링크를 쓰고, 아이콘 세트에 없는 안경집·이클립스 통·샤프심 통은 같은 화풍의 인라인 SVG로 그린다. 모든 물품에 폴백 SVG가 있어야 CDN 실패 시에도 화면이 비지 않는다.

**Files:**
- Create: `lib/items.ts`
- Test: `lib/items.test.ts`

**Interfaces:**
- Consumes: 없음
- Produces:
  - `type Item = { id: string; name: string; imageUrl: string | null; svg: string }`
  - `const ITEMS: readonly Item[]` — 길이 10
  - `const ITEM_COUNT: number` — 10

- [ ] **Step 1: 실패하는 테스트 작성**

`lib/items.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { ITEMS, ITEM_COUNT } from './items';

describe('ITEMS', () => {
  it('정확히 10종이다', () => {
    expect(ITEMS).toHaveLength(10);
    expect(ITEM_COUNT).toBe(10);
  });

  it('id가 모두 고유하다', () => {
    const ids = ITEMS.map((i) => i.id);
    expect(new Set(ids).size).toBe(10);
  });

  it('모든 물품에 한글 이름이 있다', () => {
    for (const item of ITEMS) {
      expect(item.name.length).toBeGreaterThan(0);
    }
  });

  it('모든 물품에 폴백 SVG가 있고 viewBox가 24 기준이다', () => {
    for (const item of ITEMS) {
      expect(item.svg).toContain('viewBox="0 0 24 24"');
    }
  });

  it('CDN URL이 있는 물품은 iconify streamline-freehand-color를 가리킨다', () => {
    for (const item of ITEMS) {
      if (item.imageUrl !== null) {
        expect(item.imageUrl).toMatch(
          /^https:\/\/api\.iconify\.design\/streamline-freehand-color\/[a-z0-9-]+\.svg/,
        );
      }
    }
  });

  it('명세에 적힌 10종 이름을 모두 포함한다', () => {
    const names = ITEMS.map((i) => i.name);
    expect(names).toEqual([
      '가위', '풀', '자', '책자', '지우개',
      '연필', '공학용계산기', '안경집', '이클립스 통', '샤프심 통',
    ]);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run lib/items.test.ts`
Expected: FAIL — `Failed to resolve import "./items"`

- [ ] **Step 3: 구현**

`lib/items.ts`를 만든다. 구조는 다음과 같다.

```ts
export type Item = {
  id: string;
  name: string;
  /** Iconify CDN 링크. 세트에 없는 물품은 null이고 인라인 SVG만 쓴다. */
  imageUrl: string | null;
  /** CDN 실패 시 대체할 인라인 SVG 마크업. */
  svg: string;
};

const CDN = 'https://api.iconify.design/streamline-freehand-color';
const cdn = (name: string) => `${CDN}/${name}.svg?height=320`;
```

CDN 이름 매핑은 다음 표를 그대로 쓴다. 이 이름들은 실제로 200을 반환하는 것을 확인했다.

| 물품 | Iconify 아이콘 이름 |
|------|--------------------|
| 가위 | `copy-paste-cut-scissors` |
| 풀 | `design-tool-liquid-glue` |
| 자 | `ruler-t` |
| 책자 | `notes-book` |
| 지우개 | `text-formating-eraser-2` |
| 연필 | `edit-pencil` |
| 공학용계산기 | `accounting-calculator` |
| 안경집 | 없음 (`null`) |
| 이클립스 통 | 없음 (`null`) |
| 샤프심 통 | 없음 (`null`) |

폴백 SVG는 열 개 모두 직접 작성한다. 공통 규격은 다음과 같다.

- 루트는 `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">`
- 선은 `stroke="#020202"`, `stroke-width="1.3"`, `stroke-linecap="round"`, `stroke-linejoin="round"`
- 강조 요소 하나에만 `stroke="#0c6fff"`를 쓴다
- 좌표는 소수점 한 자리까지만 쓴다

예시 — 샤프심 통(둥근 모서리 사각 통 + 뚜껑 + 심 몇 가닥):

```ts
const LEAD_CASE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#020202" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M8.4 6.2h7.3c.5 0 .9.4.9.9v13c0 .5-.4.9-.9.9H8.3c-.5 0-.9-.4-.9-.9V7.1c0-.5.4-.9 1-.9Z"/><path d="M8.9 6.2V4.3c0-.6.4-1 1-1h4.2c.6 0 1 .4 1 1v1.9"/><path stroke="#0c6fff" d="M10.4 9.6v8.1M12.1 9.4v8.3M13.8 9.7v7.9"/></svg>`;
```

나머지 아홉 개도 같은 방식으로 작성한다. 각 물품의 형태 지침:

- **가위**: 교차하는 두 날 + 아래쪽 원형 손잡이 두 개(손잡이를 파란색으로)
- **풀**: 몸통이 둥근 병 + 뾰족한 노즐 + 노즐 아래 파란 물방울 하나
- **자**: 길쭉한 직사각형을 살짝 기울이고, 한쪽 긴 변에 눈금 다섯 개(눈금을 파란색으로)
- **책자**: 세로 직사각형 표지 + 왼쪽 세로 스프링 세 개 + 표지 중앙 파란 라벨 사각형
- **지우개**: 기울어진 육면체 앞면과 윗면 + 아래에 파란 지워지는 자국 선 하나
- **연필**: 기울어진 몸통 + 아래쪽 뾰족한 촉 + 위쪽 파란 지우개 캡
- **공학용계산기**: 세로 직사각형 본체 + 위쪽 파란 액정 사각형 + 3×4 버튼 격자
- **안경집**: 가로로 긴 조개 모양 케이스 + 위쪽 뚜껑 이음선 + 파란 걸쇠
- **이클립스 통**: 위아래가 둥근 원통 + 상단 뚜껑선 + 가운데 파란 띠 라벨

`ITEMS` 배열은 명세 순서를 지킨다. `ITEM_COUNT`는 `ITEMS.length`로 파생한다.

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run lib/items.test.ts`
Expected: PASS, 6개 통과

- [ ] **Step 5: CDN 링크 실제 응답 확인**

Run:

```bash
node -e "
const {ITEMS} = require('./lib/items.ts');
" 2>/dev/null || for n in copy-paste-cut-scissors design-tool-liquid-glue ruler-t notes-book text-formating-eraser-2 edit-pencil accounting-calculator; do
  echo \"$(curl -s -o /dev/null -w '%{http_code}' https://api.iconify.design/streamline-freehand-color/$n.svg) $n\";
done
```

Expected: 7줄 모두 `200`

- [ ] **Step 6: 커밋**

```bash
git add lib/items.ts lib/items.test.ts
git commit -m "feat: define 10 booth items with CDN icons and SVG fallbacks"
```

---

### Task 3: 뽑기 규칙

명세 5절의 규칙을 순수 함수로 구현한다. 난수를 주입받아 테스트에서 결과를 고정한다.

**Files:**
- Create: `lib/draw.ts`
- Test: `lib/draw.test.ts`

**Interfaces:**
- Consumes: `ITEMS`, `ITEM_COUNT` from `lib/items.ts`
- Produces:
  - `type Counts = Record<string, number>`
  - `function pickTwo(random: () => number): [string, string]` — 서로 다른 물품 id 두 개
  - `function drawItem(counts: Counts, random?: () => number): string` — 뽑힌 물품 id
  - `function bumpCount(counts: Counts, itemId: string): Counts` — 새 객체를 반환한다

- [ ] **Step 1: 실패하는 테스트 작성**

`lib/draw.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { pickTwo, drawItem, bumpCount, type Counts } from './draw';
import { ITEMS } from './items';

/** 미리 정한 값을 순서대로 돌려주는 가짜 난수 생성기. */
function seq(...values: number[]) {
  let i = 0;
  return () => values[i++ % values.length];
}

describe('pickTwo', () => {
  it('서로 다른 두 물품 id를 돌려준다', () => {
    const [a, b] = pickTwo(seq(0, 0));
    expect(a).not.toBe(b);
  });

  it('돌려준 id는 모두 실제 물품이다', () => {
    const ids = new Set(ITEMS.map((i) => i.id));
    for (let n = 0; n < 200; n++) {
      const [a, b] = pickTwo(Math.random);
      expect(ids.has(a)).toBe(true);
      expect(ids.has(b)).toBe(true);
    }
  });
});

describe('drawItem', () => {
  it('두 후보 중 카운트가 적은 쪽을 고른다', () => {
    const first = ITEMS[0].id;
    const second = ITEMS[1].id;
    const counts: Counts = { [first]: 5, [second]: 1 };
    // seq(0, 0) 이면 pickTwo가 0번과 1번 물품을 고른다.
    expect(drawItem(counts, seq(0, 0))).toBe(second);
  });

  it('반대로 두 번째 후보가 더 많으면 첫 번째를 고른다', () => {
    const first = ITEMS[0].id;
    const second = ITEMS[1].id;
    const counts: Counts = { [first]: 0, [second]: 3 };
    expect(drawItem(counts, seq(0, 0))).toBe(first);
  });

  it('기록에 없는 물품은 카운트 0으로 본다', () => {
    const first = ITEMS[0].id;
    const second = ITEMS[1].id;
    const counts: Counts = { [first]: 4 };
    expect(drawItem(counts, seq(0, 0))).toBe(second);
  });

  it('카운트가 같으면 두 후보 중 하나를 돌려준다', () => {
    const first = ITEMS[0].id;
    const second = ITEMS[1].id;
    const picked = drawItem({ [first]: 2, [second]: 2 }, seq(0, 0, 0));
    expect([first, second]).toContain(picked);
  });

  it('200번 반복하면 분포가 고르게 수렴한다', () => {
    let counts: Counts = {};
    for (let n = 0; n < 200; n++) {
      counts = bumpCount(counts, drawItem(counts));
    }
    const values = ITEMS.map((i) => counts[i.id] ?? 0);
    const min = Math.min(...values);
    const max = Math.max(...values);
    // 균등이면 각 20회다. 편차가 8을 넘으면 규칙이 동작하지 않는 것이다.
    expect(max - min).toBeLessThanOrEqual(8);
  });
});

describe('bumpCount', () => {
  it('해당 물품의 카운트를 1 올린다', () => {
    expect(bumpCount({ a: 2 }, 'a')).toEqual({ a: 3 });
  });

  it('없던 물품은 1로 시작한다', () => {
    expect(bumpCount({}, 'a')).toEqual({ a: 1 });
  });

  it('원본 객체를 변경하지 않는다', () => {
    const original: Counts = { a: 1 };
    bumpCount(original, 'a');
    expect(original).toEqual({ a: 1 });
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run lib/draw.test.ts`
Expected: FAIL — `Failed to resolve import "./draw"`

- [ ] **Step 3: 구현**

`lib/draw.ts`:

```ts
import { ITEMS } from './items';

export type Counts = Record<string, number>;

/** 10개 물품 중 서로 다른 두 개를 무작위로 고른다. */
export function pickTwo(random: () => number): [string, string] {
  const first = Math.floor(random() * ITEMS.length) % ITEMS.length;
  // 남은 9개 중에서 고른 뒤 첫 번째 인덱스를 건너뛰도록 보정한다.
  const offset = Math.floor(random() * (ITEMS.length - 1)) % (ITEMS.length - 1);
  const second = (first + 1 + offset) % ITEMS.length;
  return [ITEMS[first].id, ITEMS[second].id];
}

/**
 * 두 후보 중 지금까지 적게 나온 쪽을 고른다.
 * 카운트가 같으면 둘 중 하나를 무작위로 고른다.
 */
export function drawItem(counts: Counts, random: () => number = Math.random): string {
  const [a, b] = pickTwo(random);
  const countA = counts[a] ?? 0;
  const countB = counts[b] ?? 0;
  if (countA < countB) return a;
  if (countB < countA) return b;
  return random() < 0.5 ? a : b;
}

/** 카운트를 1 올린 새 객체를 돌려준다. 원본은 건드리지 않는다. */
export function bumpCount(counts: Counts, itemId: string): Counts {
  return { ...counts, [itemId]: (counts[itemId] ?? 0) + 1 };
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run lib/draw.test.ts`
Expected: PASS, 9개 통과

- [ ] **Step 5: 커밋**

```bash
git add lib/draw.ts lib/draw.test.ts
git commit -m "feat: add balanced draw rule with injectable randomness"
```

---

### Task 4: localStorage 저장 계층

읽기·쓰기 실패를 전부 흡수한다. 사파리 프라이빗 모드나 깨진 JSON에서도 앱이 죽으면 안 된다.

**Files:**
- Create: `lib/storage.ts`
- Test: `lib/storage.test.ts`

**Interfaces:**
- Consumes: 없음
- Produces:
  - `const STORAGE_KEYS = { playerCount: 'flux.playerCount', counts: 'flux.counts', ranking: 'flux.ranking' }`
  - `function loadJSON<T>(key: string, fallback: T): T`
  - `function saveJSON(key: string, value: unknown): void`

- [ ] **Step 1: 실패하는 테스트 작성**

`lib/storage.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { loadJSON, saveJSON, STORAGE_KEYS } from './storage';

beforeEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('STORAGE_KEYS', () => {
  it('명세에 적힌 세 개의 키를 쓴다', () => {
    expect(STORAGE_KEYS).toEqual({
      playerCount: 'flux.playerCount',
      counts: 'flux.counts',
      ranking: 'flux.ranking',
    });
  });
});

describe('saveJSON / loadJSON', () => {
  it('저장한 값을 그대로 읽는다', () => {
    saveJSON('k', { a: 1 });
    expect(loadJSON('k', null)).toEqual({ a: 1 });
  });

  it('없는 키는 기본값을 돌려준다', () => {
    expect(loadJSON('missing', 42)).toBe(42);
  });

  it('깨진 JSON이면 기본값을 돌려준다', () => {
    window.localStorage.setItem('broken', '{not json');
    expect(loadJSON('broken', 'default')).toBe('default');
  });

  it('읽기가 예외를 던져도 기본값을 돌려준다', () => {
    vi.spyOn(window.localStorage.__proto__, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    expect(loadJSON('k', 'default')).toBe('default');
  });

  it('쓰기가 예외를 던져도 앱이 죽지 않는다', () => {
    vi.spyOn(window.localStorage.__proto__, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded');
    });
    expect(() => saveJSON('k', { a: 1 })).not.toThrow();
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run lib/storage.test.ts`
Expected: FAIL — `Failed to resolve import "./storage"`

- [ ] **Step 3: 구현**

`lib/storage.ts`:

```ts
export const STORAGE_KEYS = {
  playerCount: 'flux.playerCount',
  counts: 'flux.counts',
  ranking: 'flux.ranking',
} as const;

/**
 * localStorage에서 JSON을 읽는다.
 * 서버 렌더링 시점, 접근 거부, 깨진 JSON을 모두 기본값으로 흡수한다.
 */
export function loadJSON<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/** localStorage에 JSON을 쓴다. 실패하면 조용히 넘어간다. */
export function saveJSON(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 저장 불가 환경에서는 메모리 상태로만 동작한다.
  }
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run lib/storage.test.ts`
Expected: PASS, 6개 통과

- [ ] **Step 5: 커밋**

```bash
git add lib/storage.ts lib/storage.test.ts
git commit -m "feat: add fault-tolerant localStorage layer"
```

---

### Task 5: 랭킹 도메인 로직

정렬과 시각 포맷을 UI에서 분리해 테스트 가능하게 만든다.

**Files:**
- Create: `lib/ranking.ts`
- Test: `lib/ranking.test.ts`

**Interfaces:**
- Consumes: 없음
- Produces:
  - `type RankingEntry = { id: string; name: string; count: number; createdAt: number }`
  - `function sortRanking(entries: RankingEntry[]): RankingEntry[]`
  - `function formatTime(epochMs: number): string` — `HH:MM`
  - `function createEntry(name: string, count: number, now?: number): RankingEntry`
  - `const MAX_COUNT = 10`

- [ ] **Step 1: 실패하는 테스트 작성**

`lib/ranking.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { sortRanking, formatTime, createEntry, MAX_COUNT, type RankingEntry } from './ranking';

const entry = (name: string, count: number, createdAt: number): RankingEntry => ({
  id: name,
  name,
  count,
  createdAt,
});

describe('sortRanking', () => {
  it('개수 내림차순으로 정렬한다', () => {
    const sorted = sortRanking([entry('a', 2, 1), entry('b', 7, 2), entry('c', 5, 3)]);
    expect(sorted.map((e) => e.name)).toEqual(['b', 'c', 'a']);
  });

  it('개수가 같으면 먼저 등록한 항목이 위로 간다', () => {
    const sorted = sortRanking([entry('late', 3, 200), entry('early', 3, 100)]);
    expect(sorted.map((e) => e.name)).toEqual(['early', 'late']);
  });

  it('원본 배열을 변경하지 않는다', () => {
    const input = [entry('a', 1, 1), entry('b', 9, 2)];
    sortRanking(input);
    expect(input.map((e) => e.name)).toEqual(['a', 'b']);
  });
});

describe('formatTime', () => {
  it('HH:MM 형식으로 만든다', () => {
    const t = new Date(2026, 8, 4, 9, 5).getTime();
    expect(formatTime(t)).toBe('09:05');
  });

  it('오후 시각도 24시간제로 만든다', () => {
    const t = new Date(2026, 8, 4, 18, 42).getTime();
    expect(formatTime(t)).toBe('18:42');
  });
});

describe('createEntry', () => {
  it('이름 앞뒤 공백을 지운다', () => {
    expect(createEntry('  민수  ', 3, 1000).name).toBe('민수');
  });

  it('주어진 시각을 createdAt으로 쓴다', () => {
    expect(createEntry('민수', 3, 1000).createdAt).toBe(1000);
  });

  it('개수를 0~10 범위로 자른다', () => {
    expect(createEntry('a', 99, 1).count).toBe(MAX_COUNT);
    expect(createEntry('a', -5, 1).count).toBe(0);
  });

  it('항목마다 다른 id를 만든다', () => {
    expect(createEntry('a', 1, 1).id).not.toBe(createEntry('a', 1, 1).id);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run lib/ranking.test.ts`
Expected: FAIL — `Failed to resolve import "./ranking"`

- [ ] **Step 3: 구현**

`lib/ranking.ts`:

```ts
export type RankingEntry = {
  id: string;
  name: string;
  count: number;
  createdAt: number;
};

export const MAX_COUNT = 10;

/** 개수 내림차순, 동점이면 먼저 등록한 항목이 위로 간다. */
export function sortRanking(entries: RankingEntry[]): RankingEntry[] {
  return [...entries].sort((a, b) => b.count - a.count || a.createdAt - b.createdAt);
}

/** epoch 밀리초를 HH:MM으로 만든다. */
export function formatTime(epochMs: number): string {
  const d = new Date(epochMs);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function createEntry(name: string, count: number, now: number = Date.now()): RankingEntry {
  return {
    id: newId(),
    name: name.trim(),
    count: Math.min(MAX_COUNT, Math.max(0, Math.round(count))),
    createdAt: now,
  };
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run lib/ranking.test.ts`
Expected: PASS, 9개 통과

- [ ] **Step 5: 커밋**

```bash
git add lib/ranking.ts lib/ranking.test.ts
git commit -m "feat: add ranking sort, time format, and entry factory"
```

---

### Task 6: 물품 이미지 컴포넌트

CDN 이미지를 그리고, 실패하면 인라인 SVG로 바꾼다. 물품 이미지를 쓰는 모든 곳이 이 컴포넌트를 거친다.

**Files:**
- Create: `components/ItemImage.tsx`
- Modify: `app/globals.css` (`.item-image` 규칙 추가)

**Interfaces:**
- Consumes: `type Item` from `lib/items.ts`
- Produces: `<ItemImage item={item} size={number} />`

- [ ] **Step 1: 구현**

`components/ItemImage.tsx`:

```tsx
'use client';

import { useEffect, useState } from 'react';
import type { Item } from '@/lib/items';

type Props = { item: Item; size?: number };

/**
 * CDN 아이콘을 우선 그리고, 로딩에 실패하면 인라인 SVG로 대체한다.
 * item.imageUrl이 null이면 처음부터 인라인 SVG를 그린다.
 */
export default function ItemImage({ item, size = 140 }: Props) {
  const [failed, setFailed] = useState(false);

  // 물품이 바뀌면 실패 상태를 초기화한다.
  useEffect(() => {
    setFailed(false);
  }, [item.id]);

  const style = { width: size, height: size } as const;

  if (item.imageUrl === null || failed) {
    return (
      <span
        className="item-image"
        style={style}
        aria-label={item.name}
        role="img"
        dangerouslySetInnerHTML={{ __html: item.svg }}
      />
    );
  }

  return (
    <span className="item-image" style={style}>
      <img
        src={item.imageUrl}
        alt={item.name}
        width={size}
        height={size}
        draggable={false}
        onError={() => setFailed(true)}
      />
    </span>
  );
}
```

- [ ] **Step 2: 스타일 추가**

`app/globals.css` 끝에 붙인다. 어두운 배경 위에 검은 선 아이콘을 얹으므로 흰 원판을 깔아야 보인다.

```css
.item-image {
  display: grid;
  place-items: center;
  background: #fff;
  border-radius: 50%;
  padding: 10%;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.35);
}

.item-image > img,
.item-image > svg {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}
```

- [ ] **Step 3: 타입 검사**

Run: `npx tsc --noEmit`
Expected: 오류 없음

- [ ] **Step 4: 커밋**

```bash
git add components/ItemImage.tsx app/globals.css
git commit -m "feat: add ItemImage with CDN-to-SVG fallback"
```

---

### Task 7: 슬롯머신

이 앱의 핵심 연출이다. `requestAnimationFrame`으로 릴 위치를 직접 계산해 뽑힌 물품에 정확히 멈춘다.

**Files:**
- Create: `components/SlotMachine.tsx`
- Modify: `app/globals.css` (`.slot*` 규칙 추가)

**Interfaces:**
- Consumes: `ITEMS`, `type Item` from `lib/items.ts`; `drawItem`, `bumpCount`, `type Counts` from `lib/draw.ts`; `ItemImage` from `components/ItemImage.tsx`
- Produces: `<SlotMachine counts={Counts} onDraw={(itemId: string) => void} />`
  - 부모가 카운트를 소유한다. 이 컴포넌트는 뽑은 결과를 `onDraw`로 올려보내고 저장은 부모가 한다.

- [ ] **Step 1: 애니메이션 사양 확정**

타임라인은 다음과 같다. `CELL`은 릴 한 칸의 픽셀 높이다.

| 구간 | 시간 | 동작 |
|------|------|------|
| 등속 | 0 ~ 1100ms | 초당 `CELL * 14`px 속도로 스크롤. 블러 6px |
| 감속 | 1100 ~ 1700ms | `easeOutQuart`로 남은 거리를 소진하며 목표 칸에 정렬. 블러는 0으로 수렴 |
| 정착 | 1700ms 이후 | CSS 스프링 바운스 + 당첨 카드 글로우 1회 |

목표 오프셋은 다음처럼 계산한다. 등속 구간이 끝난 시점의 오프셋에서, 최소 `LOOPS`바퀴를 더 돈 뒤 목표 인덱스에 닿는 가장 가까운 오프셋을 구한다.

```ts
const CELL = 200;      // 릴 한 칸 높이(px)
const REPEAT = 12;     // 스트립에 물품 목록을 반복할 횟수
const SPIN_MS = 1100;  // 등속 구간
const EASE_MS = 600;   // 감속 구간
const SPEED = CELL * 14; // px per second
const LOOPS = 2;       // 감속 구간에서 최소로 더 도는 바퀴 수
```

- [ ] **Step 2: 구현**

`components/SlotMachine.tsx`:

```tsx
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ITEMS } from '@/lib/items';
import { drawItem, type Counts } from '@/lib/draw';
import ItemImage from './ItemImage';

const CELL = 200;
const REPEAT = 12;
const SPIN_MS = 1100;
const EASE_MS = 600;
const SPEED = CELL * 14;
const LOOPS = 2;
const CYCLE = CELL * ITEMS.length;

/** 감속 곡선. 끝에서 완전히 멈춘다. */
function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4);
}

const STRIP = Array.from({ length: REPEAT }, () => ITEMS).flat();

type Props = {
  counts: Counts;
  onDraw: (itemId: string) => void;
};

export default function SlotMachine({ counts, onDraw }: Props) {
  const [current, setCurrent] = useState(ITEMS[0]);
  const [spinning, setSpinning] = useState(false);
  const [landed, setLanded] = useState(false);

  const reelRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  // 최신 counts를 애니메이션 콜백에서 읽기 위해 ref로 들고 있는다.
  const countsRef = useRef(counts);
  countsRef.current = counts;

  const paint = (offset: number, blur: number) => {
    const el = reelRef.current;
    if (!el) return;
    // 스트립 전체를 벗어나지 않도록 한 사이클 단위로 감는다.
    const wrapped = offset % (CYCLE * (REPEAT - 2));
    el.style.transform = `translate3d(0, ${-wrapped}px, 0)`;
    el.style.filter = blur > 0.2 ? `blur(${blur.toFixed(1)}px)` : 'none';
  };

  useEffect(() => {
    paint(0, 0);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const spin = useCallback(() => {
    if (spinning) return;

    const winnerId = drawItem(countsRef.current);
    const winnerIndex = ITEMS.findIndex((i) => i.id === winnerId);
    const winner = ITEMS[winnerIndex];

    setSpinning(true);
    setLanded(false);

    const start = performance.now();
    const startOffset = offsetRef.current;
    const spinEndOffset = startOffset + (SPEED * SPIN_MS) / 1000;

    // 감속 구간이 끝날 목표 오프셋: 최소 LOOPS바퀴를 더 돈 뒤 winnerIndex 칸에 정렬한다.
    const base = spinEndOffset + CYCLE * LOOPS;
    const remainder = ((base % CYCLE) + CYCLE) % CYCLE;
    const targetInCycle = winnerIndex * CELL;
    const forward = (targetInCycle - remainder + CYCLE) % CYCLE;
    const endOffset = base + forward;

    const tick = (now: number) => {
      const elapsed = now - start;

      if (elapsed < SPIN_MS) {
        const offset = startOffset + (SPEED * elapsed) / 1000;
        offsetRef.current = offset;
        paint(offset, 6);
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const t = Math.min(1, (elapsed - SPIN_MS) / EASE_MS);
      const eased = easeOutQuart(t);
      const offset = spinEndOffset + (endOffset - spinEndOffset) * eased;
      offsetRef.current = offset;
      paint(offset, 6 * (1 - eased));

      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      // 정확히 목표 칸에 앉힌다.
      offsetRef.current = endOffset;
      paint(endOffset, 0);
      setCurrent(winner);
      setSpinning(false);
      setLanded(true);
      onDraw(winnerId);
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [spinning, onDraw]);

  return (
    <div className="slot">
      <div className="slot-window">
        <div className={`slot-reel${landed ? ' is-landed' : ''}`} ref={reelRef}>
          {STRIP.map((item, i) => (
            <div className="slot-cell" key={`${item.id}-${i}`}>
              <ItemImage item={item} size={CELL * 0.68} />
            </div>
          ))}
        </div>
        <div className="slot-mask" aria-hidden />
      </div>

      <p className={`slot-name${spinning ? ' is-spinning' : ''}`}>
        {spinning ? ' ' : current.name}
      </p>

      <button className="slot-button" onClick={spin} disabled={spinning}>
        {spinning ? '뽑는 중' : '랜덤 뽑기'}
      </button>
    </div>
  );
}
```

- [ ] **Step 3: 스타일 추가**

`app/globals.css` 끝에 붙인다.

```css
.slot {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  height: 100%;
  min-width: 0;
  padding: 12px;
}

.slot-window {
  position: relative;
  width: 100%;
  max-width: 260px;
  height: 200px;
  overflow: hidden;
  border-radius: 28px;
  background: linear-gradient(180deg, #1a2030, #10141d);
  border: 1px solid var(--line);
  box-shadow: inset 0 12px 24px rgba(0, 0, 0, 0.55);
}

.slot-reel {
  will-change: transform, filter;
}

.slot-reel.is-landed {
  animation: slot-settle 420ms cubic-bezier(0.22, 1.4, 0.36, 1);
}

@keyframes slot-settle {
  0% { transform: translate3d(0, -6px, 0); }
  55% { transform: translate3d(0, 5px, 0); }
  100% { transform: translate3d(0, 0, 0); }
}

.slot-cell {
  height: 200px;
  display: grid;
  place-items: center;
}

/* 위아래 페이드로 릴이 잘리는 느낌을 만든다. */
.slot-mask {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(180deg, #10141d 0%, rgba(16, 20, 29, 0) 22%, rgba(16, 20, 29, 0) 78%, #10141d 100%);
}

.slot-name {
  font-size: clamp(20px, 3.2vw, 34px);
  font-weight: 700;
  letter-spacing: -0.02em;
  min-height: 1.4em;
  text-align: center;
}

.slot-name.is-spinning { opacity: 0.35; }

.slot-button {
  min-height: 56px;
  padding: 0 32px;
  border-radius: 999px;
  font-size: clamp(16px, 1.9vw, 20px);
  font-weight: 700;
  background: var(--accent);
  color: #fff;
  box-shadow: 0 8px 22px rgba(12, 111, 255, 0.4);
  transition: transform 120ms ease, opacity 160ms ease;
}

.slot-button:active { transform: scale(0.96); }
.slot-button:disabled { opacity: 0.45; box-shadow: none; }

@media (prefers-reduced-motion: reduce) {
  .slot-reel { filter: none !important; }
  .slot-reel.is-landed { animation: none; }
}
```

애니메이션 중 당첨 카드 글로우는 `.slot-window`가 `.is-landed`를 가진 릴을 감쌀 때 나오는 그림자로 충분하다. 별도 요소를 추가하지 않는다.

- [ ] **Step 4: 타입 검사**

Run: `npx tsc --noEmit`
Expected: 오류 없음

- [ ] **Step 5: 커밋**

```bash
git add components/SlotMachine.tsx app/globals.css
git commit -m "feat: add rAF-driven slot machine with exact landing"
```

---

### Task 8: 뽑기 탭과 인원수 조절

인원수만큼 슬롯을 좌우로 배치하고, 각 슬롯의 카운트를 독립적으로 관리한다.

**Files:**
- Create: `components/DrawTab.tsx`, `components/PlayerCountFab.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: `SlotMachine`; `bumpCount`, `type Counts` from `lib/draw.ts`; `loadJSON`, `saveJSON`, `STORAGE_KEYS` from `lib/storage.ts`
- Produces:
  - `<DrawTab playerCount={number} />`
  - `<PlayerCountFab value={number} onChange={(n: number) => void} />`

- [ ] **Step 1: 인원수 버튼 구현**

`components/PlayerCountFab.tsx`:

```tsx
'use client';

import { useState } from 'react';

const OPTIONS = [1, 2, 3, 4, 5];

type Props = { value: number; onChange: (n: number) => void };

export default function PlayerCountFab({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="fab-wrap">
      {open && (
        <div className="fab-menu">
          {OPTIONS.map((n) => (
            <button
              key={n}
              className={`fab-option${n === value ? ' is-active' : ''}`}
              onClick={() => {
                onChange(n);
                setOpen(false);
              }}
            >
              {n}
            </button>
          ))}
        </div>
      )}
      <button
        className="fab"
        onClick={() => setOpen((v) => !v)}
        aria-label="인원수 조절"
      >
        <span className="fab-value">{value}</span>
        <span className="fab-unit">명</span>
      </button>
    </div>
  );
}
```

- [ ] **Step 2: 뽑기 탭 구현**

`components/DrawTab.tsx` — 슬롯별 카운트를 인덱스 키로 들고, 뽑을 때마다 저장한다.

```tsx
'use client';

import { useEffect, useState } from 'react';
import SlotMachine from './SlotMachine';
import { bumpCount, type Counts } from '@/lib/draw';
import { loadJSON, saveJSON, STORAGE_KEYS } from '@/lib/storage';

/** 슬롯 인덱스별 카운트. 키는 문자열 인덱스다. */
type CountsBySlot = Record<string, Counts>;

type Props = { playerCount: number };

export default function DrawTab({ playerCount }: Props) {
  const [countsBySlot, setCountsBySlot] = useState<CountsBySlot>({});

  useEffect(() => {
    setCountsBySlot(loadJSON<CountsBySlot>(STORAGE_KEYS.counts, {}));
  }, []);

  const handleDraw = (slot: number, itemId: string) => {
    setCountsBySlot((prev) => {
      const key = String(slot);
      const next = { ...prev, [key]: bumpCount(prev[key] ?? {}, itemId) };
      saveJSON(STORAGE_KEYS.counts, next);
      return next;
    });
  };

  return (
    <div className="draw-grid" style={{ gridTemplateColumns: `repeat(${playerCount}, 1fr)` }}>
      {Array.from({ length: playerCount }, (_, slot) => (
        <section className="draw-slot" key={slot}>
          {playerCount > 1 && <span className="draw-slot-label">{slot + 1}</span>}
          <SlotMachine
            counts={countsBySlot[String(slot)] ?? {}}
            onDraw={(itemId) => handleDraw(slot, itemId)}
          />
        </section>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: 스타일 추가**

```css
.draw-grid {
  display: grid;
  height: 100%;
  width: 100%;
  padding: calc(84px + var(--safe-t)) var(--safe-r) var(--safe-b) var(--safe-l);
}

.draw-slot {
  position: relative;
  min-width: 0;
  display: grid;
  place-items: center;
  border-right: 1px solid var(--line);
}

.draw-slot:last-child { border-right: none; }

.draw-slot-label {
  position: absolute;
  top: 10px;
  left: 14px;
  font-size: 13px;
  font-weight: 700;
  color: var(--text-dim);
}

.fab-wrap {
  position: fixed;
  right: calc(18px + var(--safe-r));
  bottom: calc(18px + var(--safe-b));
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  z-index: 40;
}

.fab {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  line-height: 1;
  background: var(--surface-2);
  border: 1px solid var(--line);
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.5);
}

.fab-value { font-size: 20px; font-weight: 800; }
.fab-unit { font-size: 10px; color: var(--text-dim); }

.fab-menu {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px;
  border-radius: 999px;
  background: var(--surface-2);
  border: 1px solid var(--line);
  animation: fab-in 160ms ease-out;
}

@keyframes fab-in {
  from { opacity: 0; transform: translateY(8px) scale(0.94); }
  to { opacity: 1; transform: none; }
}

.fab-option {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  font-weight: 700;
  color: var(--text-dim);
}

.fab-option.is-active { background: var(--accent); color: #fff; }
```

- [ ] **Step 4: 타입 검사**

Run: `npx tsc --noEmit`
Expected: 오류 없음

- [ ] **Step 5: 커밋**

```bash
git add components/DrawTab.tsx components/PlayerCountFab.tsx app/globals.css
git commit -m "feat: add draw tab with independent per-slot counts"
```

---

### Task 9: 랭킹 탭

목록, 입력 시트, 편집 모드 삭제를 만든다.

**Files:**
- Create: `components/RankingTab.tsx`, `components/RankingSheet.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: `sortRanking`, `formatTime`, `createEntry`, `MAX_COUNT`, `type RankingEntry` from `lib/ranking.ts`; `loadJSON`, `saveJSON`, `STORAGE_KEYS` from `lib/storage.ts`
- Produces:
  - `<RankingTab />`
  - `<RankingSheet onSubmit={(name: string, count: number) => void} onClose={() => void} />`

- [ ] **Step 1: 입력 시트 구현**

`components/RankingSheet.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { MAX_COUNT } from '@/lib/ranking';

type Props = {
  onSubmit: (name: string, count: number) => void;
  onClose: () => void;
};

export default function RankingSheet({ onSubmit, onClose }: Props) {
  const [name, setName] = useState('');
  const [count, setCount] = useState(0);

  const canSubmit = name.trim().length > 0;

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <h2 className="sheet-title">기록 추가</h2>

        <input
          className="sheet-input"
          placeholder="이름"
          value={name}
          maxLength={12}
          autoFocus
          onChange={(e) => setName(e.target.value)}
        />

        <p className="sheet-label">개수</p>
        <div className="chip-row">
          {Array.from({ length: MAX_COUNT + 1 }, (_, n) => (
            <button
              key={n}
              className={`chip${n === count ? ' is-active' : ''}`}
              onClick={() => setCount(n)}
            >
              {n}
            </button>
          ))}
        </div>

        <div className="sheet-actions">
          <button className="sheet-cancel" onClick={onClose}>취소</button>
          <button
            className="sheet-submit"
            disabled={!canSubmit}
            onClick={() => onSubmit(name, count)}
          >
            등록
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 랭킹 탭 구현**

`components/RankingTab.tsx`:

```tsx
'use client';

import { useEffect, useState } from 'react';
import RankingSheet from './RankingSheet';
import { createEntry, formatTime, sortRanking, type RankingEntry } from '@/lib/ranking';
import { loadJSON, saveJSON, STORAGE_KEYS } from '@/lib/storage';

export default function RankingTab() {
  const [entries, setEntries] = useState<RankingEntry[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setEntries(loadJSON<RankingEntry[]>(STORAGE_KEYS.ranking, []));
  }, []);

  const persist = (next: RankingEntry[]) => {
    setEntries(next);
    saveJSON(STORAGE_KEYS.ranking, next);
  };

  const add = (name: string, count: number) => {
    persist([...entries, createEntry(name, count)]);
    setSheetOpen(false);
  };

  const remove = (id: string) => {
    persist(entries.filter((e) => e.id !== id));
  };

  const sorted = sortRanking(entries);

  return (
    <div className="rank">
      <div className="rank-head">
        <h1 className="rank-title">랭킹</h1>
        <button
          className={`rank-edit${editing ? ' is-active' : ''}`}
          onClick={() => setEditing((v) => !v)}
          disabled={entries.length === 0}
        >
          {editing ? '완료' : '편집'}
        </button>
      </div>

      {sorted.length === 0 ? (
        <p className="rank-empty">아직 기록이 없다. 오른쪽 아래 + 버튼으로 추가한다.</p>
      ) : (
        <ol className="rank-list">
          {sorted.map((e, i) => (
            <li className={`rank-row rank-${i < 3 ? i + 1 : 'n'}`} key={e.id}>
              <span className="rank-pos">{i + 1}</span>
              <span className="rank-name">{e.name}</span>
              <span className="rank-time">{formatTime(e.createdAt)}</span>
              <span className="rank-count">{e.count}</span>
              {editing && (
                <button className="rank-del" onClick={() => remove(e.id)} aria-label={`${e.name} 삭제`}>
                  삭제
                </button>
              )}
            </li>
          ))}
        </ol>
      )}

      <button className="fab fab-plus" onClick={() => setSheetOpen(true)} aria-label="기록 추가">
        +
      </button>

      {sheetOpen && <RankingSheet onSubmit={add} onClose={() => setSheetOpen(false)} />}
    </div>
  );
}
```

- [ ] **Step 3: 스타일 추가**

```css
.rank {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: calc(84px + var(--safe-t)) calc(20px + var(--safe-r)) calc(20px + var(--safe-b)) calc(20px + var(--safe-l));
}

.rank-head {
  width: min(680px, 100%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.rank-title { font-size: 26px; font-weight: 800; letter-spacing: -0.02em; }

.rank-edit {
  min-height: 44px;
  padding: 0 18px;
  border-radius: 999px;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-dim);
  border: 1px solid var(--line);
}

.rank-edit.is-active { background: var(--accent); color: #fff; border-color: transparent; }
.rank-edit:disabled { opacity: 0.4; }

.rank-empty { color: var(--text-dim); margin-top: 40px; }

.rank-list {
  width: min(680px, 100%);
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-bottom: 90px;
}

.rank-row {
  display: grid;
  grid-template-columns: 44px 1fr auto auto auto;
  align-items: center;
  gap: 12px;
  min-height: 62px;
  padding: 0 16px;
  border-radius: var(--radius);
  background: var(--surface);
  border: 1px solid var(--line);
}

.rank-pos { font-size: 18px; font-weight: 800; color: var(--text-dim); text-align: center; }
.rank-1 .rank-pos { color: var(--gold); }
.rank-2 .rank-pos { color: var(--silver); }
.rank-3 .rank-pos { color: var(--bronze); }
.rank-1 { border-color: rgba(255, 197, 61, 0.5); }

.rank-name { font-size: 18px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rank-time { font-size: 13px; color: var(--text-dim); font-variant-numeric: tabular-nums; }

.rank-count {
  font-size: 22px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  min-width: 40px;
  text-align: right;
}

.rank-del {
  min-height: 44px;
  padding: 0 14px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  color: #ff6b6b;
  border: 1px solid rgba(255, 107, 107, 0.4);
}

.fab-plus {
  position: fixed;
  right: calc(18px + var(--safe-r));
  bottom: calc(18px + var(--safe-b));
  font-size: 30px;
  font-weight: 300;
  background: var(--accent);
  border-color: transparent;
  color: #fff;
  z-index: 40;
}

.sheet-backdrop {
  position: fixed;
  inset: 0;
  z-index: 60;
  background: rgba(0, 0, 0, 0.6);
  display: grid;
  place-items: center;
  padding: 20px;
  animation: fade-in 140ms ease-out;
}

@keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }

.sheet {
  width: min(460px, 100%);
  padding: 24px;
  border-radius: 26px;
  background: var(--surface);
  border: 1px solid var(--line);
  animation: sheet-in 220ms cubic-bezier(0.22, 1.2, 0.36, 1);
}

@keyframes sheet-in {
  from { opacity: 0; transform: translateY(18px) scale(0.97); }
  to { opacity: 1; transform: none; }
}

.sheet-title { font-size: 20px; font-weight: 800; margin-bottom: 16px; }

.sheet-input {
  width: 100%;
  min-height: 52px;
  padding: 0 16px;
  border-radius: 14px;
  background: var(--surface-2);
  border: 1px solid var(--line);
  font-size: 17px;
  user-select: text;
  -webkit-user-select: text;
}

.sheet-label { margin: 18px 0 10px; font-size: 14px; color: var(--text-dim); }

.chip-row { display: flex; flex-wrap: wrap; gap: 8px; }

.chip {
  min-width: 44px;
  min-height: 44px;
  padding: 0 6px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 700;
  color: var(--text-dim);
  background: var(--surface-2);
  border: 1px solid var(--line);
}

.chip.is-active { background: var(--accent); color: #fff; border-color: transparent; }

.sheet-actions { display: flex; gap: 10px; margin-top: 22px; }

.sheet-cancel,
.sheet-submit {
  flex: 1;
  min-height: 52px;
  border-radius: 14px;
  font-size: 17px;
  font-weight: 700;
}

.sheet-cancel { color: var(--text-dim); border: 1px solid var(--line); }
.sheet-submit { background: var(--accent); color: #fff; }
.sheet-submit:disabled { opacity: 0.4; }
```

- [ ] **Step 4: 타입 검사**

Run: `npx tsc --noEmit`
Expected: 오류 없음

- [ ] **Step 5: 커밋**

```bash
git add components/RankingTab.tsx components/RankingSheet.tsx app/globals.css
git commit -m "feat: add ranking tab with add sheet and edit-mode delete"
```

---

### Task 10: 상단바와 페이지 조립

탭 전환 셸을 만들고 인원수 상태를 페이지에 올린다.

**Files:**
- Create: `components/TopBar.tsx`
- Modify: `app/page.tsx`, `app/globals.css`

**Interfaces:**
- Consumes: `DrawTab`, `RankingTab`, `PlayerCountFab`; `loadJSON`, `saveJSON`, `STORAGE_KEYS` from `lib/storage.ts`
- Produces: `<TopBar tab={'draw' | 'rank'} onChange={(tab) => void} />`

- [ ] **Step 1: 상단바 구현**

`components/TopBar.tsx`:

```tsx
'use client';

export type Tab = 'draw' | 'rank';

type Props = { tab: Tab; onChange: (tab: Tab) => void };

const TABS: { id: Tab; label: string }[] = [
  { id: 'draw', label: '뽑기' },
  { id: 'rank', label: '랭킹' },
];

export default function TopBar({ tab, onChange }: Props) {
  return (
    <nav className="topbar">
      {TABS.map((t) => (
        <button
          key={t.id}
          className={`topbar-tab${t.id === tab ? ' is-active' : ''}`}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </nav>
  );
}
```

- [ ] **Step 2: 페이지 조립**

`app/page.tsx`:

```tsx
'use client';

import { useEffect, useState } from 'react';
import TopBar, { type Tab } from '@/components/TopBar';
import DrawTab from '@/components/DrawTab';
import RankingTab from '@/components/RankingTab';
import PlayerCountFab from '@/components/PlayerCountFab';
import { loadJSON, saveJSON, STORAGE_KEYS } from '@/lib/storage';

export default function Page() {
  const [tab, setTab] = useState<Tab>('draw');
  const [playerCount, setPlayerCount] = useState(1);

  useEffect(() => {
    const saved = loadJSON<number>(STORAGE_KEYS.playerCount, 1);
    if (Number.isInteger(saved) && saved >= 1 && saved <= 5) setPlayerCount(saved);
  }, []);

  const changePlayerCount = (n: number) => {
    setPlayerCount(n);
    saveJSON(STORAGE_KEYS.playerCount, n);
  };

  return (
    <main className="app">
      <TopBar tab={tab} onChange={setTab} />
      {tab === 'draw' ? <DrawTab playerCount={playerCount} /> : <RankingTab />}
      {tab === 'draw' && <PlayerCountFab value={playerCount} onChange={changePlayerCount} />}
    </main>
  );
}
```

- [ ] **Step 3: 스타일 추가**

```css
.app {
  position: relative;
  height: 100dvh;
  overflow: hidden;
}

.topbar {
  position: fixed;
  top: calc(14px + var(--safe-t));
  left: 50%;
  transform: translateX(-50%);
  z-index: 50;
  display: flex;
  gap: 4px;
  padding: 5px;
  border-radius: 999px;
  background: rgba(21, 25, 34, 0.82);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border: 1px solid var(--line);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.45);
}

.topbar-tab {
  min-width: 96px;
  min-height: 44px;
  padding: 0 22px;
  border-radius: 999px;
  font-size: 16px;
  font-weight: 700;
  color: var(--text-dim);
  transition: color 160ms ease, background 200ms ease;
}

.topbar-tab.is-active { background: var(--accent); color: #fff; }
```

- [ ] **Step 4: 타입 검사와 빌드**

Run: `npx tsc --noEmit && npm run build`
Expected: 오류 없음, 빌드 성공

- [ ] **Step 5: 커밋**

```bash
git add components/TopBar.tsx app/page.tsx app/globals.css
git commit -m "feat: wire top bar, tabs, and player count into page"
```

---

### Task 11: 전체 검증과 배포 준비

**Files:**
- Modify: 필요 시 발견된 문제만

- [ ] **Step 1: 전체 테스트**

Run: `npm test`
Expected: 모든 테스트 통과

- [ ] **Step 2: 타입 검사와 프로덕션 빌드**

Run: `npx tsc --noEmit && npm run build`
Expected: 오류 없음

- [ ] **Step 3: 개발 서버 띄우고 육안 확인**

Run: `npm run dev`

브라우저를 아이패드 크기(1180 × 820)로 놓고 다음을 확인한다.

1. 뽑기 버튼을 누르면 릴이 약 1.7초 돌고 멈춘다.
2. 멈춘 칸의 그림과 아래 표시된 이름이 일치한다.
3. 인원수를 5로 올리면 슬롯 5칸이 가로로 나뉜다.
4. 한 슬롯을 돌리는 동안 다른 슬롯 버튼을 누를 수 있다.
5. 랭킹 탭에서 `+`로 이름과 개수를 등록하면 개수 내림차순으로 정렬된다.
6. 각 행에 `HH:MM` 시각이 보인다.
7. 편집 버튼을 누르면 삭제 버튼이 나오고, 삭제가 동작한다.
8. 새로고침해도 랭킹과 인원수가 유지된다.
9. 네트워크를 끊고 새로고침하면 아이콘이 인라인 SVG로 나온다.

- [ ] **Step 4: 커밋 후 푸시**

```bash
git push -u origin main
```

Vercel이 `main` 브랜치를 자동 배포한다.

## Self-Review 결과

- **명세 커버리지:** 1~13절을 모두 태스크에 대응시켰다. 4절 물품 목록은 Task 2, 5절 뽑기 규칙은 Task 3, 6절 화면은 Task 8~10, 7절 애니메이션은 Task 7, 8절 저장은 Task 4·5, 9절 아이패드 대응은 Task 1·10, 11절 오류 처리는 Task 4·6, 12절 테스트는 Task 3~5와 Task 11이다.
- **타입 일관성:** `Counts`는 `lib/draw.ts`에서만 정의하고 Task 8이 가져다 쓴다. `RankingEntry`는 `lib/ranking.ts`에서만 정의한다. `Tab`은 `components/TopBar.tsx`에서 내보내고 `app/page.tsx`가 가져다 쓴다.
- **명세 대비 추가:** 명세 6.4절은 정렬을 랭킹 탭 안에서 다루지만, 테스트를 위해 `lib/ranking.ts`로 분리했다. 명세 10절의 모듈 표에 이 파일을 더한 것이다.

## 구현 중 계획에서 벗어난 부분

- **Vitest jsdom의 localStorage:** vitest의 jsdom 환경은 `window.localStorage`를 undefined로 노출한다. `test/setup.ts`에서 없을 때만 표준 호환 구현을 붙이고, `vitest.config.ts`에 `setupFiles`와 jsdom `url`을 지정했다.
- **슬롯 정지 바운스 위치:** 바운스를 릴 자체에 걸면 릴의 `transform`을 덮어써서 위치가 0으로 튄다. `.slot-bounce` 래퍼를 하나 두고 거기에만 애니메이션을 걸었다.
- **슬롯 확대:** 인원수가 적을 때 아이패드 화면이 비어 보여서 `.slot-inner`에 `--slot-scale`을 걸었다. 1명 1.75배부터 5명 1배까지다. 릴 계산은 200px 격자를 그대로 쓰고 시각적으로만 확대한다.
- **`REPEAT` 12 → 8:** 5명 분할일 때 DOM 노드 수를 줄이기 위해서다. 감기 지점 `WRAP`이 여전히 한 사이클의 배수라 그림은 튀지 않는다.
- **슬롯별 초기 물품:** 모든 슬롯이 같은 물품으로 시작하면 화면이 단조로워서 `initialIndex`를 슬롯마다 다르게 준다.
