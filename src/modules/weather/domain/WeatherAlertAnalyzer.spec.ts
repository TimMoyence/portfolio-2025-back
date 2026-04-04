import type { ForecastResult } from './IWeatherProxy.port';
import { WeatherAlertAnalyzer } from './WeatherAlertAnalyzer';

describe('WeatherAlertAnalyzer', () => {
  const analyzer = new WeatherAlertAnalyzer();

  const buildForecast = (
    overrides: Partial<{
      wind_gusts_10m: number[];
      precipitation: number[];
      temperature_2m: number[];
      weather_code: number[];
    }> = {},
  ): ForecastResult => ({
    current: {
      temperature_2m: 20,
      weather_code: 0,
      wind_speed_10m: 10,
      apparent_temperature: 19,
    },
    hourly: {
      time: Array.from(
        { length: 24 },
        (_, i) => `2026-04-04T${String(i).padStart(2, '0')}:00`,
      ),
      temperature_2m: overrides.temperature_2m ?? Array(24).fill(20),
      weather_code: overrides.weather_code ?? Array(24).fill(0),
      wind_speed_10m: Array(24).fill(10),
      precipitation: overrides.precipitation ?? Array(24).fill(0),
      wind_gusts_10m: overrides.wind_gusts_10m ?? Array(24).fill(0),
    },
    daily: {
      time: ['2026-04-04'],
      weather_code: [0],
      temperature_2m_max: [25],
      temperature_2m_min: [15],
      sunrise: ['2026-04-04T06:00'],
      sunset: ['2026-04-04T20:00'],
      precipitation_sum: [0],
    },
  });

  it('retourne aucune alerte pour des conditions normales', () => {
    const result = analyzer.analyze(buildForecast());
    expect(result).toEqual([]);
  });

  it('detecte une alerte vent severe pour des rafales > 80 km/h', () => {
    const result = analyzer.analyze(
      buildForecast({ wind_gusts_10m: [85, ...Array(23).fill(0)] }),
    );
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('vent');
    expect(result[0].severity).toBe('severe');
  });

  it('detecte une alerte vent moderate pour des rafales > 60 km/h', () => {
    const result = analyzer.analyze(
      buildForecast({ wind_gusts_10m: [65, ...Array(23).fill(0)] }),
    );
    expect(result[0].severity).toBe('moderate');
  });

  it('detecte une alerte pluie severe pour > 30 mm/h', () => {
    const result = analyzer.analyze(
      buildForecast({ precipitation: [35, ...Array(23).fill(0)] }),
    );
    expect(result[0].type).toBe('pluie');
    expect(result[0].severity).toBe('severe');
  });

  it('detecte une alerte temperature severe pour > 40°C', () => {
    const result = analyzer.analyze(
      buildForecast({ temperature_2m: [42, ...Array(23).fill(20)] }),
    );
    expect(result[0].type).toBe('temperature');
    expect(result[0].severity).toBe('severe');
    expect(result[0].headline).toBe('Chaleur extreme');
  });

  it('detecte une alerte temperature severe pour < -15°C', () => {
    const result = analyzer.analyze(
      buildForecast({ temperature_2m: [-18, ...Array(23).fill(20)] }),
    );
    expect(result[0].headline).toBe('Froid extreme');
  });

  it('detecte une alerte orage pour weather code >= 95', () => {
    const result = analyzer.analyze(
      buildForecast({ weather_code: [96, ...Array(23).fill(0)] }),
    );
    expect(result[0].type).toBe('orage');
    expect(result[0].severity).toBe('severe');
  });

  it('deduplique les alertes de meme type+severite', () => {
    const result = analyzer.analyze(
      buildForecast({ wind_gusts_10m: [85, 90, 95, ...Array(21).fill(0)] }),
    );
    const ventSevere = result.filter(
      (a) => a.type === 'vent' && a.severity === 'severe',
    );
    expect(ventSevere).toHaveLength(1);
  });

  it('genere des alertes multiples de types differents', () => {
    const result = analyzer.analyze(
      buildForecast({
        wind_gusts_10m: [85, ...Array(23).fill(0)],
        precipitation: [35, ...Array(23).fill(0)],
      }),
    );
    const types = result.map((a) => a.type);
    expect(types).toContain('vent');
    expect(types).toContain('pluie');
  });

  it("limite l'analyse aux 24 premieres heures", () => {
    const forecast = buildForecast();
    // Ajouter des donnees au-dela de 24h
    forecast.hourly.time.push('2026-04-05T00:00');
    forecast.hourly.wind_gusts_10m!.push(100);
    forecast.hourly.temperature_2m.push(20);
    forecast.hourly.weather_code.push(0);
    forecast.hourly.wind_speed_10m.push(10);
    forecast.hourly.precipitation.push(0);

    const result = analyzer.analyze(forecast);
    // Le vent a 100 km/h en heure 25 ne doit pas generer d'alerte
    expect(result).toEqual([]);
  });
});
