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
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    expect(loadJSON('k', 'default')).toBe('default');
  });

  it('쓰기가 예외를 던져도 앱이 죽지 않는다', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded');
    });
    expect(() => saveJSON('k', { a: 1 })).not.toThrow();
  });
});
