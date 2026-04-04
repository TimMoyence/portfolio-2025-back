/* eslint-disable @typescript-eslint/unbound-method */
import type { Request } from 'express';
import { WeatherController } from './Weather.controller';
import type { GetGeocodingUseCase } from '../application/GetGeocoding.useCase';
import type { GetForecastUseCase } from '../application/GetForecast.useCase';
import type { GetAirQualityUseCase } from '../application/GetAirQuality.useCase';
import type { GetEnsembleUseCase } from '../application/GetEnsemble.useCase';
import type { GetHistoricalUseCase } from '../application/GetHistorical.useCase';
import type { GetUserPreferencesUseCase } from '../application/GetUserPreferences.useCase';
import type { UpdateUserPreferencesUseCase } from '../application/UpdateUserPreferences.useCase';
import type { RecordUsageUseCase } from '../application/RecordUsage.useCase';
import type { GetWeatherAlertsUseCase } from '../application/GetWeatherAlerts.useCase';
import type { IOpenWeatherMapProxy } from '../domain/IOpenWeatherMapProxy.port';
import {
  buildWeatherPreferences,
  buildForecastResult,
} from '../../../../test/factories/weather.factory';

describe('WeatherController', () => {
  let controller: WeatherController;
  let geocodingUseCase: jest.Mocked<GetGeocodingUseCase>;
  let forecastUseCase: jest.Mocked<GetForecastUseCase>;
  let airQualityUseCase: jest.Mocked<GetAirQualityUseCase>;
  let ensembleUseCase: jest.Mocked<GetEnsembleUseCase>;
  let historicalUseCase: jest.Mocked<GetHistoricalUseCase>;
  let preferencesUseCase: jest.Mocked<GetUserPreferencesUseCase>;
  let updatePreferencesUseCase: jest.Mocked<UpdateUserPreferencesUseCase>;
  let recordUsageUseCase: jest.Mocked<RecordUsageUseCase>;
  let alertsUseCase: jest.Mocked<GetWeatherAlertsUseCase>;
  let owmProxy: jest.Mocked<IOpenWeatherMapProxy>;

  beforeEach(() => {
    geocodingUseCase = { execute: jest.fn() } as any;
    forecastUseCase = { execute: jest.fn() } as any;
    airQualityUseCase = { execute: jest.fn() } as any;
    ensembleUseCase = { execute: jest.fn() } as any;
    historicalUseCase = { execute: jest.fn() } as any;
    preferencesUseCase = { execute: jest.fn() } as any;
    updatePreferencesUseCase = { execute: jest.fn() } as any;
    recordUsageUseCase = { execute: jest.fn() } as any;
    alertsUseCase = { execute: jest.fn() } as any;
    owmProxy = {
      getCurrentDetailed: jest.fn(),
      getForecastDetailed: jest.fn(),
    } as any;

    controller = new WeatherController(
      geocodingUseCase,
      forecastUseCase,
      airQualityUseCase,
      ensembleUseCase,
      historicalUseCase,
      preferencesUseCase,
      updatePreferencesUseCase,
      recordUsageUseCase,
      alertsUseCase,
      owmProxy,
    );
  });

  it('devrait deleguer searchCity au use case geocoding', async () => {
    const mockResult = { results: [] };
    geocodingUseCase.execute.mockResolvedValue(mockResult);

    const result = await controller.searchCity({
      name: 'Paris',
      language: 'fr',
      count: 5,
    });
    expect(result).toEqual(mockResult);
    expect(geocodingUseCase.execute).toHaveBeenCalledWith({
      name: 'Paris',
      language: 'fr',
      count: 5,
    });
  });

  it('devrait deleguer getForecast au use case avec forecastDays', async () => {
    const mockResult = buildForecastResult();
    forecastUseCase.execute.mockResolvedValue(mockResult);

    const result = await controller.getForecast({
      latitude: 48.85,
      longitude: 2.35,
      timezone: 'auto',
      forecastDays: 14,
    });
    expect(result).toEqual(mockResult);
    expect(forecastUseCase.execute).toHaveBeenCalledWith({
      latitude: 48.85,
      longitude: 2.35,
      timezone: 'auto',
      forecastDays: 14,
    });
  });

  it('devrait deleguer getPreferences et mapper en DTO', async () => {
    const domain = buildWeatherPreferences();
    preferencesUseCase.execute.mockResolvedValue(domain);

    const req = { user: { sub: 'user-1' } } as unknown as Request;
    const result = await controller.getPreferences(req);

    expect(result.id).toBe(domain.id);
    expect(result.level).toBe(domain.level);
    expect(preferencesUseCase.execute).toHaveBeenCalledWith('user-1');
  });

  it('devrait deleguer updatePreferences avec les unites', async () => {
    const domain = buildWeatherPreferences();
    updatePreferencesUseCase.execute.mockResolvedValue(domain);

    const req = { user: { sub: 'user-1' } } as unknown as Request;
    const result = await controller.updatePreferences(req, {
      level: 'curious',
      units: { temperature: 'fahrenheit' },
    });

    expect(result.level).toBe(domain.level);
    expect(updatePreferencesUseCase.execute).toHaveBeenCalledWith({
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
    recordUsageUseCase.execute.mockResolvedValue(undefined);

    const req = { user: { sub: 'user-1' } } as unknown as Request;
    await controller.recordUsage(req);

    expect(recordUsageUseCase.execute).toHaveBeenCalledWith({
      userId: 'user-1',
    });
  });
});
