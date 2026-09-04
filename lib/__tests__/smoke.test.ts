import { describe, it, expect } from 'vitest';

describe('테스트 환경', () => {
  it('jsdom 환경에서 window가 존재한다', () => {
    expect(typeof window).toBe('object');
  });
});
