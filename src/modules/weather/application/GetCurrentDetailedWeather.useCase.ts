import { Inject, Injectable } from '@nestjs/common';
import type {
  DetailedCurrentWeather,
  IOpenWeatherMapProxy,
} from '../domain/IOpenWeatherMapProxy.port';
import { OPENWEATHERMAP_PROXY } from '../domain/token';

@Injectable()
export class GetCurrentDetailedWeatherUseCase {
  constructor(
    @Inject(OPENWEATHERMAP_PROXY)
    private readonly proxy: IOpenWeatherMapProxy,
  ) {}

  async execute(
    latitude: number,
    longitude: number,
  ): Promise<DetailedCurrentWeather> {
    return this.proxy.getCurrentDetailed(latitude, longitude);
  }
}
