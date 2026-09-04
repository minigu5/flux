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
