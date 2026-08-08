import {
  buildDetailedCurrentWeather,
  buildDetailedDailyItem,
  buildDetailedForecastResult,
  buildDetailedHourlyItem,
} from '../../../../../test/factories/weather.factory';
import { DetailedCurrentWeatherDto } from './DetailedCurrentWeather.dto';
import { DetailedForecastDto } from './DetailedForecast.dto';

/**
 * Verrou du contrat HTTP des endpoints meteo detailles.
 *
 * Les noms de champs ci-dessous sont publies : le frontend les consomme
 * tels quels (portfolio-2025-front/src/app/core/models/weather.model.ts).
 * Renommer un champ du domaine ne doit JAMAIS changer ces cles.
 */
describe('Contrat HTTP des DTO meteo detailles', () => {
  const CURRENT_WIRE_KEYS = [
    'temperature',
    'feelsLike',
    'minTemp',
    'maxTemp',
    'humidity',
    'seaLevelPressure',
    'groundLevelPressure',
    'windSpeed',
    'windGust',
    'windDirection',
    'cloudCover',
    'visibility',
    'rain1h',
    'snow1h',
    'precipitationProbability',
    'conditionId',
    'conditionName',
    'conditionText',
    'conditionIcon',
    'sunrise',
    'sunset',
    'isDaytime',
    'partOfDay',
    'timezoneOffset',
  ];

  const HOURLY_WIRE_KEYS = [
    'time',
    'temperature',
    'feelsLike',
    'humidity',
    'seaLevelPressure',
    'groundLevelPressure',
    'windSpeed',
    'windGust',
    'windDirection',
    'cloudCover',
    'visibility',
    'rain3h',
    'snow3h',
    'precipitationProbability',
    'conditionId',
    'conditionName',
    'conditionText',
    'conditionIcon',
    'partOfDay',
  ];

  const DAILY_WIRE_KEYS = [
    'date',
    'minTemp',
    'maxTemp',
    'conditionId',
    'conditionName',
    'conditionText',
    'conditionIcon',
  ];

  const FORECAST_WIRE_KEYS = [
    'cityName',
    'country',
    'latitude',
    'longitude',
    'timezoneOffset',
    'hourly',
    'daily',
  ];

  function serialize(dto: unknown): Record<string, unknown> {
    return JSON.parse(JSON.stringify(dto)) as Record<string, unknown>;
  }

  function alphabetical(keys: string[]): string[] {
    return [...keys].sort((a, b) => a.localeCompare(b));
  }

  describe('GET /weather/current-detailed', () => {
    it('expose exactement les cles publiees', () => {
      const payload = serialize(
        DetailedCurrentWeatherDto.fromDomain(buildDetailedCurrentWeather()),
      );

      expect(alphabetical(Object.keys(payload))).toEqual(
        alphabetical(CURRENT_WIRE_KEYS),
      );
    });

    it('publie la visibilite en kilometres et le vent en km/h', () => {
      const payload = serialize(
        DetailedCurrentWeatherDto.fromDomain(
          buildDetailedCurrentWeather({
            visibilityKm: 8,
            windSpeedKmh: 15,
            windGustKmh: 25,
            seaLevelPressureHpa: 1015,
            timezoneOffsetSeconds: 3600,
          }),
        ),
      );

      expect(payload.visibility).toBe(8);
      expect(payload.windSpeed).toBe(15);
      expect(payload.windGust).toBe(25);
      expect(payload.seaLevelPressure).toBe(1015);
      expect(payload.timezoneOffset).toBe(3600);
    });
  });

  describe('GET /weather/forecast-detailed', () => {
    it('expose exactement les cles publiees a la racine', () => {
      const payload = serialize(
        DetailedForecastDto.fromDomain(buildDetailedForecastResult()),
      );

      expect(alphabetical(Object.keys(payload))).toEqual(
        alphabetical(FORECAST_WIRE_KEYS),
      );
    });

    it('expose exactement les cles publiees pour un item horaire', () => {
      const payload = serialize(
        DetailedForecastDto.fromDomain(
          buildDetailedForecastResult({
            hourly: [buildDetailedHourlyItem({ visibilityKm: 8 })],
          }),
        ),
      );

      const [hourly] = payload.hourly as Record<string, unknown>[];
      expect(alphabetical(Object.keys(hourly))).toEqual(
        alphabetical(HOURLY_WIRE_KEYS),
      );
      expect(hourly.visibility).toBe(8);
    });

    it('expose exactement les cles publiees pour un item journalier', () => {
      const payload = serialize(
        DetailedForecastDto.fromDomain(
          buildDetailedForecastResult({
            daily: [buildDetailedDailyItem()],
          }),
        ),
      );

      const [daily] = payload.daily as Record<string, unknown>[];
      expect(alphabetical(Object.keys(daily))).toEqual(
        alphabetical(DAILY_WIRE_KEYS),
      );
    });
  });
});
