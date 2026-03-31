/** Cache memoire avec TTL pour les reponses meteo. */
export class WeatherCache {
  private readonly store = new Map<
    string,
    { data: unknown; expiresAt: number }
  >();

  /** Recupere une entree du cache si elle n'a pas expire. */
  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.data as T;
  }

  /** Stocke une valeur dans le cache avec un TTL en millisecondes. */
  set(key: string, data: unknown, ttlMs: number): void {
    this.store.set(key, { data, expiresAt: Date.now() + ttlMs });
    this.cleanup();
  }

  /** Supprime les entrees expirees pour eviter les fuites memoire. */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }
}
