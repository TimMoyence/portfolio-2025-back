import { B2_COURS_V3 } from '../../../../migrations/data/b2-v3.cours';
import {
  activitesLibres,
  assertEcranServi,
  dernierEcranServi,
  rangDeLEcran,
} from '../../domain/cours/EcranServi';
import type { DiffusionDeSeance } from '../../domain/cours/EcranServi';
import { lireCoursStocke } from '../../domain/cours/CoursStocke';
import { EcranNonServiError } from '../../domain/errors/FormationErrors';

const COURS = lireCoursStocke(B2_COURS_V3);
const TOTAL = COURS.ecrans.length;

function seancePilotee(ecranCourant: number): DiffusionDeSeance {
  return {
    etat: 'en_cours',
    modeRythme: 'pilote',
    ecranCourant,
    intervalleLibre: null,
  };
}

describe('garde « écran servi » sur la V3 (B20, AC-19)', () => {
  it('refuse toute écriture visant un écran que le formateur n’a pas atteint', () => {
    const rangDuCoffre = rangDeLEcran(COURS, 'B2-01-A6-02-COFFRE');

    expect(rangDuCoffre).toBeGreaterThan(0);
    expect(() => {
      assertEcranServi(
        seancePilotee(rangDuCoffre - 1),
        rangDuCoffre,
        'B2-01-A6-02-COFFRE',
        TOTAL,
      );
    }).toThrow(EcranNonServiError);
  });

  it('laisse passer l’écriture dès que l’écran est projeté', () => {
    const rangDuCoffre = rangDeLEcran(COURS, 'B2-01-A6-02-COFFRE');

    expect(() => {
      assertEcranServi(
        seancePilotee(rangDuCoffre),
        rangDuCoffre,
        'B2-01-A6-02-COFFRE',
        TOTAL,
      );
    }).not.toThrow();
  });

  it('refuse un identifiant d’écran qui n’appartient pas au cours', () => {
    expect(rangDeLEcran(COURS, 'B2-01-A9-99-INVENTE')).toBe(-1);
    expect(() => {
      assertEcranServi(
        seancePilotee(TOTAL - 1),
        rangDeLEcran(COURS, 'B2-01-A9-99-INVENTE'),
        'B2-01-A9-99-INVENTE',
        TOTAL,
      );
    }).toThrow(EcranNonServiError);
  });

  it('sert tous les écrans une fois la séance terminée', () => {
    expect(
      dernierEcranServi({ ...seancePilotee(0), etat: 'terminee' }, TOTAL),
    ).toBe(TOTAL - 1);
  });

  it('n’admet que les activités libres déclarées par les écrans de la V3', () => {
    const admises = activitesLibres(COURS);

    expect(admises.get('B2-01-A1-01-DIAGNOSTIC')).toEqual([
      'b2-01-a1-diagnostic:rappel',
    ]);
    expect(admises.get('B2-01-A1-08-QUESTION-DE-GESTION')).toEqual([
      'b2-01-a1-question-gestion',
    ]);
    expect(admises.has('B2-01-A2-02-ORIGINE-AXE')).toBe(false);
  });

  it('admet une activité par étape des exemples travaillés', () => {
    const admises = activitesLibres(COURS);
    const etapes = admises.get('B2-01-A2-06-POINTS') ?? [];

    expect(etapes.length).toBeGreaterThan(0);
    for (const activite of etapes) {
      expect(activite).toMatch(/^[a-z0-9-]+:[a-z0-9-]+$/);
    }
  });

  it('n’admet aucune activité libre sur un écran de production', () => {
    expect(activitesLibres(COURS).has('B2-01-A4-02-FEUILLE-CANAUX')).toBe(
      false,
    );
  });
});
