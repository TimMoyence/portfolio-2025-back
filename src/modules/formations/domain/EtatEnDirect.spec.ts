import { buildCoursDeTest } from '../../../../test/factories/cours.factory';
import { buildSessionRecord } from '../../../../test/factories/formation.factory';
import {
  CAS_DES_COURS_SERVIS,
  pilotageDUnCoursServi,
} from '../../../../test/factories/votes-des-cours-servis.factory';
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

    expect(etatEnDirect(seance, 12, buildCoursDeTest())).toEqual({
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

  it.each(CAS_DES_COURS_SERVIS)(
    'QA-01 · %s : diffuse la phase « vote » de chaque vote jumelé encore non piloté',
    (_slug, cours) => {
      const { pilotageEcrans, attendu } = pilotageDUnCoursServi(cours);

      expect(
        etatEnDirect(buildSessionRecord({ pilotageEcrans }), 0, cours).pilotage,
      ).toEqual(attendu);
    },
  );
});
