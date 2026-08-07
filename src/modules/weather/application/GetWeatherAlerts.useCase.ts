import { Inject, Injectable } from '@nestjs/common';
import { WEATHER_PROXY } from '../domain/token';
import type { IWeatherProxy } from '../domain/IWeatherProxy.port';
import type { WeatherAlertResult } from '../domain/WeatherAlert';
import type { AlertsQuery } from './dto/AlertsQuery.command';

@Injectable()
export class GetWeatherAlertsUseCase {
  constructor(
    @Inject(WEATHER_PROXY)
    private readonly weatherProxy: IWeatherProxy,
  ) {}

  async execute(command: AlertsQuery): Promise<WeatherAlertResult> {
    return this.weatherProxy.getAlerts(command.latitude, command.longitude);
  }
}
