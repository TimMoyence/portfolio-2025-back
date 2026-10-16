import {
  promesseSuspendue,
  reglementAuPlancher,
  RETENUE_JUSQU_AU_PLANCHER,
  simulerLHorlogeAChaqueTest,
} from '../../../test/helpers/plancher-de-latence';
import { aHeureFixe, avecUnPlancherDeLatence } from './plancher-de-latence';

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

describe('aHeureFixe', () => {
  simulerLHorlogeAChaqueTest();

  const journal = () => ({ warn: jest.fn<void, [string]>() });

  it('rend au plancher la reponse prevue quand le travail dure plus longtemps', async () => {
    const travail = promesseSuspendue<string>();
    const reponse = aHeureFixe(
      () => travail.promesse,
      'prevue',
      'Echec tardif',
      journal(),
    );

    expect(await reglementAuPlancher(reponse)).toEqual(
      RETENUE_JUSQU_AU_PLANCHER,
    );
    await expect(reponse).resolves.toBe('prevue');
  });

  it('retient le resultat d un travail fini avant le plancher puis le rend', async () => {
    const reponse = aHeureFixe(
      () => Promise.resolve('fait'),
      'prevue',
      'Echec tardif',
      journal(),
    );

    expect(await reglementAuPlancher(reponse)).toEqual(
      RETENUE_JUSQU_AU_PLANCHER,
    );
    await expect(reponse).resolves.toBe('fait');
  });

  it('retient l echec d un travail fini avant le plancher puis le relance tel quel', async () => {
    const panne = new Error('panne');
    const reponse = aHeureFixe(
      () => Promise.reject(panne),
      'prevue',
      'Echec tardif',
      journal(),
    );
    const relance = expect(reponse).rejects.toBe(panne);

    expect(await reglementAuPlancher(reponse)).toEqual(
      RETENUE_JUSQU_AU_PLANCHER,
    );
    await relance;
  });

  it('journalise l echec d un travail qui finit apres la reponse', async () => {
    const travail = promesseSuspendue<string>();
    const echecs = journal();
    const reponse = aHeureFixe(
      () => travail.promesse,
      'prevue',
      'Echec tardif',
      echecs,
    );
    await reglementAuPlancher(reponse);

    travail.rompre(new Error('verrou perdu'));
    await jest.advanceTimersByTimeAsync(0);

    expect(echecs.warn).toHaveBeenCalledWith('Echec tardif: verrou perdu');
  });
});
