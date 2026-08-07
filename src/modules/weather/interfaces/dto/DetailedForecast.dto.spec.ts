import {
  buildDetailedForecastResult,
  buildDetailedHourlyItem,
  buildDetailedDailyItem,
} from '../../../../../test/factories/weather.factory';
import { DetailedForecastDto } from './DetailedForecast.dto';

describe('DetailedForecastDto', () => {
  it('devrait mapper correctement depuis le domaine', () => {
    const hourly = [
      buildDetailedHourlyItem({ timeIso: '2026-03-31T12:00:00.000Z' }),
      buildDetailedHourlyItem({ timeIso: '2026-03-31T15:00:00.000Z' }),
    ];
    const daily = [
      buildDetailedDailyItem({ dateIso: '2026-03-31' }),
      buildDetailedDailyItem({ dateIso: '2026-04-01' }),
    ];
    const domain = buildDetailedForecastResult({
      cityName: 'Lyon',
      country: 'FR',
      latitude: 45.76,
      longitude: 4.84,
      timezoneOffsetSeconds: 3600,
      hourly,
      daily,
    });

    const dto = DetailedForecastDto.fromDomain(domain);

    expect(dto.cityName).toBe('Lyon');
    expect(dto.country).toBe('FR');
    expect(dto.latitude).toBe(45.76);
    expect(dto.longitude).toBe(4.84);
    expect(dto.timezoneOffset).toBe(3600);
    expect(dto.hourly).toHaveLength(2);
    expect(dto.daily).toHaveLength(2);
    expect(dto.hourly[0].time).toBe('2026-03-31T12:00:00.000Z');
    expect(dto.daily[0].date).toBe('2026-03-31');
  });

  it('devrait traduire les noms porteurs d unite des items horaires', () => {
    const domain = buildDetailedForecastResult({
      hourly: [
        buildDetailedHourlyItem({
          visibilityKm: 6,
          windSpeedKmh: 18,
          windGustKmh: 33,
          seaLevelPressureHpa: 1011,
          groundLevelPressureHpa: 1007,
          temperatureCelsius: 21,
          feelsLikeCelsius: 20,
          humidityPercent: 70,
          rain3hMm: 1.2,
          snow3hMm: 0,
          precipitationProbabilityPercent: 55,
          cloudCoverPercent: 35,
          windDirectionDegrees: 200,
        }),
      ],
    });

    const [hourly] = DetailedForecastDto.fromDomain(domain).hourly;

    expect(hourly.visibility).toBe(6);
    expect(hourly.windSpeed).toBe(18);
    expect(hourly.windGust).toBe(33);
    expect(hourly.seaLevelPressure).toBe(1011);
    expect(hourly.groundLevelPressure).toBe(1007);
    expect(hourly.temperature).toBe(21);
    expect(hourly.feelsLike).toBe(20);
    expect(hourly.humidity).toBe(70);
    expect(hourly.rain3h).toBe(1.2);
    expect(hourly.snow3h).toBe(0);
    expect(hourly.precipitationProbability).toBe(55);
    expect(hourly.cloudCover).toBe(35);
    expect(hourly.windDirection).toBe(200);
  });

  it('devrait traduire les noms porteurs d unite des items journaliers', () => {
    const domain = buildDetailedForecastResult({
      daily: [
        buildDetailedDailyItem({
          dateIso: '2026-04-02',
          minTempCelsius: 11,
          maxTempCelsius: 24,
        }),
      ],
    });

    const [daily] = DetailedForecastDto.fromDomain(domain).daily;

    expect(daily.date).toBe('2026-04-02');
    expect(daily.minTemp).toBe(11);
    expect(daily.maxTemp).toBe(24);
  });

  it('ne devrait laisser aucun champ indefini sur la charge utile', () => {
    const dto = DetailedForecastDto.fromDomain(buildDetailedForecastResult());

    const undefinedFields = Object.entries(dto)
      .filter(([, value]) => value === undefined)
      .map(([key]) => key);
    expect(undefinedFields).toEqual([]);
  });
});
