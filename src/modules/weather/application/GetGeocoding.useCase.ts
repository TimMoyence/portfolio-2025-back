import { Inject, Injectable } from '@nestjs/common';
import type {
  GeocodingResult,
  IWeatherProxy,
} from '../domain/IWeatherProxy.port';
import { WEATHER_PROXY } from '../domain/token';
import type { GeocodingQueryCommand } from './dto/GeocodingQuery.command';

@Injectable()
export class GetGeocodingUseCase {
  constructor(@Inject(WEATHER_PROXY) private readonly proxy: IWeatherProxy) {}

  async execute(command: GeocodingQueryCommand): Promise<GeocodingResult> {
    return this.proxy.searchCity(command.name, command.language, command.count);
  }
}
