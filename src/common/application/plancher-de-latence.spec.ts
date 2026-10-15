import {
  reglementAuPlancher,
  RETENUE_JUSQU_AU_PLANCHER,
  simulerLHorlogeAChaqueTest,
} from '../../../test/helpers/plancher-de-latence';
import { avecUnPlancherDeLatence } from './plancher-de-latence';

describe('avecUnPlancherDeLatence', () => {
  simulerLHorlogeAChaqueTest();

  it('retient le resultat d un travail immediat jusqu au plancher puis le rend', async () => {
    const reponse = avecUnPlancherDeLatence(() => Promise.resolve('fait'));

    expect(await reglementAuPlancher(reponse)).toEqual(
      RETENUE_JUSQU_AU_PLANCHER,
    );
    await expect(reponse).resolves.toBe('fait');
  });

  it('retient aussi l echec jusqu au plancher puis le relance tel quel', async () => {
    const panne = new Error('panne');
    const reponse = avecUnPlancherDeLatence(() => Promise.reject(panne));
    const relance = expect(reponse).rejects.toBe(panne);

    expect(await reglementAuPlancher(reponse)).toEqual(
      RETENUE_JUSQU_AU_PLANCHER,
    );
    await relance;
  });

  it('ne rallonge pas un travail plus long que le plancher', async () => {
    const reponse = avecUnPlancherDeLatence(
      () =>
        new Promise<string>((resolve) =>
          setTimeout(() => resolve('fait'), 400),
        ),
    );

    await jest.advanceTimersByTimeAsync(400);

    await expect(reponse).resolves.toBe('fait');
  });
});
