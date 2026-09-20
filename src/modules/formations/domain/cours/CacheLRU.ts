export interface CacheLRU<V> {
  lire(cle: string): V | undefined;
  ecrire(cle: string, valeur: V): void;
  readonly taille: number;
}

export function creerCacheLRU<V>(capacite: number): CacheLRU<V> {
  if (!Number.isInteger(capacite) || capacite < 1) {
    throw new RangeError(
      `Capacite de cache invalide: ${String(capacite)} (entier positif attendu)`,
    );
  }
  const entrees = new Map<string, V>();
  return {
    lire(cle: string): V | undefined {
      if (!entrees.has(cle)) {
        return undefined;
      }
      const valeur = entrees.get(cle) as V;
      entrees.delete(cle);
      entrees.set(cle, valeur);
      return valeur;
    },
    ecrire(cle: string, valeur: V): void {
      entrees.delete(cle);
      entrees.set(cle, valeur);
      if (entrees.size > capacite) {
        const doyenne = entrees.keys().next();
        if (!doyenne.done) {
          entrees.delete(doyenne.value);
        }
      }
    },
    get taille(): number {
      return entrees.size;
    },
  };
}
