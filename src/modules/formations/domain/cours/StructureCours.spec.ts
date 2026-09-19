import { buildCoursDeTest } from '../../../../../test/factories/cours.factory';
import type { Cours, Ecran } from './Cours';
import { REGLES_STRUCTURE, verifierStructure } from './StructureCours';

const citation = (id: string, dureeMinutes: number): Ecran => ({
  id,
  brique: 'fp-quote',
  dureeMinutes,
  concepts: ['proportion'],
  notes: '',
  proprietes: { texte: 't', auteur: null, source: null },
});

function regles(cours: Cours): string[] {
  return verifierStructure(cours).map((violation) => violation.regle);
}

describe('verifierStructure', () => {
  const base = buildCoursDeTest();
  const [ouverture, ...milieu] = base.ecrans;
  const cloture = milieu.pop()!;

  const interactif = (id: string, dureeMinutes: number): Ecran => ({
    ...ouverture,
    id,
    dureeMinutes,
  });

  it('expose les sept regles de structure dans l ordre applique aux violations', () => {
    expect(REGLES_STRUCTURE).toEqual([
      'exposition-continue',
      'ratio-interaction',
      'ouverture-cloture',
      'duree-ecran',
      'duree-cours',
      'reference-inconnue',
      'reference-circulaire',
    ]);
  });

  it('accepte un cours conforme', () => {
    expect(verifierStructure(base)).toEqual([]);
  });

  it('accepte un cours de lecture sans rappel, exit ticket ni interaction', () => {
    const cours: Cours = {
      ...base,
      dureeMinutes: 8,
      ecrans: [citation('LECTURE', 8)],
      remediations: {},
    };
    expect(verifierStructure(cours)).toEqual([]);
  });

  it('refuse sept minutes d exposition d affilee et accepte six', () => {
    const sept: Cours = {
      ...base,
      dureeMinutes: base.dureeMinutes + 4,
      ecrans: [
        ouverture,
        citation('A', 2),
        citation('B', 2),
        ...milieu,
        cloture,
      ],
    };
    const six: Cours = {
      ...base,
      dureeMinutes: base.dureeMinutes + 3,
      ecrans: [
        ouverture,
        citation('A', 2),
        citation('B', 1),
        ...milieu,
        cloture,
      ],
    };
    expect(regles(sept)).toContain('exposition-continue');
    expect(regles(six)).not.toContain('exposition-continue');
  });

  it('exige l ouverture par un rappel et la cloture par un exit ticket', () => {
    const inverse: Cours = { ...base, ecrans: [cloture, ...milieu, ouverture] };
    expect(
      regles(inverse).filter((regle) => regle === 'ouverture-cloture'),
    ).toHaveLength(2);
  });

  it('refuse une remediation vers un ecran absent', () => {
    const cours: Cours = {
      ...base,
      remediations: { ...base.remediations, 'base-arrivee': 'E-ABSENT' },
    };
    expect(regles(cours)).toContain('reference-inconnue');
  });

  it('leve une violation par une derogation justifiee et signale une derogation vide', () => {
    const decale: Cours = { ...base, dureeMinutes: 100 };
    expect(regles(decale)).toContain('duree-cours');
    expect(
      regles({
        ...decale,
        derogations: [
          { regle: 'duree-cours', raison: 'Séance raccourcie par l’école.' },
        ],
      }),
    ).toEqual([]);
    expect(
      regles({
        ...decale,
        derogations: [{ regle: 'duree-cours', raison: '  ' }],
      }),
    ).toEqual(['duree-cours', 'derogation-sans-justification']);
  });

  it('accepte un ratio interaction sur exposition de 0,30 exactement et refuse 0,29', () => {
    const limite: Cours = {
      ...base,
      dureeMinutes: 30 + 100,
      ecrans: [interactif('E-RATIO-INTER', 30), citation('E-RATIO-EXPO', 100)],
      remediations: {},
    };
    const insuffisant: Cours = {
      ...base,
      dureeMinutes: 29 + 100,
      ecrans: [interactif('E-RATIO-INTER', 29), citation('E-RATIO-EXPO', 100)],
      remediations: {},
    };
    expect(regles(limite)).not.toContain('ratio-interaction');
    expect(regles(insuffisant)).toContain('ratio-interaction');
  });

  it('refuse un ecran de duree nulle et accepte une duree strictement positive', () => {
    const nulle: Cours = {
      ...base,
      dureeMinutes: 5 + 0 + 5,
      ecrans: [ouverture, citation('E-DUREE-NULLE', 0), cloture],
    };
    const positive: Cours = {
      ...base,
      dureeMinutes: 5 + 1 + 5,
      ecrans: [ouverture, citation('E-DUREE-POSITIVE', 1), cloture],
    };
    expect(regles(nulle)).toContain('duree-ecran');
    expect(regles(positive)).not.toContain('duree-ecran');
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY, -1])(
    'refuse une duree %s pour un ecran comme pour le cours, sans la compter',
    (duree) => {
      const ecranFautif: Cours = {
        ...base,
        dureeMinutes: 5 + 5,
        ecrans: [ouverture, citation('E-DUREE-FAUTIVE', duree), cloture],
      };
      const coursFautif: Cours = { ...base, dureeMinutes: duree };

      expect(regles(ecranFautif)).toContain('duree-ecran');
      expect(regles(ecranFautif)).not.toContain('duree-cours');
      expect(regles(coursFautif)).toContain('duree-cours');
    },
  );

  it('signale une reference circulaire entre deux ecrans qui se renvoient l un a l autre', () => {
    const travailleA: Ecran = {
      id: 'E-TRAVAIL-A',
      brique: 'fp-worked',
      dureeMinutes: 5,
      concepts: ['proportion'],
      notes: '',
      proprietes: {
        enonce: 'Étape A',
        etapes: [
          {
            id: 'etape-a',
            intitule: 'Étape',
            raisonnement: 'Raisonnement A',
            invite: 'ref:E-TRAVAIL-B',
          },
        ],
      },
    };
    const travailleB: Ecran = {
      id: 'E-TRAVAIL-B',
      brique: 'fp-worked',
      dureeMinutes: 5,
      concepts: ['proportion'],
      notes: '',
      proprietes: {
        enonce: 'Étape B',
        etapes: [
          {
            id: 'etape-b',
            intitule: 'Étape',
            raisonnement: 'Raisonnement B',
            invite: 'ref:E-TRAVAIL-A',
          },
        ],
      },
    };
    const cours: Cours = {
      ...base,
      dureeMinutes: 5 + 5 + 5 + 5,
      ecrans: [ouverture, travailleA, travailleB, cloture],
    };
    expect(regles(cours)).toContain('reference-circulaire');
  });
});
