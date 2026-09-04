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
