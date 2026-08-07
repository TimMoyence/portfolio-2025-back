const BASE_TTL_MS: Record<string, number> = {
  geocoding: 60 * 60 * 1_000,
  forecast: 15 * 60 * 1_000,
  'air-quality': 30 * 60 * 1_000,
  ensemble: 30 * 60 * 1_000,
  historical: 60 * 60 * 1_000,
  'owm-current': 10 * 60 * 1_000,
  'owm-forecast': 30 * 60 * 1_000,
  alerts: 5 * 60 * 1_000,
};

const FALLBACK_TTL_MS = 15 * 60 * 1_000;

const MIN_TTL_MS = 2 * 60 * 1_000;

const STABLE_DATA_TYPES = new Set(['geocoding', 'historical']);

export function computeWeatherTtl(
  dataType: string,
  weatherCode?: number,
  nowHourUtc?: number,
): number {
  let ttl = BASE_TTL_MS[dataType] ?? FALLBACK_TTL_MS;

  if (!STABLE_DATA_TYPES.has(dataType) && weatherCode !== undefined) {
    if (weatherCode >= 80) {
      ttl = Math.max(Math.round(ttl / 3), MIN_TTL_MS);
    }
  }

  const utcHour = nowHourUtc ?? new Date().getUTCHours();
  if (utcHour >= 22 || utcHour < 6) {
    ttl = ttl * 2;
  }

  return Math.round(ttl);
}
