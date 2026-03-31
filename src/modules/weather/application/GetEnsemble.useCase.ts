import { Inject, Injectable } from '@nestjs/common';
import type {
  EnsembleResult,
  IWeatherProxy,
} from '../domain/IWeatherProxy.port';
import { WEATHER_PROXY } from '../domain/token';
import type { EnsembleQueryCommand } from './dto/EnsembleQuery.command';

/** Cas d'utilisation : recuperation des previsions d'ensemble multi-modeles. */
@Injectable()
export class GetEnsembleUseCase {
  constructor(@Inject(WEATHER_PROXY) private readonly proxy: IWeatherProxy) {}

  /** Delegue la recuperation des previsions d'ensemble au proxy meteo. */
  async execute(command: EnsembleQueryCommand): Promise<EnsembleResult> {
    return this.proxy.getEnsemble(command.latitude, command.longitude);
  }
}
