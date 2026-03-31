import { Inject, Injectable } from '@nestjs/common';
import type {
  GeocodingResult,
  IWeatherProxy,
} from '../domain/IWeatherProxy.port';
import { WEATHER_PROXY } from '../domain/token';
import type { GeocodingQueryCommand } from './dto/GeocodingQuery.command';

/** Cas d'utilisation : recherche de villes par nom. */
@Injectable()
export class GetGeocodingUseCase {
  constructor(@Inject(WEATHER_PROXY) private readonly proxy: IWeatherProxy) {}

  /** Delegue la recherche de geocodage au proxy meteo. */
  async execute(command: GeocodingQueryCommand): Promise<GeocodingResult> {
    return this.proxy.searchCity(command.name, command.language, command.count);
  }
}
