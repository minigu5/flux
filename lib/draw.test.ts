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
      expect(a).not.toBe(b);
    }
  });
});

describe('drawItem', () => {
  it('두 후보 중 카운트가 적은 쪽을 고른다', () => {
    const first = ITEMS[0].id;
    const second = ITEMS[1].id;
    const counts: Counts = { [first]: 5, [second]: 1 };
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
    expect(Math.max(...values) - Math.min(...values)).toBeLessThanOrEqual(8);
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
