import { computeWeatherTtl } from './weather-ttl-strategy';

const DEFAULT_MAX_ENTRIES = 10_000;

export class WeatherCache {
  private readonly store = new Map<
    string,
    { data: unknown; expiresAt: number }
  >();
  private readonly maxEntries: number;

  constructor(maxEntries = DEFAULT_MAX_ENTRIES) {
    this.maxEntries = maxEntries;
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    this.store.delete(key);
    this.store.set(key, entry);
    return entry.data as T;
  }

  set(key: string, data: unknown, ttlMs: number): void {
    if (this.store.has(key)) {
      this.store.delete(key);
    }
    this.store.set(key, { data, expiresAt: Date.now() + ttlMs });
    this.evict();
  }

  setWithStrategy(
    key: string,
    data: unknown,
    dataType: string,
    weatherCode?: number,
  ): void {
    const ttl = computeWeatherTtl(dataType, weatherCode);
    this.set(key, data, ttl);
  }

  private evict(): void {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
    while (this.store.size > this.maxEntries) {
      const oldest = this.store.keys().next();
      if (!oldest.done) {
        this.store.delete(oldest.value);
      }
    }
  }
}
