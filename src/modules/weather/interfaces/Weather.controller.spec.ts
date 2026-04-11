import type { Request } from 'express';
import { WeatherController } from './Weather.controller';
import type { GetGeocodingUseCase } from '../application/GetGeocoding.useCase';
import type { GetForecastUseCase } from '../application/GetForecast.useCase';
import type { GetAirQualityUseCase } from '../application/GetAirQuality.useCase';
import type { GetCurrentDetailedWeatherUseCase } from '../application/GetCurrentDetailedWeather.useCase';
import type { GetEnsembleUseCase } from '../application/GetEnsemble.useCase';
import type { GetForecastDetailedWeatherUseCase } from '../application/GetForecastDetailedWeather.useCase';
import type { GetHistoricalUseCase } from '../application/GetHistorical.useCase';
import type { GetUserPreferencesUseCase } from '../application/GetUserPreferences.useCase';
import type { UpdateUserPreferencesUseCase } from '../application/UpdateUserPreferences.useCase';
import type { RecordUsageUseCase } from '../application/RecordUsage.useCase';
import type { GetWeatherAlertsUseCase } from '../application/GetWeatherAlerts.useCase';
import {
  buildWeatherPreferences,
  buildForecastResult,
  createMockWeatherUseCases,
  type MockWeatherUseCases,
} from '../../../../test/factories/weather.factory';

describe('WeatherController', () => {
  let controller: WeatherController;
  let useCases: MockWeatherUseCases;

  beforeEach(() => {
    useCases = createMockWeatherUseCases();

    controller = new WeatherController(
      useCases.geocoding as unknown as GetGeocodingUseCase,
      useCases.forecast as unknown as GetForecastUseCase,
      useCases.airQuality as unknown as GetAirQualityUseCase,
      useCases.ensemble as unknown as GetEnsembleUseCase,
      useCases.historical as unknown as GetHistoricalUseCase,
      useCases.preferences as unknown as GetUserPreferencesUseCase,
      useCases.updatePreferences as unknown as UpdateUserPreferencesUseCase,
      useCases.recordUsage as unknown as RecordUsageUseCase,
      useCases.alerts as unknown as GetWeatherAlertsUseCase,
      useCases.currentDetailed as unknown as GetCurrentDetailedWeatherUseCase,
      useCases.forecastDetailed as unknown as GetForecastDetailedWeatherUseCase,
    );
  });

  it('devrait deleguer searchCity au use case geocoding', async () => {
    const mockResult = { results: [] };
    useCases.geocoding.execute.mockResolvedValue(mockResult);

    const result = await controller.searchCity({
      name: 'Paris',
      language: 'fr',
      count: 5,
    });
    expect(result).toEqual(mockResult);
    expect(useCases.geocoding.execute).toHaveBeenCalledWith({
      name: 'Paris',
      language: 'fr',
      count: 5,
    });
  });

  it('devrait deleguer getForecast au use case avec forecastDays', async () => {
    const mockResult = buildForecastResult();
    useCases.forecast.execute.mockResolvedValue(mockResult);

    const result = await controller.getForecast({
      latitude: 48.85,
      longitude: 2.35,
      timezone: 'auto',
      forecastDays: 14,
    });
    expect(result).toEqual(mockResult);
    expect(useCases.forecast.execute).toHaveBeenCalledWith({
      latitude: 48.85,
      longitude: 2.35,
      timezone: 'auto',
      forecastDays: 14,
    });
  });

  it('devrait deleguer getPreferences et mapper en DTO', async () => {
    const domain = buildWeatherPreferences();
    useCases.preferences.execute.mockResolvedValue(domain);

    const req = { user: { sub: 'user-1' } } as unknown as Request;
    const result = await controller.getPreferences(req);

    expect(result.id).toBe(domain.id);
    expect(result.level).toBe(domain.level);
    expect(useCases.preferences.execute).toHaveBeenCalledWith('user-1');
  });

  it('devrait deleguer updatePreferences avec les unites', async () => {
    const domain = buildWeatherPreferences();
    useCases.updatePreferences.execute.mockResolvedValue(domain);

    const req = { user: { sub: 'user-1' } } as unknown as Request;
    const result = await controller.updatePreferences(req, {
      level: 'curious',
      units: { temperature: 'fahrenheit' },
    });

    expect(result.level).toBe(domain.level);
    expect(useCases.updatePreferences.execute).toHaveBeenCalledWith({
      userId: 'user-1',
      level: 'curious',
      favoriteCities: undefined,
      defaultCityIndex: undefined,
      tooltipsSeen: undefined,
      units: { temperature: 'fahrenheit' },
      overviewGranularity: undefined,
    });
  });

  it('devrait deleguer recordUsage', async () => {
    useCases.recordUsage.execute.mockResolvedValue(undefined);

    const req = { user: { sub: 'user-1' } } as unknown as Request;
    await controller.recordUsage(req);

    expect(useCases.recordUsage.execute).toHaveBeenCalledWith({
      userId: 'user-1',
    });
  });
});
