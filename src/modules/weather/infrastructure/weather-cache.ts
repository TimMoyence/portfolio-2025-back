import { computeWeatherTtl } from './weather-ttl-strategy';

/** Nombre maximal d'entrees en cache (eviction LRU au-dela). */
const DEFAULT_MAX_ENTRIES = 10_000;

/** Cache memoire avec TTL et limite de taille pour les reponses meteo. */
export class WeatherCache {
  private readonly store = new Map<
    string,
    { data: unknown; expiresAt: number }
  >();
  private readonly maxEntries: number;

  constructor(maxEntries = DEFAULT_MAX_ENTRIES) {
    this.maxEntries = maxEntries;
  }

  /** Recupere une entree du cache si elle n'a pas expire. */
  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    // Rafraichir la position LRU (delete + re-set = fin de Map)
    this.store.delete(key);
    this.store.set(key, entry);
    return entry.data as T;
  }

  /** Stocke une valeur dans le cache avec un TTL en millisecondes. */
  set(key: string, data: unknown, ttlMs: number): void {
    // Si la cle existe deja, la supprimer pour rafraichir la position
    if (this.store.has(key)) {
      this.store.delete(key);
    }
    this.store.set(key, { data, expiresAt: Date.now() + ttlMs });
    this.evict();
  }

  /** Stocke une valeur en calculant le TTL dynamiquement selon le type et les conditions. */
  setWithStrategy(
    key: string,
    data: unknown,
    dataType: string,
    weatherCode?: number,
  ): void {
    const ttl = computeWeatherTtl(dataType, weatherCode);
    this.set(key, data, ttl);
  }

  /** Supprime les entrees expirees puis les plus anciennes si le cache deborde. */
  private evict(): void {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
    // Eviction LRU : supprimer les entrees les plus anciennes (debut du Map)
    while (this.store.size > this.maxEntries) {
      const oldest = this.store.keys().next();
      if (!oldest.done) {
        this.store.delete(oldest.value);
      }
    }
  }
}
