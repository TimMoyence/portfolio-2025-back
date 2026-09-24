import {
  buildCoursStocke,
  buildEcranStocke,
} from '../../../../../test/factories/cours-stocke.factory';
import {
  BRIQUES_STOCKEES,
  buildCasAQuestionsLibres,
  buildContenuPubliable,
  buildCoursDeBriques,
  buildEcranDeBrique,
  buildProprietesStockees,
} from '../../../../../test/factories/ecrans-stockes.factory';
import type { Ecran } from '../contrats/cours';
import { creerRng, creerTirage } from './Aleatoire';
import type { EcranDeCoursBrut } from './CoursStocke';
import {
  ContenuDeCoursInvalideError,
  lireContenuAPublier,
  lireCoursStocke,
} from './CoursStocke';

const TIRAGE = creerTirage(creerRng(5));

type Chemin = readonly (string | number)[];

function avecCleInconnue(
  proprietes: Record<string, unknown>,
  chemin: Chemin,
): Record<string, unknown> {
  let cible: unknown = proprietes;
  for (const segment of chemin) {
    cible = (cible as Record<string | number, unknown>)[segment];
  }
  (cible as Record<string, unknown>).intrus = true;
  return proprietes;
}

function avecProprietes(
  brique: string,
  modifier: (proprietes: Record<string, unknown>) => void,
): EcranDeCoursBrut {
  const proprietes = buildProprietesStockees(brique);
  modifier(proprietes);
  return buildEcranDeBrique(brique, { proprietes });
}

function lireEcran(ecran: EcranDeCoursBrut): Ecran {
  return lireCoursStocke(buildCoursDeBriques([ecran])).ecrans[0];
}

function ecranDeBrique<B extends Ecran['brique']>(
  brique: B,
): Extract<Ecran, { readonly brique: B }> {
  const ecran = lireEcran(buildEcranDeBrique(brique));
  if (ecran.brique !== brique) {
    throw new Error(`brique ${ecran.brique} lue au lieu de ${brique}`);
  }
  return ecran as Extract<Ecran, { readonly brique: B }>;
}

describe('stockage multi-briques (B1)', () => {
  it('connaît les dix-sept briques et le questionnaire', () => {
    expect(BRIQUES_STOCKEES).toHaveLength(18);
  });

  it.each(BRIQUES_STOCKEES)('lit un écran %s de la V3', (brique) => {
    const ecran = lireEcran(buildEcranDeBrique(brique));

    expect(ecran).toMatchObject({
      brique,
      titre: `Écran ${brique}`,
      diffusion: 'seance',
    });
  });

  it.each(BRIQUES_STOCKEES)(
    'refuse une clé inconnue dans les propriétés de %s',
    (brique) => {
      expect(() =>
        lireEcran(
          avecProprietes(brique, (proprietes) =>
            avecCleInconnue(proprietes, []),
          ),
        ),
      ).toThrow(ContenuDeCoursInvalideError);
    },
  );

  it.each<readonly [string, Chemin]>([
    ['fp-story', ['video']],
    ['fp-story', ['video', 'sousTitres']],
    ['fp-worked', ['exemple']],
    ['fp-worked', ['exemple', 'etapes', 0]],
    ['fp-concept4', ['parametres', 0]],
    ['fp-plot', ['abscisse']],
    ['fp-plot', ['bornesOrdonnee']],
    ['fp-plot', ['series', 0]],
    ['fp-pulse', ['sondage']],
    ['fp-challenge', ['probleme']],
    ['fp-challenge', ['corrige', 'strategies', 0]],
    ['fp-cardsort', ['plan', 'cartes', 0]],
    ['fp-cardsort', ['questions', 0]],
    ['fp-cardsort', ['questions', 0, 'corrige', 'attendus', 0]],
    ['fp-sheet', ['plan']],
    ['fp-sheet', ['questions', 0, 'corrige', 'attendus', 0, 'pieges', 0]],
    ['fp-table-build', ['plan', 'colonnes', 0]],
    ['fp-table-build', ['plan', 'synthese', 0]],
    ['fp-escape', ['parcours', 'enigmes', 0]],
    ['fp-escape', ['questions', 0, 'corrige', 'solution']],
    ['fp-spaced', ['rappel']],
    ['fp-spaced', ['banque']],
    ['fp-spaced', ['banque', 'questions', 1, 'options', 0]],
    ['fp-numeric', ['questions', 0, 'tolerance']],
    ['fp-vote', ['questions', 1]],
    ['fp-vote', ['corrige']],
    ['fp-recall', ['questions', 0, 'options', 1]],
    ['fp-exit', ['questions', 0]],
    ['questionnaire', ['questions', 1, 'pieges', 0]],
  ])('refuse une clé imbriquée inconnue dans %s sous %j', (brique, chemin) => {
    expect(() =>
      lireEcran(
        avecProprietes(brique, (proprietes) =>
          avecCleInconnue(proprietes, chemin),
        ),
      ),
    ).toThrow(ContenuDeCoursInvalideError);
  });

  it.each<readonly [string, string, (proprietes: any) => void]>([
    [
      'fp-plot',
      'un préréglage qui règle un paramètre absent du tracé',
      (p) => {
        p.prereglages = [{ libelle: 'Axe à zéro', valeurs: { absent: 0 } }];
      },
    ],
    [
      'fp-plot',
      'une référence qui ne nomme aucun préréglage du tracé',
      (p) => {
        p.prereglages = [{ libelle: 'Axe à zéro', valeurs: {} }];
        p.reference = 'Axe de Samir';
      },
    ],
    [
      'fp-concept4',
      'un préréglage qui règle un paramètre absent de la machine',
      (p) => {
        p.prereglages = [
          { libelle: '+10 % puis −10 %', valeurs: { absent: 0 } },
        ];
      },
    ],
    [
      'fp-cardsort',
      'un corrigé qui classe une carte absente du plan',
      (p) => {
        p.questions[0].corrige.attendus[0].carteId = 'carte-absente';
      },
    ],
    [
      'fp-cardsort',
      'un corrigé qui vise une catégorie absente du plan',
      (p) => {
        p.questions[0].corrige.attendus[0].categorieId = 'categorie-absente';
      },
    ],
    [
      'fp-cardsort',
      'une carte sans attendu au corrigé',
      (p) => {
        p.questions[0].corrige.attendus.pop();
      },
    ],
    [
      'fp-cardsort',
      'une question dont l identifiant n est pas celui du plan',
      (p) => {
        p.questions[0].id = 'autre-identifiant';
      },
    ],
    [
      'fp-sheet',
      'un corrigé qui recopie un autre plan',
      (p) => {
        p.questions[0].corrige.plan.intitule = 'Autre plan';
      },
    ],
    [
      'fp-sheet',
      'une production de type classement',
      (p) => {
        p.questions[0].type = 'classement';
      },
    ],
    [
      'fp-table-build',
      'un attendu sur une colonne qui n est pas saisie',
      (p) => {
        p.questions[0].corrige.attendus[0].cle = 'coef';
      },
    ],
    [
      'fp-table-build',
      'un attendu au-delà des échéances',
      (p) => {
        p.questions[0].corrige.attendus[1].rang = 5;
      },
    ],
    [
      'fp-table-build',
      'une colonne de donnée sans valeur par échéance',
      (p) => {
        p.plan.colonnes[0].valeurs = [8];
      },
    ],
    [
      'fp-escape',
      'une énigme dont le corrigé porte un autre rang',
      (p) => {
        p.questions[0].corrige.rang = 1;
      },
    ],
    [
      'fp-escape',
      'une énigme sans corrigé',
      (p) => {
        p.parcours.enigmes.push({
          id: 'b2-01-a6-e2-points',
          intitule: 'L’écart',
          enonce: 'De combien a-t-il varié ?',
          indice: 'Soustrayez le taux de départ.',
        });
      },
    ],
    [
      'fp-spaced',
      'une question obligatoire absente de la banque',
      (p) => {
        p.banque.obligatoires.push('b2-01-r-absente');
      },
    ],
    [
      'fp-vote',
      'trois questions',
      (p) => {
        p.questions.push(p.questions[0]);
      },
    ],
    [
      'fp-worked',
      'un étayage au-delà du nombre d étapes',
      (p) => {
        p.etayage = 2;
      },
    ],
    [
      'fp-recall',
      'un délai négatif',
      (p) => {
        p.delaiMs = -1;
      },
    ],
    [
      'fp-challenge',
      'un défi sans corrigé',
      (p) => {
        delete p.corrige;
      },
    ],
    [
      'fp-challenge',
      'un rappel du dossier vide',
      (p) => {
        p.probleme.rappel = [];
      },
    ],
    [
      'fp-challenge',
      'une ligne du rappel sans valeur',
      (p) => {
        p.probleme.rappel = [{ libelle: 'Marge brute' }];
      },
    ],
  ])('refuse un écran %s avec %s', (brique, _cas, modifier) => {
    expect(() => lireEcran(avecProprietes(brique, modifier))).toThrow(
      ContenuDeCoursInvalideError,
    );
  });

  describe('titre, diffusion et description des écrans', () => {
    const GRAPHIQUE_SANS_DESCRIPTION = buildEcranDeBrique('fp-story', {
      proprietes: {
        presentation: {
          version: 2,
          screenId: 'B2-01-A1-01-FP-STORY',
          renderer: 'chart',
          props: {
            title: 'Marge brute',
            labels: ['2024', '2025'],
            series: [{ label: 'Marge', values: [289800, 291000] }],
          },
        },
      },
    });

    it.each([
      ['au titre de plus de 120 caractères', { titre: 'T'.repeat(121) }],
      ['à la diffusion inconnue', { diffusion: 'publique' }],
    ])('refuse à la lecture un écran %s', (_cas, champs) => {
      expect(() =>
        lireEcran({ ...buildEcranDeBrique('fp-quote'), ...champs } as never),
      ).toThrow(ContenuDeCoursInvalideError);
    });

    it('lit tels quels le titre et la diffusion stockés', () => {
      const cours = lireCoursStocke(
        buildCoursStocke({
          ecrans: [buildEcranStocke({ titre: 'Titre', diffusion: 'seance' })],
        }),
      );

      expect(cours.ecrans[0]).toMatchObject({
        titre: 'Titre',
        diffusion: 'seance',
      });
    });

    it('SEC-4 · lit un écran stocké sans titre ni diffusion comme un écran de séance sans titre', () => {
      const cours = lireCoursStocke(
        buildCoursStocke({ ecrans: [buildEcranStocke()] }),
      );

      expect(cours.ecrans[0]).toMatchObject({
        titre: null,
        diffusion: 'seance',
      });
    });

    it('lit un graphique stocké sans description', () => {
      expect(lireEcran(GRAPHIQUE_SANS_DESCRIPTION).brique).toBe('fp-story');
    });

    it('publie un contenu dont chaque écran porte titre, diffusion et description', () => {
      const cours = lireContenuAPublier(
        buildContenuPubliable([buildEcranDeBrique('fp-quote')]),
      );

      expect(cours.ecrans[0]).toMatchObject({
        titre: 'Écran fp-quote',
        diffusion: 'seance',
      });
    });

    it.each([
      ['sans titre', { titre: null }],
      ['sans diffusion', { diffusion: undefined }],
    ])('refuse de publier un écran %s', (_cas, champs) => {
      expect(() =>
        lireContenuAPublier(
          buildContenuPubliable([
            { ...buildEcranDeBrique('fp-quote'), ...champs } as never,
          ]),
        ),
      ).toThrow(ContenuDeCoursInvalideError);
    });

    it('refuse de publier un graphique sans description textuelle', () => {
      expect(() =>
        lireContenuAPublier(
          buildContenuPubliable([GRAPHIQUE_SANS_DESCRIPTION]),
        ),
      ).toThrow(/description/);
    });

    it('refuse deux écrans de même identifiant et deux questions de même identifiant', () => {
      const vote = buildEcranDeBrique('fp-recall');
      const billet = buildEcranDeBrique('fp-exit', {
        proprietes: {
          ...buildProprietesStockees('fp-exit'),
          questions: buildProprietesStockees('fp-recall').questions,
        },
      });

      expect(() =>
        lireCoursStocke(buildCoursDeBriques([vote, { ...vote }])),
      ).toThrow(/B2-01-A1-01-FP-RECALL/);
      expect(() =>
        lireCoursStocke(buildCoursDeBriques([vote, billet])),
      ).toThrow(/b2-01-a1-diagnostic/);
    });
  });

  describe('remédiations et médias persistés (B17)', () => {
    const ecran = buildEcranDeBrique('fp-quote');
    const media = {
      id: 'M1',
      chemins: ['/assets/cours/b2-01/v3/playfair-ecosse-1786.webp'],
      pageSource: 'https://commons.wikimedia.org/wiki/File:Pacioli.jpg',
      auteur: 'William Playfair',
      date: '1786',
      licence: 'domaine public',
      attribution: 'William Playfair, 1786 · Wikimedia Commons',
    };

    it('lit les remédiations et le catalogue des médias du cours', () => {
      const cours = lireCoursStocke(
        buildCoursDeBriques([ecran], {
          remediations: { 'base-arrivee': ecran.screenId },
          medias: [media],
        }),
      );

      expect(cours.remediations).toEqual({ 'base-arrivee': ecran.screenId });
      expect(cours.medias).toEqual([media]);
    });

    it.each([
      [
        'une remédiation d une confusion inconnue',
        { remediations: { 'confusion-inconnue': ecran.screenId } },
      ],
      ['un média sans licence', { medias: [{ ...media, licence: '' }] }],
      [
        'un média servi hors du même domaine',
        { medias: [{ ...media, chemins: ['http://exemple.test/a.webp'] }] },
      ],
      ['un média à la clé inconnue', { medias: [{ ...media, taille: 1 }] }],
    ])('refuse %s', (_cas, champs) => {
      expect(() =>
        lireCoursStocke(buildCoursDeBriques([ecran], champs as never)),
      ).toThrow(ContenuDeCoursInvalideError);
    });
  });

  describe('conversion vers le domaine', () => {
    it('porte la question, la jumelle et la révélation d un vote à pairs', () => {
      const ecran = ecranDeBrique('fp-vote');

      expect(ecran.question.id).toBe('b2-01-a3-sac-v1');
      expect(ecran.questionJumelle?.id).toBe('b2-01-a3-remise-v2');
      expect(ecran.question.segments).toEqual(['+25 %']);
      expect(ecran.revelation).toEqual({
        type: 'revelation',
        titre: 'Pourquoi le prix ne revient pas à son point de départ',
        lignes: ['Coefficient global : 1,10 × 0,90 = 0,99, soit −1 %.'],
      });
      expect(ecran.modalite).toBe('solo');
    });

    it('porte le délai du rappel d ouverture et l invite du billet', () => {
      expect(ecranDeBrique('fp-recall').delaiMs).toBe(45000);
      expect(ecranDeBrique('fp-exit').invite).toBe(
        'Justifiez en trois phrases.',
      );
    });

    it('porte l intitulé, la consigne, le régime et l ordre du questionnaire', () => {
      const ecran = ecranDeBrique('questionnaire');

      expect(ecran).toMatchObject({
        intitule: 'Atelier 1 — Lire, rapporter, estimer',
        consigne: 'Calculatrice autorisée.',
        regime: 'focus',
        ordre: 'fixe',
      });
      expect(ecran.questions.map((question) => question.type)).toEqual([
        'vote',
        'numeric',
      ]);
    });

    it('porte la production d un classement avec les confusions de son corrigé', () => {
      const ecran = ecranDeBrique('fp-cardsort');

      expect(ecran.production).toMatchObject({
        id: 'b2-01-a1-anatomie',
        type: 'classement',
        concept: 'contrat-de-lecture',
        noteCompte: true,
        confusions: ['valeur-confondue-avec-taux', 'unite-manquante-ignoree'],
      });
      expect(ecran.proprietes.plan.id).toBe('b2-01-a1-anatomie');
      expect(ecran.modalite).toBe('binome');
    });

    it('porte les confusions d une feuille, erreurs de formule comprises', () => {
      expect(ecranDeBrique('fp-sheet').production.confusions).toEqual([
        'taux-valeur-facteur-cent',
        'base-arrivee',
        'valeur-saisie-sans-formule',
        'formule-non-recopiable',
      ]);
    });

    it('porte les énigmes, la banque de rappel et le défi', () => {
      expect(
        ecranDeBrique('fp-escape').enigmes.map((enigme) => enigme.id),
      ).toEqual(['b2-01-a6-e1-mix']);
      const spaced = ecranDeBrique('fp-spaced');
      expect(spaced.banque.map((question) => question.id)).toEqual([
        'b2-01-r-compensation',
        'b2-01-r-points',
      ]);
      expect(spaced.obligatoires).toEqual(['b2-01-r-compensation']);
      expect(ecranDeBrique('fp-challenge').defi.strategies).toHaveLength(2);
    });

    it('porte l exemple travaillé et son étayage initial sans la modalité', () => {
      const ecran = ecranDeBrique('fp-worked');

      expect(ecran.proprietes).toEqual({
        exemple: buildProprietesStockees('fp-worked').exemple,
        etayage: 1,
      });
      expect(ecran.modalite).toBe('solo');
    });

    it('T13 · porte le renvoi d un récit vers un autre écran', () => {
      const ecran = lireEcran(
        avecProprietes('fp-story', (proprietes) => {
          proprietes.renvoi = 'B2-01-A1-04-TABLEAU-DE-BORD';
        }),
      );

      expect(ecran.renvoi).toBe('B2-01-A1-04-TABLEAU-DE-BORD');
      expect(
        ecran.brique === 'fp-story' && ecran.proprietes,
      ).not.toHaveProperty('renvoi');
    });

    it('porte l écran d exercice que corrige un exemple piloté', () => {
      const ecran = lireEcran(
        avecProprietes('fp-worked', (proprietes) => {
          proprietes.pilote = true;
          proprietes.etayage = 0;
          proprietes.corrigeDe = 'B2-01-A2-06-POINTS';
        }),
      );

      expect(ecran.brique === 'fp-worked' && ecran.proprietes).toMatchObject({
        pilote: true,
        corrigeDe: 'B2-01-A2-06-POINTS',
      });
    });

    it('F02 · porte la consigne du rappel d ouverture', () => {
      const ecran = lireEcran(
        avecProprietes('fp-recall', (proprietes) => {
          proprietes.consigne = 'Calculez sans calculatrice.';
        }),
      );

      expect(ecran.brique === 'fp-recall' && ecran.consigne).toBe(
        'Calculez sans calculatrice.',
      );
    });

    it('convertit une question numérique avec sa forme publiée', () => {
      const ecran = ecranDeBrique('fp-numeric');

      expect(ecran.question.formePubliee).toBe('45,5');
      expect(ecran.seuil).toBeCloseTo(0.6, 10);
      expect(ecran.question.generer(TIRAGE).solution).toBeCloseTo(
        45.478261,
        10,
      );
    });
  });

  describe('cas professionnel à questions libres', () => {
    it('L3 · lit les questions libres d un cas professionnel', () => {
      const ecran = lireEcran(buildCasAQuestionsLibres());

      expect(ecran.brique === 'fp-pro' && ecran.proprietes).toMatchObject({
        questionsLibres: [
          {
            id: 'b2-01-a1-mission:mesure',
            question: 'Que mesure chaque chiffre ?',
            placeholder: 'Un montant, une part, une évolution…',
          },
          {
            id: 'b2-01-a1-mission:comparable',
            question: 'Les bases et les périodes sont-elles comparables ?',
          },
        ],
      });
    });

    it('L3 · refuse une clé inconnue dans une question libre', () => {
      const ecran = buildCasAQuestionsLibres();
      avecCleInconnue(ecran.proprietes, ['questionsLibres', 0]);

      expect(() => lireEcran(ecran)).toThrow(ContenuDeCoursInvalideError);
    });

    it('L3 · refuse deux questions libres de même identifiant', () => {
      const ecran = buildCasAQuestionsLibres();
      const [premiere, seconde] = ecran.proprietes.questionsLibres as {
        id: string;
      }[];
      seconde.id = premiere.id;

      expect(() => lireEcran(ecran)).toThrow(ContenuDeCoursInvalideError);
    });
  });
});
