import { buildSessionRecord } from '../../../../test/factories/formation.factory';
import { etatEnDirect } from './EtatEnDirect';

describe('etatEnDirect', () => {
  it('projette la séance et son nombre de participants dans l état diffusé', () => {
    const majLe = new Date('2026-10-10T09:00:00Z');
    const seance = buildSessionRecord({
      etat: 'en_cours',
      modeRythme: 'libre',
      ecranCourant: 3,
      intervalleLibre: { premier: 1, dernier: 4 },
      pilotageEcrans: { 'E-1': { revele: true } },
      revision: 7,
      majLe,
    });

    expect(etatEnDirect(seance, 12)).toEqual({
      etat: 'en_cours',
      modeRythme: 'libre',
      ecranCourant: 3,
      intervalleLibre: { premier: 1, dernier: 4 },
      participants: 12,
      revision: 7,
      pilotage: { 'E-1': { revele: true } },
      majLe,
    });
  });
});
