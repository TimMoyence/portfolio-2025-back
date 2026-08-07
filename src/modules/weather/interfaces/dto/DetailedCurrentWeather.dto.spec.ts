import { buildDetailedCurrentWeather } from '../../../../../test/factories/weather.factory';
import { DetailedCurrentWeatherDto } from './DetailedCurrentWeather.dto';

describe('DetailedCurrentWeatherDto', () => {
  it('devrait mapper correctement depuis le domaine', () => {
    const domain = buildDetailedCurrentWeather({
      temperatureCelsius: 22.3,
      feelsLikeCelsius: 21.0,
      minTempCelsius: 18.0,
      maxTempCelsius: 25.0,
      humidityPercent: 55,
      windSpeedKmh: 15.4,
      conditionName: 'Clouds',
      conditionText: 'nuageux',
      isDaytime: true,
      partOfDay: 'd',
      timezoneOffsetSeconds: 7200,
    });

    const dto = DetailedCurrentWeatherDto.fromDomain(domain);

    expect(dto.temperature).toBe(22.3);
    expect(dto.feelsLike).toBe(21.0);
    expect(dto.minTemp).toBe(18.0);
    expect(dto.maxTemp).toBe(25.0);
    expect(dto.humidity).toBe(55);
    expect(dto.windSpeed).toBe(15.4);
    expect(dto.conditionName).toBe('Clouds');
    expect(dto.conditionText).toBe('nuageux');
    expect(dto.isDaytime).toBe(true);
    expect(dto.partOfDay).toBe('d');
    expect(dto.timezoneOffset).toBe(7200);
  });

  it('devrait traduire chaque champ du domaine, sans en laisser aucun indefini', () => {
    const domain = buildDetailedCurrentWeather();

    const dto = DetailedCurrentWeatherDto.fromDomain(domain);

    const undefinedFields = Object.entries(dto)
      .filter(([, value]) => value === undefined)
      .map(([key]) => key);
    expect(undefinedFields).toEqual([]);
    expect(Object.keys(dto)).toHaveLength(Object.keys(domain).length);
  });

  it('devrait traduire les noms porteurs d unite vers les noms publies', () => {
    const domain = buildDetailedCurrentWeather({
      visibilityKm: 12,
      windGustKmh: 30,
      groundLevelPressureHpa: 1008,
      rain1hMm: 2.5,
      snow1hMm: 0.5,
      precipitationProbabilityPercent: 80,
      cloudCoverPercent: 75,
      windDirectionDegrees: 90,
      sunriseIso: '2026-03-31T06:00:00.000Z',
      sunsetIso: '2026-03-31T19:30:00.000Z',
    });

    const dto = DetailedCurrentWeatherDto.fromDomain(domain);

    expect(dto.visibility).toBe(12);
    expect(dto.windGust).toBe(30);
    expect(dto.groundLevelPressure).toBe(1008);
    expect(dto.rain1h).toBe(2.5);
    expect(dto.snow1h).toBe(0.5);
    expect(dto.precipitationProbability).toBe(80);
    expect(dto.cloudCover).toBe(75);
    expect(dto.windDirection).toBe(90);
    expect(dto.sunrise).toBe('2026-03-31T06:00:00.000Z');
    expect(dto.sunset).toBe('2026-03-31T19:30:00.000Z');
  });
});
