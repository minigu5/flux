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
