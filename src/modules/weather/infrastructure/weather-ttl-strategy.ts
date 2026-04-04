/** TTL de base par type de donnees (ms). */
const BASE_TTL: Record<string, number> = {
  geocoding: 60 * 60 * 1_000, // 1h
  forecast: 15 * 60 * 1_000, // 15min
  'air-quality': 30 * 60 * 1_000, // 30min
  ensemble: 30 * 60 * 1_000, // 30min
  historical: 60 * 60 * 1_000, // 1h
  'owm-current': 10 * 60 * 1_000, // 10min
  'owm-forecast': 30 * 60 * 1_000, // 30min
  alerts: 5 * 60 * 1_000, // 5min
};

/** TTL de secours pour les types inconnus (15 minutes). */
const FALLBACK_TTL = 15 * 60 * 1_000;

/** TTL minimal apres reduction pour conditions extremes (2 minutes). */
const MIN_TTL = 2 * 60 * 1_000;

/** Types de donnees stables non affectes par le weather code. */
const STABLE_DATA_TYPES = new Set(['geocoding', 'historical']);

/**
 * Calcule le TTL dynamique pour une entree cache meteo.
 * Le TTL est reduit si les conditions sont extremes (codes >= 80),
 * et augmente la nuit (entre 22h et 6h UTC).
 *
 * @param dataType - Type de donnees meteo (forecast, geocoding, alerts, etc.).
 * @param weatherCode - Code meteo WMO optionnel pour ajuster le TTL.
 * @param nowHourUtc - Heure UTC courante (0-23), injectable pour les tests.
 */
export function computeWeatherTtl(
  dataType: string,
  weatherCode?: number,
  nowHourUtc?: number,
): number {
  let ttl = BASE_TTL[dataType] ?? FALLBACK_TTL;

  // Les donnees stables ne sont pas affectees par le weather code
  if (!STABLE_DATA_TYPES.has(dataType) && weatherCode !== undefined) {
    if (weatherCode >= 80) {
      ttl = Math.max(Math.round(ttl / 3), MIN_TTL);
    }
  }

  // La nuit (22h-6h UTC), le trafic est moindre : TTL double
  const utcHour = nowHourUtc ?? new Date().getUTCHours();
  if (utcHour >= 22 || utcHour < 6) {
    ttl = ttl * 2;
  }

  return Math.round(ttl);
}
