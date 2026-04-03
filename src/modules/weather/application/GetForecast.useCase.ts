import { Inject, Injectable } from '@nestjs/common';
import type {
  ForecastResult,
  IWeatherProxy,
} from '../domain/IWeatherProxy.port';
import { WEATHER_PROXY } from '../domain/token';
import type { ForecastQueryCommand } from './dto/ForecastQuery.command';

/** Cas d'utilisation : recuperation des previsions meteo. */
@Injectable()
export class GetForecastUseCase {
  constructor(@Inject(WEATHER_PROXY) private readonly proxy: IWeatherProxy) {}

  /** Delegue la recuperation des previsions au proxy meteo. */
  async execute(command: ForecastQueryCommand): Promise<ForecastResult> {
    return this.proxy.getForecast(
      command.latitude,
      command.longitude,
      command.timezone,
      command.forecastDays,
    );
  }
}
