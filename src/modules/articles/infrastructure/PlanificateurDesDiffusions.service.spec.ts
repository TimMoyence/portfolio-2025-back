import {
  CronExpression,
  ScheduleModule,
  SchedulerRegistry,
} from '@nestjs/schedule';
import { Test } from '@nestjs/testing';
import { figerLHeureAChaqueTest } from '../../../../test/helpers/temps/horloge';
import { promesseSuspendue } from '../../../../test/helpers/temps/plancher-de-latence';
import { EnvoyerLesDiffusionsDuesUseCase } from '../application/diffusion/EnvoyerLesDiffusionsDues.useCase';
import { PlanificateurDesDiffusionsService } from './PlanificateurDesDiffusions.service';

const MAINTENANT = new Date('2026-11-12T10:00:00.000Z');

async function planificateurDemarre(executer: jest.Mock) {
  const module = await Test.createTestingModule({
    imports: [ScheduleModule.forRoot()],
    providers: [
      PlanificateurDesDiffusionsService,
      { provide: EnvoyerLesDiffusionsDuesUseCase, useValue: { executer } },
    ],
  }).compile();
  await module.init();
  return {
    module,
    tache: module.get(SchedulerRegistry).getCronJob('diffusions-dues'),
  };
}

describe('PlanificateurDesDiffusionsService', () => {
  figerLHeureAChaqueTest(MAINTENANT);

  it('NL-04 · fait partir chaque minute les diffusions dues a l heure courante', async () => {
    const executer = jest.fn().mockResolvedValue(undefined);
    const { module, tache } = await planificateurDemarre(executer);

    await module.get(PlanificateurDesDiffusionsService).envoyerLesDues();

    expect(tache.cronTime.source).toBe(CronExpression.EVERY_MINUTE);
    expect(executer.mock.calls).toEqual([[MAINTENANT]]);
    await module.close();
  });

  it('NL-16 · ne lance pas un tour de diffusion tant que le precedent n est pas fini', async () => {
    const tour = promesseSuspendue<void>();
    const executer = jest.fn(() => tour.promesse);
    const { module, tache } = await planificateurDemarre(executer);

    const premier = tache.fireOnTick();
    const second = tache.fireOnTick();
    tour.liberer();
    await Promise.all([premier, second]);

    expect(executer.mock.calls).toHaveLength(1);
    await module.close();
  });
});
