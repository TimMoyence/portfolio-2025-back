import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EnvoyerLesDiffusionsDuesUseCase } from '../application/diffusion/EnvoyerLesDiffusionsDues.useCase';

@Injectable()
export class PlanificateurDesDiffusionsService {
  constructor(private readonly envoi: EnvoyerLesDiffusionsDuesUseCase) {}

  @Cron(CronExpression.EVERY_MINUTE, {
    name: 'diffusions-dues',
    waitForCompletion: true,
  })
  envoyerLesDues(): Promise<void> {
    return this.envoi.executer(new Date());
  }
}
