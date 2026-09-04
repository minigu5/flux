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
