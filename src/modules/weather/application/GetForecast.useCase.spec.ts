/* eslint-disable @typescript-eslint/unbound-method */
import { GetForecastUseCase } from './GetForecast.useCase';
import type {
  IWeatherProxy,
  ForecastResult,
} from '../domain/IWeatherProxy.port';

describe('GetForecastUseCase', () => {
  let useCase: GetForecastUseCase;
  let proxy: jest.Mocked<IWeatherProxy>;

  const mockResult: ForecastResult = {
    current: {
      temperature_2m: 18.5,
      weather_code: 0,
      wind_speed_10m: 12.3,
      apparent_temperature: 17.2,
    },
    hourly: {
      time: ['2026-03-31T00:00'],
      temperature_2m: [15.0],
      weather_code: [0],
      wind_speed_10m: [10.0],
      precipitation: [0.0],
    },
    daily: {
      time: ['2026-03-31'],
      weather_code: [0],
      temperature_2m_max: [20.0],
      temperature_2m_min: [10.0],
      sunrise: ['2026-03-31T07:00'],
      sunset: ['2026-03-31T19:30'],
      precipitation_sum: [0.0],
    },
  };

  beforeEach(() => {
    proxy = {
      searchCity: jest.fn(),
      getForecast: jest.fn(),
      getAirQuality: jest.fn(),
      getEnsemble: jest.fn(),
      getHistorical: jest.fn(),
    };
    useCase = new GetForecastUseCase(proxy);
  });

  it('devrait deleguer la recuperation des previsions au proxy meteo', async () => {
    proxy.getForecast.mockResolvedValue(mockResult);

    const result = await useCase.execute({
      latitude: 48.8566,
      longitude: 2.3522,
      timezone: 'Europe/Paris',
    });

    expect(result).toEqual(mockResult);
    expect(proxy.getForecast).toHaveBeenCalledWith(
      48.8566,
      2.3522,
      'Europe/Paris',
    );
    expect(proxy.getForecast).toHaveBeenCalledTimes(1);
  });

  it('devrait propager les erreurs du proxy', async () => {
    proxy.getForecast.mockRejectedValue(new Error('Network error'));

    await expect(
      useCase.execute({ latitude: 48.8566, longitude: 2.3522 }),
    ).rejects.toThrow('Network error');
  });
});
