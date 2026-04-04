import { computeWeatherTtl } from './weather-ttl-strategy';

describe('computeWeatherTtl', () => {
  // --- TTL de base par type (jour, pas de weather code) ---

  it('devrait retourner 1h pour le geocoding', () => {
    expect(computeWeatherTtl('geocoding', undefined, 14)).toBe(60 * 60 * 1_000);
  });

  it('devrait retourner 15min pour le forecast', () => {
    expect(computeWeatherTtl('forecast', undefined, 14)).toBe(15 * 60 * 1_000);
  });

  it('devrait retourner 30min pour air-quality', () => {
    expect(computeWeatherTtl('air-quality', undefined, 14)).toBe(
      30 * 60 * 1_000,
    );
  });

  it('devrait retourner 30min pour ensemble', () => {
    expect(computeWeatherTtl('ensemble', undefined, 14)).toBe(30 * 60 * 1_000);
  });

  it('devrait retourner 1h pour historical', () => {
    expect(computeWeatherTtl('historical', undefined, 14)).toBe(
      60 * 60 * 1_000,
    );
  });

  it('devrait retourner 10min pour owm-current', () => {
    expect(computeWeatherTtl('owm-current', undefined, 14)).toBe(
      10 * 60 * 1_000,
    );
  });

  it('devrait retourner 30min pour owm-forecast', () => {
    expect(computeWeatherTtl('owm-forecast', undefined, 14)).toBe(
      30 * 60 * 1_000,
    );
  });

  it('devrait retourner 5min pour alerts', () => {
    expect(computeWeatherTtl('alerts', undefined, 14)).toBe(5 * 60 * 1_000);
  });

  // --- Fallback pour type inconnu ---

  it('devrait retourner 15min pour un type inconnu', () => {
    expect(computeWeatherTtl('inconnu', undefined, 14)).toBe(15 * 60 * 1_000);
  });

  // --- Reduction pour conditions extremes ---

  it('devrait reduire le TTL de forecast par 3 pour un weather code extreme (95)', () => {
    const baseTtl = 15 * 60 * 1_000;
    const expected = Math.round(baseTtl / 3);
    expect(computeWeatherTtl('forecast', 95, 14)).toBe(expected);
  });

  it('devrait reduire le TTL de air-quality par 3 pour un weather code extreme', () => {
    const baseTtl = 30 * 60 * 1_000;
    const expected = Math.round(baseTtl / 3);
    expect(computeWeatherTtl('air-quality', 90, 14)).toBe(expected);
  });

  it('devrait reduire le TTL de ensemble par 3 pour un weather code extreme', () => {
    const baseTtl = 30 * 60 * 1_000;
    const expected = Math.round(baseTtl / 3);
    expect(computeWeatherTtl('ensemble', 85, 14)).toBe(expected);
  });

  it('devrait reduire le TTL de alerts par 3 avec minimum 2 minutes', () => {
    // alerts base = 5min = 300_000, /3 = 100_000 (1min40s) < 2min = 120_000
    expect(computeWeatherTtl('alerts', 95, 14)).toBe(2 * 60 * 1_000);
  });

  it('devrait reduire le TTL pour le code 80 (seuil exact)', () => {
    const baseTtl = 15 * 60 * 1_000;
    const expected = Math.round(baseTtl / 3);
    expect(computeWeatherTtl('forecast', 80, 14)).toBe(expected);
  });

  it('ne devrait PAS reduire le TTL pour un code 79', () => {
    expect(computeWeatherTtl('forecast', 79, 14)).toBe(15 * 60 * 1_000);
  });

  // --- Geocoding et historical non affectes par le weather code ---

  it('ne devrait PAS reduire le TTL de geocoding meme avec un weather code extreme', () => {
    expect(computeWeatherTtl('geocoding', 99, 14)).toBe(60 * 60 * 1_000);
  });

  it('ne devrait PAS reduire le TTL de historical meme avec un weather code extreme', () => {
    expect(computeWeatherTtl('historical', 99, 14)).toBe(60 * 60 * 1_000);
  });

  // --- Augmentation la nuit ---

  it('devrait doubler le TTL a 23h UTC (nuit)', () => {
    expect(computeWeatherTtl('forecast', undefined, 23)).toBe(
      15 * 60 * 1_000 * 2,
    );
  });

  it('devrait doubler le TTL a 3h UTC (nuit)', () => {
    expect(computeWeatherTtl('forecast', undefined, 3)).toBe(
      15 * 60 * 1_000 * 2,
    );
  });

  it('devrait doubler le TTL a 22h UTC (debut de la nuit)', () => {
    expect(computeWeatherTtl('forecast', undefined, 22)).toBe(
      15 * 60 * 1_000 * 2,
    );
  });

  it('ne devrait PAS doubler le TTL a 6h UTC (fin de la nuit)', () => {
    expect(computeWeatherTtl('forecast', undefined, 6)).toBe(15 * 60 * 1_000);
  });

  it('ne devrait PAS doubler le TTL a 14h UTC (jour)', () => {
    expect(computeWeatherTtl('forecast', undefined, 14)).toBe(15 * 60 * 1_000);
  });

  // --- Combinaison nuit + conditions extremes ---

  it('devrait appliquer reduction extreme ET bonus nuit', () => {
    const baseTtl = 15 * 60 * 1_000;
    // Reduction par 3 d'abord, puis doublement
    const expected = Math.round(baseTtl / 3) * 2;
    expect(computeWeatherTtl('forecast', 95, 23)).toBe(expected);
  });

  // --- Min 2 minutes garanti meme avec nuit ---

  it('devrait respecter le min 2 minutes avant doublement nuit pour alerts extreme', () => {
    // alerts base = 300_000, /3 = 100_000 -> min 120_000, *2 nuit = 240_000
    expect(computeWeatherTtl('alerts', 95, 23)).toBe(2 * 60 * 1_000 * 2);
  });

  // --- Fallback quand nowHourUtc n'est pas fourni ---

  it('devrait utiliser Date.getUTCHours() si nowHourUtc non fourni', () => {
    jest.useFakeTimers();
    jest.setSystemTime(Date.parse('2026-04-01T14:00:00Z'));

    expect(computeWeatherTtl('forecast')).toBe(15 * 60 * 1_000);

    jest.useRealTimers();
  });
});
