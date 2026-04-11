import { Inject, Injectable } from '@nestjs/common';
import type {
  DetailedForecastResult,
  IOpenWeatherMapProxy,
} from '../domain/IOpenWeatherMapProxy.port';
import { OPENWEATHERMAP_PROXY } from '../domain/token';

/** Cas d'utilisation : recuperation des previsions detaillees via OpenWeatherMap. */
@Injectable()
export class GetForecastDetailedWeatherUseCase {
  constructor(
    @Inject(OPENWEATHERMAP_PROXY)
    private readonly proxy: IOpenWeatherMapProxy,
  ) {}

  /** Delegue la recuperation des previsions detaillees au proxy OWM. */
  async execute(
    latitude: number,
    longitude: number,
  ): Promise<DetailedForecastResult> {
    return this.proxy.getForecastDetailed(latitude, longitude);
  }
}
