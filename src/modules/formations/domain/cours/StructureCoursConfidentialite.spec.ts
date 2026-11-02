import {
  buildEcranDeBrique,
  buildProprietesDeFeuille,
  buildProprietesStockees,
  PARCOURS_ENIGMES,
} from '../../../../../test/factories/ecrans-stockes.factory';
import { buildCorrigeFeuille } from '../../../../../test/factories/corriges.factory';
import {
  buildNumeriqueStockee,
  buildOptionStockee,
  buildRappelDeCompensation,
  buildVoteStocke,
} from '../../../../../test/factories/questions-stockees.factory';
import {
  buildCoursConforme,
  buildEcranDeCitation,
  fuitesDeConfidentialite as fuites,
  lireEcranStocke,
  recomposer,
} from '../../../../../test/factories/structure.factory';
import type { Cours, Ecran } from '../contrats/cours';
import type { NumeriqueStockee } from '../contrats/cours';

const base = buildCoursConforme();
const [ouverture, citation, atelier, cloture] = base.ecrans;

function autourDeLAtelier(...ecrans: Ecran[]): Cours {
  return recomposer(base, [ouverture, citation, atelier, ...ecrans, cloture]);
}

function texteDe(
  id: string,
  texte: string,
  diffusion: 'catalogue' | 'seance' = 'seance',
): Ecran {
  return buildEcranDeCitation(id, 1, {
    diffusion,
    proprietes: { texte, auteur: null, source: null },
  });
}

function atelierAvec(numerique: Partial<NumeriqueStockee>): Ecran {
  return lireEcranStocke(
    buildEcranDeBrique('questionnaire', {
      screenId: atelier.id,
      titre: 'Atelier',
      proprietes: {
        ...buildProprietesStockees('questionnaire'),
        questions: [buildNumeriqueStockee(numerique)],
      },
    }),
  );
}

const VOTE = 'B2-01-A1-04-VOTE';

function rappelConsignant(consigne?: string): Ecran {
  return lireEcranStocke(
    buildEcranDeBrique('fp-recall', {
      screenId: VOTE,
      titre: 'Rappel',
      proprietes: {
        ...buildProprietesStockees('fp-recall'),
        ...(consigne === undefined ? {} : { consigne }),
        questions: [
          buildVoteStocke({
            id: 'b2-01-a1-vote',
            concept: 'point-de-pourcentage',
            enonce:
              'Le taux de retour des colis passe de 4 % à 5 %. Quelle phrase est exacte ?',
            options: [
              buildOptionStockee('Il gagne un point', null),
              buildOptionStockee(
                'Il gagne 1 %',
                'points-confondus-avec-pourcentage',
              ),
            ],
            segments: ['gagne', 'point'],
          }),
        ],
      },
    }),
  );
}

const AVANT = 'B2-01-A1-02-AVANT';
const APRES = 'B2-01-A1-05-APRES';
const AVANT_PRODUCTION = 'B2-01-A1-04-AVANT';

describe('garde confidentialite — volet exact', () => {
  it('refuse la forme publiee d une reponse numerique dans un ecran precedent', () => {
    const cours = recomposer(base, [
      ouverture,
      texteDe(AVANT, 'La marketplace pèse 45,5 % du CA.'),
      atelier,
      cloture,
    ]);

    expect(fuites(cours)).toEqual([AVANT]);
  });

  it.each([
    [
      'ignore la forme dans un ecran de seance posterieur a la question',
      'seance',
      [],
    ],
    [
      'refuse la forme dans un ecran catalogue posterieur, servi a tout moment',
      'catalogue',
      [APRES],
    ],
  ] as const)('%s', (_titre, diffusion, attendu) => {
    const cours = autourDeLAtelier(
      texteDe(APRES, 'La marketplace pèse 45,5 % du CA.', diffusion),
    );

    expect(fuites(cours)).toEqual(attendu);
  });

  it('rejoue le volet catalogue sur le titre d un ecran verrouille, visible au catalogue (§ 6.4, point 3)', () => {
    const verrouille = autourDeLAtelier(
      buildEcranDeCitation(APRES, 1, { titre: 'Pourquoi 45,5 % ?' }),
    );
    const catalogue = autourDeLAtelier(
      buildEcranDeCitation(APRES, 1, {
        titre: 'Pourquoi 45,5 % ?',
        diffusion: 'catalogue',
      }),
    );

    expect(fuites(verrouille)).toEqual([APRES]);
    expect(fuites(catalogue)).toEqual([APRES]);
  });

  it('garde les donnees d un ecran verrouille hors du volet catalogue', () => {
    const cours = autourDeLAtelier(
      buildEcranDeCitation(APRES, 1, {
        titre: 'Un titre neutre',
        proprietes: {
          texte: 'La marketplace pèse 45,5 % du CA.',
          auteur: null,
          source: null,
        },
      }),
    );

    expect(fuites(cours)).toEqual([]);
  });

  it('ne compte pas l enonce de la question elle-meme', () => {
    const cours = recomposer(base, [
      ouverture,
      citation,
      atelierAvec({ enonce: 'Arrondissez comme 45,5 : au dixième.' }),
      cloture,
    ]);

    expect(fuites(cours)).toEqual([]);
  });

  it.each([
    ['45,5 % du CA', [AVANT]],
    ['environ 45,5', [AVANT]],
    ['145,5 m²', []],
    ['45,55 %', []],
    ['3,45,5', []],
  ])('borne la recherche du nombre : « %s »', (texte, attendu) => {
    const cours = recomposer(base, [
      ouverture,
      texteDe(AVANT, texte),
      atelier,
      cloture,
    ]);

    expect(fuites(cours)).toEqual(attendu);
  });

  const fuitesDuTexteAvant = (texte: string, solution: number, forme: string) =>
    fuites(
      recomposer(base, [
        ouverture,
        texteDe(AVANT, texte),
        atelierAvec({ solution, formePubliee: forme }),
        cloture,
      ]),
    );

  it.each([
    ['−30 960 €', [AVANT]],
    ['-30 960 €', [AVANT]],
    ['−130 960 €', []],
    ['−30 960,00 €', [AVANT]],
    ['−30 960,50 €', []],
    ['−30 960,05 €', []],
    ['−30 960 000 €', []],
  ])(
    'GR-M2 · lit le nombre entier, espaces et signes moins confondus : « %s »',
    (texte, attendu) => {
      expect(fuitesDuTexteAvant(texte, -30960, '−30 960')).toEqual(attendu);
    },
  );

  it.each([
    ['983,78 100 fois', '983,78', [AVANT]],
    ['un total de 2 135 clients', '135', []],
    ['en 2025 135 clients', '135', [AVANT]],
    ['12,5 135 fois', '135', [AVANT]],
    ['135,00 100 fois', '135', [AVANT]],
  ])(
    'GR-M2 · ne prolonge une réponse que par ce qui appartient à son nombre : « %s »',
    (texte, forme, attendu) => {
      expect(fuitesDuTexteAvant(texte, 135, forme)).toEqual(attendu);
    },
  );

  it.each([
    ['un taux de 15,5 %', '15,5 %', [AVANT]],
    ['un taux de 15,5 sur la carte', '15,5 %', [AVANT]],
    ['un taux de 115,5 sur la carte', '15,5 %', []],
    ['un taux de 15,55 sur la carte', '15,5 %', []],
    ['une hausse de + 50 %', '50 €', []],
    ['un total de 135.', '135 €', [AVANT]],
    ['une valeur de 135', '135 €', [AVANT]],
    ['un total de 135 000 clients', '135 €', []],
    ['un total de 1 250.', '1 250 €', [AVANT]],
    ['il en reste 4 098 dans l’export', '4 098 lignes', [AVANT]],
  ])(
    'GR-M1 · cherche une réponse publiée sans son unité : « %s », réponse %s',
    (texte, forme, attendu) => {
      expect(fuitesDuTexteAvant(texte, 15.5, forme)).toEqual(attendu);
    },
  );

  it('refuse le libelle exact de la bonne option d un vote, ecran de la question compris', () => {
    const cours = recomposer(base, [
      ouverture,
      citation,
      atelier,
      rappelConsignant('Réponse attendue : Il gagne un point.'),
      cloture,
    ]);

    expect(fuites(cours)).toEqual([VOTE]);
  });

  function graphiqueAvant(
    renderer: string,
    props: Readonly<Record<string, unknown>>,
  ): Cours {
    const graphique = lireEcranStocke(
      buildEcranDeBrique('fp-story', {
        screenId: AVANT,
        dureeMinutes: 1,
        proprietes: {
          presentation: { version: 2, screenId: AVANT, renderer, props },
        },
      }),
    );
    return recomposer(base, [ouverture, graphique, atelier, cloture]);
  }

  it('refuse les valeurs d un graphique arrondies a la precision de la question', () => {
    const cours = graphiqueAvant('chart', {
      title: 'Part des canaux',
      labels: ['Marketplace'],
      series: [{ label: 'Part (%)', values: [45.478261] }],
      description: 'Une barre par canal.',
    });

    expect(fuites(cours)).toEqual([AVANT]);
  });

  const NUAGE = {
    title: 'Deux séries',
    xLabel: 'x',
    yLabel: 'y',
    xRange: [0, 100],
    yRange: [0, 100],
    points: [
      { x: 1, y: 2 },
      { x: 3, y: 4 },
    ],
    description: 'Un nuage de deux points.',
  };

  it.each([
    ['un point', { points: [...NUAGE.points, { x: 45.478261, y: 3 }] }],
    ['le point moyen', { meanPoint: { x: 2, y: 45.478261 } }],
    ['la pente de la droite', { line: { slope: 45.478261, intercept: 0 } }],
    ['l ordonnée à l origine', { line: { slope: 1, intercept: 45.478261 } }],
  ])(
    'refuse une coordonnée du nuage arrondie à la précision de la question : %s',
    (_cas, alteration) => {
      expect(
        fuites(graphiqueAvant('scatter', { ...NUAGE, ...alteration })),
      ).toEqual([AVANT]);
    },
  );

  it('accepte un nuage dont aucune coordonnée ne donne la réponse', () => {
    expect(fuites(graphiqueAvant('scatter', NUAGE))).toEqual([]);
  });
});

describe('garde confidentialite — volet segments', () => {
  it('refuse une chaine precedente qui porte tous les segments, sans casse', () => {
    const cours = autourDeLAtelier(
      texteDe(APRES, 'On GAGNE toujours un Point quand le taux monte.'),
      rappelConsignant(),
    );

    expect(fuites(cours)).toEqual([APRES]);
  });

  it('accepte des segments repartis dans deux chaines', () => {
    const cours = autourDeLAtelier(
      texteDe(APRES, 'On gagne du temps.'),
      texteDe('B2-01-A1-06-APRES', 'Un point de vue.'),
      rappelConsignant(),
    );

    expect(fuites(cours)).toEqual([]);
  });

  it('ne cherche pas les segments sur l ecran de la question', () => {
    const cours = recomposer(base, [
      ouverture,
      citation,
      atelier,
      rappelConsignant('Dites si l’on gagne un point et justifiez.'),
      cloture,
    ]);

    expect(fuites(cours)).toEqual([]);
  });
});

describe('garde confidentialite — rappels, productions et enigmes', () => {
  const rappel = (): Ecran =>
    lireEcranStocke(
      buildEcranDeBrique('fp-spaced', {
        screenId: 'B2-01-A1-05-RAPPEL',
        dureeMinutes: 3,
        proprietes: {
          ...buildProprietesStockees('fp-spaced'),
          banque: {
            questions: [
              buildRappelDeCompensation(
                'Non, deux écarts se compensent',
                'Oui, le total concorde',
                { segments: ['écarts', 'compensent'] },
              ),
            ],
            obligatoires: [],
          },
        },
      }),
    );

  it('exclut les rappels du volet segments et leur garde le volet exact', () => {
    const segments = autourDeLAtelier(
      texteDe(APRES, 'Deux écarts qui se compensent.'),
      rappel(),
    );
    const exact = autourDeLAtelier(
      texteDe(APRES, 'Non, deux écarts se compensent'),
      rappel(),
    );

    expect(fuites(segments)).toEqual([]);
    expect(fuites(exact)).toEqual([APRES]);
  });

  const production = (brique: 'fp-sheet' | 'fp-table-build'): Ecran =>
    lireEcranStocke(
      buildEcranDeBrique(brique, {
        screenId: 'B2-01-A1-05-PRODUCTION',
        dureeMinutes: 8,
      }),
    );

  const fuitesAvant = (texte: string, ...suite: Ecran[]) =>
    fuites(autourDeLAtelier(texteDe(AVANT_PRODUCTION, texte), ...suite));

  it.each([
    ['le prix passe à 21,60 €', [AVANT_PRODUCTION]],
    ['soit 2 052,00 centimes', [AVANT_PRODUCTION]],
    ['un prix de 20,5200 €', [AVANT_PRODUCTION]],
    ['un prix de 21,6 €', []],
  ])(
    'cherche les valeurs saisies d un tableau a 2, 4 et 6 decimales : « %s »',
    (texte, attendu) => {
      expect(fuitesAvant(texte, production('fp-table-build'))).toEqual(attendu);
    },
  );

  it.each([
    ['un taux de 0,178054', [AVANT_PRODUCTION]],
    ['un taux de 17,8054 %', [AVANT_PRODUCTION]],
    ['un taux de 0,1781', [AVANT_PRODUCTION]],
    ['le CA du sur-mesure recule de 17,81 %', []],
    ['un taux de 0,18', []],
  ])(
    'cherche les attendus d une feuille a leur precision calculee, pas a leur arrondi d affichage : « %s »',
    (texte, attendu) => {
      expect(fuitesAvant(texte, production('fp-sheet'))).toEqual(attendu);
    },
  );

  const feuilleArrondie = (): Ecran => {
    const [attendu] = buildCorrigeFeuille().attendus;
    return lireEcranStocke(
      buildEcranDeBrique('fp-sheet', {
        screenId: 'B2-01-A1-05-PRODUCTION',
        dureeMinutes: 8,
        proprietes: buildProprietesDeFeuille(
          buildCorrigeFeuille({ attendus: [{ ...attendu, valeur: 116.7 }] }),
        ),
      }),
    );
  };

  it.each([
    ['un indice de 116,7', [AVANT_PRODUCTION]],
    ['un indice de 116,75', []],
    ['un indice de 1 116,7', []],
  ])(
    'GR-M1 · cherche un attendu de feuille arrondi par ARRONDI à sa forme propre : « %s »',
    (texte, attendu) => {
      expect(fuitesAvant(texte, feuilleArrondie())).toEqual(attendu);
    },
  );

  it.each([
    ['Inflation : ni unité, ni période, ni source.', [AVANT_PRODUCTION]],
    ['Une inflation sans unité ni période.', []],
  ])(
    'SEC-3 · cherche les justifications d un classement avant le tri : « %s »',
    (texte, attendu) => {
      const tri = lireEcranStocke(
        buildEcranDeBrique('fp-cardsort', {
          screenId: 'B2-01-A1-05-PRODUCTION',
        }),
      );

      expect(fuitesAvant(texte, tri)).toEqual(attendu);
    },
  );

  const coffre = (indice: string): Ecran =>
    lireEcranStocke(
      buildEcranDeBrique('fp-escape', {
        screenId: 'B2-01-A1-05-COFFRE',
        proprietes: {
          ...buildProprietesStockees('fp-escape'),
          parcours: {
            ...PARCOURS_ENIGMES,
            enigmes: [{ ...PARCOURS_ENIGMES.enigmes[0], indice }],
          },
        },
      }),
    );

  it('refuse un indice d enigme qui contient un chiffre', () => {
    const avecChiffre = autourDeLAtelier(coffre('Divisez par 9.'));
    const sansChiffre = autourDeLAtelier(
      coffre('Additionnez les marges, puis divisez.'),
    );

    expect(fuites(avecChiffre)).toEqual(['B2-01-A1-05-COFFRE']);
    expect(fuites(sansChiffre)).toEqual([]);
  });

  it('refuse la forme publiee de la solution d une enigme avant le coffre', () => {
    expect(
      fuitesAvant(
        'Le taux global vaut 23,4 %.',
        coffre('Additionnez les marges, puis divisez.'),
      ),
    ).toEqual([AVANT_PRODUCTION]);
  });
});
