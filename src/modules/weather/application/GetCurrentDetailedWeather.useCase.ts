import { Inject, Injectable } from '@nestjs/common';
import type {
  DetailedCurrentWeather,
  IOpenWeatherMapProxy,
} from '../domain/IOpenWeatherMapProxy.port';
import { OPENWEATHERMAP_PROXY } from '../domain/token';

/** Cas d'utilisation : recuperation des donnees meteo detaillees courantes via OpenWeatherMap. */
@Injectable()
export class GetCurrentDetailedWeatherUseCase {
  constructor(
    @Inject(OPENWEATHERMAP_PROXY)
    private readonly proxy: IOpenWeatherMapProxy,
  ) {}

  /** Delegue la recuperation des donnees meteo detaillees courantes au proxy OWM. */
  async execute(
    latitude: number,
    longitude: number,
  ): Promise<DetailedCurrentWeather> {
    return this.proxy.getCurrentDetailed(latitude, longitude);
  }
}
