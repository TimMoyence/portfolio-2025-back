import {
  promesseSuspendue,
  rendueAuPlancher,
  simulerLHorlogeAChaqueTest,
} from '../../../test/helpers/plancher-de-latence';
import { aHeureFixe, avecUnPlancherDeLatence } from './plancher-de-latence';

simulerLHorlogeAChaqueTest();

const journal = () => ({ warn: jest.fn<void, [string]>() });

const repondreAHeureFixe = (
  travail: () => Promise<string>,
  echecs = journal(),
): Promise<string> => aHeureFixe(travail, 'prevue', 'Echec tardif', echecs);

describe.each([
  [
    'avecUnPlancherDeLatence',
    (travail: () => Promise<string>) => avecUnPlancherDeLatence(travail),
  ],
  ['aHeureFixe', repondreAHeureFixe],
])('%s', (_nom, repondre) => {
  it('retient le resultat d un travail fini avant le plancher puis le rend', async () => {
    await expect(
      rendueAuPlancher(repondre(() => Promise.resolve('fait'))),
    ).resolves.toBe('fait');
  });

  it('retient l echec d un travail fini avant le plancher puis le relance tel quel', async () => {
    const panne = new Error('panne');

    await expect(
      rendueAuPlancher(repondre(() => Promise.reject(panne))),
    ).rejects.toBe(panne);
  });
});

describe('avecUnPlancherDeLatence', () => {
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
  it('rend au plancher la reponse prevue quand le travail dure plus longtemps', async () => {
    const travail = promesseSuspendue<string>();

    await expect(
      rendueAuPlancher(repondreAHeureFixe(() => travail.promesse)),
    ).resolves.toBe('prevue');
  });

  it('journalise l echec d un travail qui finit apres la reponse', async () => {
    const travail = promesseSuspendue<string>();
    const echecs = journal();
    await rendueAuPlancher(repondreAHeureFixe(() => travail.promesse, echecs));

    travail.rompre(new Error('verrou perdu'));
    await jest.advanceTimersByTimeAsync(0);

    expect(echecs.warn).toHaveBeenCalledWith('Echec tardif: verrou perdu');
  });
});
