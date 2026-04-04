import {
  buildDetailedForecastResult,
  buildDetailedHourlyItem,
  buildDetailedDailyItem,
} from '../../../../../test/factories/weather.factory';
import { DetailedForecastDto } from './DetailedForecast.dto';

describe('DetailedForecastDto', () => {
  it('devrait mapper correctement depuis le domaine', () => {
    const hourly = [
      buildDetailedHourlyItem({ time: '2026-03-31T12:00:00.000Z' }),
      buildDetailedHourlyItem({ time: '2026-03-31T15:00:00.000Z' }),
    ];
    const daily = [
      buildDetailedDailyItem({ date: '2026-03-31' }),
      buildDetailedDailyItem({ date: '2026-04-01' }),
    ];
    const domain = buildDetailedForecastResult({
      cityName: 'Lyon',
      country: 'FR',
      latitude: 45.76,
      longitude: 4.84,
      timezoneOffset: 3600,
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
  });

  it('devrait copier tous les champs du domaine', () => {
    const domain = buildDetailedForecastResult();

    const dto = DetailedForecastDto.fromDomain(domain);

    for (const key of Object.keys(domain)) {
      expect(dto).toHaveProperty(key, domain[key as keyof typeof domain]);
    }
  });
});
