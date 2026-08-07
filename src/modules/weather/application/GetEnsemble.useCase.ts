import { Inject, Injectable } from '@nestjs/common';
import type {
  EnsembleResult,
  IWeatherProxy,
} from '../domain/IWeatherProxy.port';
import { WEATHER_PROXY } from '../domain/token';
import type { EnsembleQueryCommand } from './dto/EnsembleQuery.command';

@Injectable()
export class GetEnsembleUseCase {
  constructor(@Inject(WEATHER_PROXY) private readonly proxy: IWeatherProxy) {}

  async execute(command: EnsembleQueryCommand): Promise<EnsembleResult> {
    return this.proxy.getEnsemble(command.latitude, command.longitude);
  }
}
