/**
 * vitest의 jsdom 환경은 window.localStorage를 undefined로 노출한다.
 * 실제 브라우저와 같은 동작을 얻기 위해 없을 때만 표준 호환 구현을 붙인다.
 */
class MemoryStorage {
  private map = new Map<string, string>();

  get length(): number {
    return this.map.size;
  }

  key(index: number): string | null {
    return Array.from(this.map.keys())[index] ?? null;
  }

  getItem(key: string): string | null {
    return this.map.has(key) ? (this.map.get(key) as string) : null;
  }

  setItem(key: string, value: string): void {
    this.map.set(String(key), String(value));
  }

  removeItem(key: string): void {
    this.map.delete(key);
  }

  clear(): void {
    this.map.clear();
  }
}

if (typeof window !== 'undefined' && !window.localStorage) {
  const storage = new MemoryStorage();
  Object.defineProperty(window, 'localStorage', { value: storage, configurable: true });
  Object.defineProperty(globalThis, 'localStorage', { value: storage, configurable: true });
  // 테스트가 Storage.prototype에 스파이를 걸 수 있게 생성자도 맞춰 둔다.
  Object.defineProperty(globalThis, 'Storage', { value: MemoryStorage, configurable: true });
}
