import { Inject, Injectable } from '@nestjs/common';
import type {
  HistoricalResult,
  IWeatherProxy,
} from '../domain/IWeatherProxy.port';
import { WEATHER_PROXY } from '../domain/token';
import type { HistoricalQueryCommand } from './dto/HistoricalQuery.command';

/** Cas d'utilisation : recuperation des donnees meteo historiques. */
@Injectable()
export class GetHistoricalUseCase {
  constructor(@Inject(WEATHER_PROXY) private readonly proxy: IWeatherProxy) {}

  /** Delegue la recuperation des donnees historiques au proxy meteo. */
  async execute(command: HistoricalQueryCommand): Promise<HistoricalResult> {
    return this.proxy.getHistorical(
      command.latitude,
      command.longitude,
      command.startDate,
      command.endDate,
    );
  }
}
