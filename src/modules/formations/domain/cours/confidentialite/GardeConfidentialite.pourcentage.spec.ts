import {
  buildEcranDeBrique,
  buildProprietesStockees,
} from '../../../../../../test/factories/formations/cours/ecrans-stockes.factory';
import {
  buildNumeriqueStockee,
  buildOptionStockee,
  buildRappelDeCompensation,
  buildVoteStocke,
} from '../../../../../../test/factories/formations/cours/questions-stockees.factory';
import {
  buildCoursConforme,
  fuitesDeConfidentialite as fuites,
  lireEcranStocke,
  recomposer,
} from '../../../../../../test/factories/formations/cours/structure.factory';
import { buildArbreDeDeuxGenerations } from '../../../../../../test/factories/formations/cours/presentation-visuelle.factory';
import type { NumeriqueStockee, VoteStockee } from '../../contrats/cours';

const base = buildCoursConforme();
const [ouverture, , atelier, cloture] = base.ecrans;
const ARBRE = 'B2-01-A1-02-AVANT';

function atelierAvec(question: NumeriqueStockee | VoteStockee) {
  return lireEcranStocke(
    buildEcranDeBrique('questionnaire', {
      screenId: atelier.id,
      titre: 'Atelier',
      proprietes: {
        regime: 'focus',
        ordre: 'fixe',
        intitule: 'Atelier',
        questions: [question],
      },
    }),
  );
}

const exercice = (
  solution: number,
  formePubliee: string,
  unite: NumeriqueStockee['unite'] = '%',
) =>
  atelierAvec(
    buildNumeriqueStockee({
      unite,
      solution,
      tolerance: { type: 'absolue', valeur: unite === '%' ? 0.05 : 0.0005 },
      formePubliee,
    }),
  );

const voteDontLaBonneEst = (bonne: string) =>
  atelierAvec(
    buildVoteStocke({
      options: [
        buildOptionStockee(bonne, null),
        buildOptionStockee('0,375', 'base-arrivee'),
      ],
    }),
  );

function arbreAvant(
  enTete: number,
  sousP: number,
  apres = exercice(12.5, '12,5 %'),
  lecture: { readonly reading?: string } = {},
) {
  const arbre = lireEcranStocke(
    buildEcranDeBrique('fp-story', {
      screenId: ARBRE,
      dureeMinutes: 1,
      proprietes: {
        presentation: {
          version: 2,
          screenId: ARBRE,
          renderer: 'arbre',
          props: buildArbreDeDeuxGenerations(enTete, sousP, lecture),
        },
      },
    }),
  );
  return recomposer(base, [ouverture, arbre, apres, cloture]);
}

describe('garde de confidentialité — une part lue face à une réponse en pourcentage', () => {
  it('CONF-02 refuse un arbre dont un produit 0,125 donne la réponse publiée 12,5 %', () => {
    expect(fuites(arbreAvant(0.5, 0.25))).toEqual([ARBRE]);
  });

  it('CONF-02 refuse un arbre dont une branche 0,125 donne la réponse publiée 12,5 %', () => {
    expect(fuites(arbreAvant(0.125, 0.4))).toEqual([ARBRE]);
  });

  it('CONF-02 accepte un arbre dont aucune part ne donne la réponse en pourcentage', () => {
    expect(fuites(arbreAvant(0.35, 0.24))).toEqual([]);
  });

  it('CONF-02 refuse un arbre dont la lecture écrit 0,425 face à la réponse publiée 42,5 %', () => {
    expect(
      fuites(
        arbreAvant(0.35, 0.24, exercice(42.5, '42,5 %'), {
          reading: 'P(R) vaut 0,425.',
        }),
      ),
    ).toEqual([ARBRE]);
  });

  it.each([
    [42.5, '42,50 %', '%', 'P(R) vaut 42,5 %.'],
    [0.425, '0,425', null, 'P(R) vaut 42,50 %.'],
    [0.425, '0,425', null, 'P(R) vaut 42,5%.'],
    [564.4, '564,40', '€', 'Le coût vaut 564,4 €.'],
    [45.5, '45,5', '%', 'P(R) vaut 0,455.'],
    [32.4, '32,40 sacs par mois', null, 'Le rythme vaut 32,4 sacs.'],
  ] as const)(
    'CONF-02 refuse la réponse %p publiée « %s » (%s), écrite autrement par la lecture « %s »',
    (solution, publiee, unite, reading) => {
      expect(
        fuites(
          arbreAvant(0.35, 0.24, exercice(solution, publiee, unite), {
            reading,
          }),
        ),
      ).toEqual([ARBRE]);
    },
  );

  it('CONF-02 refuse un produit 0,125 face à la réponse en % publiée 12,5, écrite autrement sans son unité', () => {
    expect(fuites(arbreAvant(0.5, 0.25, exercice(12.5, '12,5', '%')))).toEqual([
      ARBRE,
    ]);
  });

  it('CONF-02 accepte une lecture « 42,5 kg » face à la réponse 0,425, que seul un pourcentage écrirait autrement', () => {
    expect(
      fuites(
        arbreAvant(0.35, 0.24, exercice(0.425, '0,425', null), {
          reading: 'Le colis pèse 42,5 kg.',
        }),
      ),
    ).toEqual([]);
  });

  it.each([
    'Le colis pèse 0,425 kg.',
    'La pièce coûte 0,425 €.',
    'La subvention vaut 0,425 M€.',
    'Le prêt dure 0,425 ans.',
    'Le taux vaut 0,425 %.',
  ])(
    'CONF-02 accepte une lecture « %s » face à la réponse publiée 42,5 %, que seule une part nue écrirait autrement',
    (reading) => {
      expect(
        fuites(arbreAvant(0.35, 0.24, exercice(42.5, '42,5 %'), { reading })),
      ).toEqual([]);
    },
  );

  it.each([
    ['P(R) vaut 0,425.', 'en part'],
    ['P(R) vaut 42,5 %.', 'en pourcentage'],
  ])(
    'PCT-03 refuse la lecture « %s » face à la réponse négative −0,425, écrite sans son signe %s',
    (reading) => {
      expect(
        fuites(
          arbreAvant(0.35, 0.24, exercice(-0.425, '−0,425', null), {
            reading,
          }),
        ),
      ).toEqual([ARBRE]);
    },
  );

  it('CONF-02 refuse un arbre dont la lecture écrit 42,5 % face à la réponse publiée 0,425', () => {
    expect(
      fuites(
        arbreAvant(0.35, 0.24, exercice(0.425, '0,425', null), {
          reading: 'P(R) vaut 42,5 %.',
        }),
      ),
    ).toEqual([ARBRE]);
  });
});

describe('garde de confidentialité — un vote dont le bon libellé conclut par un nombre', () => {
  it('CONF-02 refuse un arbre dont un produit donne le nombre qui conclut la bonne option', () => {
    expect(
      fuites(
        arbreAvant(
          0.5,
          0.25,
          voteDontLaBonneEst('P(P ∩ R) = 0,5 × 0,25, soit 0,125'),
        ),
      ),
    ).toEqual([ARBRE]);
  });

  it.each([
    ['P(P ∩ R) = 0,5 × 0,25 = 0,125 (12,5 %)', 'avant sa parenthèse'],
    ['P(P ∩ R) = 0,5 × 0,25, soit 0,125 point', 'avant son unité en mot'],
    ['P(P ∩ R) ≈0,125', 'collé à son signe'],
    [
      'P(P ∩ R) = 0,5 × 0,25 = 0,125 (12,5 %).',
      'avant sa parenthèse et son point',
    ],
    ['P(P ∩ R) = 0,5 × 0,25, soit 12,5 %.', 'en pourcentage avant son point'],
    [
      'P(P ∩ R) = 0,5 × 0,25, soit 12,5 % (arrondi)',
      'en pourcentage avant sa parenthèse',
    ],
    [
      'P(P ∩ R) = 0,5 × 0,25 = 0,125 (soit 12,5 %)',
      'avant une parenthèse qui conclut elle-même',
    ],
    ['P(P ∩ R) = 0,5 × 0,25, soit 12,5 % !', 'avant son point d’exclamation'],
    ...[
      'Environ 12,5 %',
      '12,5 % (arrondi)',
      'P, soit 12,5 % :',
      'Une baisse d’environ 12,5 %',
      'La touche ln, qui affiche environ 0,125',
      'P(P ∩ R) = 0,5 × 0,25, soit 12,5 % des clients',
    ].map((bonne) => [bonne, 'avec ou sans marque']),
  ])(
    'CONF-02 refuse un arbre dont un produit donne le nombre qui conclut « %s », %s, écrit autrement',
    (bonne) => {
      expect(fuites(arbreAvant(0.5, 0.25, voteDontLaBonneEst(bonne)))).toEqual([
        ARBRE,
      ]);
    },
  );

  it('CONF-02 accepte un arbre avant un rappel dont la bonne option conclut par son produit : un rappel ne garde que son libellé entier', () => {
    const rappel = lireEcranStocke(
      buildEcranDeBrique('fp-spaced', {
        screenId: atelier.id,
        dureeMinutes: 3,
        proprietes: {
          ...buildProprietesStockees('fp-spaced'),
          banque: {
            questions: [
              buildRappelDeCompensation(
                'Une baisse d’environ 12,5 %',
                'Une baisse de 20 %',
              ),
            ],
            obligatoires: [],
          },
        },
      }),
    );

    expect(fuites(arbreAvant(0.5, 0.25, rappel))).toEqual([]);
  });

  it('CONF-02 refuse un arbre dont un produit donne le nombre qui conclut « soit environ 0,125 »', () => {
    expect(
      fuites(
        arbreAvant(
          0.5,
          0.25,
          voteDontLaBonneEst('P(P ∩ R) = 0,5 × 0,25, soit environ 0,125'),
        ),
      ),
    ).toEqual([ARBRE]);
  });

  it('CONF-02 refuse une lecture « 2,25 % » face à la bonne option qui conclut par un nombre signé « soit − 2,25 % »', () => {
    expect(
      fuites(
        arbreAvant(
          0.35,
          0.24,
          voteDontLaBonneEst('1,15 × 0,85 − 1, soit − 2,25 %'),
          { reading: 'Le prix baisse de 2,25 %.' },
        ),
      ),
    ).toEqual([ARBRE]);
  });

  it('CONF-02 accepte un arbre face à une bonne option dont aucun nombre n’a trois chiffres significatifs', () => {
    expect(
      fuites(arbreAvant(0.5, 0.2, voteDontLaBonneEst('1 − 0,2, soit 0,8'))),
    ).toEqual([]);
  });
});
