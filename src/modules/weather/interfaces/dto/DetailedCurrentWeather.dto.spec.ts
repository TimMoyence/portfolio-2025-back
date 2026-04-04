import { buildDetailedCurrentWeather } from '../../../../../test/factories/weather.factory';
import { DetailedCurrentWeatherDto } from './DetailedCurrentWeather.dto';

describe('DetailedCurrentWeatherDto', () => {
  it('devrait mapper correctement depuis le domaine', () => {
    const domain = buildDetailedCurrentWeather({
      temperature: 22.3,
      feelsLike: 21.0,
      minTemp: 18.0,
      maxTemp: 25.0,
      humidity: 55,
      windSpeed: 15.4,
      conditionName: 'Clouds',
      conditionText: 'nuageux',
      isDaytime: true,
      partOfDay: 'd',
      timezoneOffset: 7200,
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

  it('devrait copier tous les champs du domaine', () => {
    const domain = buildDetailedCurrentWeather();

    const dto = DetailedCurrentWeatherDto.fromDomain(domain);

    // Verifie que chaque propriete du domaine est presente dans le DTO
    for (const key of Object.keys(domain)) {
      expect(dto).toHaveProperty(key, domain[key as keyof typeof domain]);
    }
  });
});
