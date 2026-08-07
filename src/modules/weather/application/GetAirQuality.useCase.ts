import { Inject, Injectable } from '@nestjs/common';
import type {
  AirQualityResult,
  IWeatherProxy,
} from '../domain/IWeatherProxy.port';
import { WEATHER_PROXY } from '../domain/token';
import type { AirQualityQueryCommand } from './dto/AirQualityQuery.command';

@Injectable()
export class GetAirQualityUseCase {
  constructor(@Inject(WEATHER_PROXY) private readonly proxy: IWeatherProxy) {}

  async execute(command: AirQualityQueryCommand): Promise<AirQualityResult> {
    return this.proxy.getAirQuality(command.latitude, command.longitude);
  }
}
