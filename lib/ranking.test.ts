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
    expect(formatTime(new Date(2026, 8, 4, 9, 5).getTime())).toBe('09:05');
  });

  it('오후 시각도 24시간제로 만든다', () => {
    expect(formatTime(new Date(2026, 8, 4, 18, 42).getTime())).toBe('18:42');
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
