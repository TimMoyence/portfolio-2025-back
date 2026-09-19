import {
  buildEcranStockeV3,
  buildProprietesStockees,
  PARCOURS_ENIGMES,
} from '../../../../../test/factories/ecrans-stockes.factory';
import {
  buildNumeriqueStockee,
  buildOptionStockee,
  buildVoteStocke,
} from '../../../../../test/factories/questions-stockees.factory';
import {
  buildCoursConforme,
  buildEcranDeCitation,
  lireEcranStocke,
  recomposer,
} from '../../../../../test/factories/structure.factory';
import type { Cours, Ecran } from '../contrats/cours';
import type { NumeriqueStockee } from '../contrats/cours';
import { verifierStructure } from './StructureCours';

const base = buildCoursConforme();
const [ouverture, citation, atelier, cloture] = base.ecrans;

function fuites(cours: Cours): readonly (string | null)[] {
  return verifierStructure(cours)
    .filter((violation) => violation.regle === 'confidentialite')
    .map((violation) => violation.ecran);
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
    buildEcranStockeV3('questionnaire', {
      screenId: atelier.id,
      titre: 'Atelier',
      proprietes: {
        ...buildProprietesStockees('questionnaire'),
        questions: [buildNumeriqueStockee(numerique)],
      },
    }),
  );
}

function billetInvitant(invite: string): Ecran {
  if (cloture.brique !== 'fp-exit') {
    throw new Error('le cours conforme se clôt par un billet de sortie');
  }
  return { ...cloture, invite };
}

const AVANT = 'B2-01-A1-02-AVANT';
const APRES = 'B2-01-A1-05-APRES';

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

  it('ignore la forme dans un ecran de seance posterieur a la question', () => {
    const cours = recomposer(base, [
      ouverture,
      citation,
      atelier,
      texteDe(APRES, 'La marketplace pèse 45,5 % du CA.'),
      cloture,
    ]);

    expect(fuites(cours)).toEqual([]);
  });

  it('refuse la forme dans un ecran catalogue posterieur, servi a tout moment', () => {
    const cours = recomposer(base, [
      ouverture,
      citation,
      atelier,
      texteDe(APRES, 'La marketplace pèse 45,5 % du CA.', 'catalogue'),
      cloture,
    ]);

    expect(fuites(cours)).toEqual([APRES]);
  });

  it('refuse la forme dans le titre public d un ecran verrouille posterieur', () => {
    const cours = recomposer(base, [
      ouverture,
      citation,
      atelier,
      buildEcranDeCitation(APRES, 1, { titre: 'Pourquoi 45,5 % ?' }),
      cloture,
    ]);

    expect(fuites(cours)).toEqual([APRES]);
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

  it.each([
    ['−30 960 €', [AVANT]],
    ['-30 960 €', [AVANT]],
    ['−130 960 €', []],
  ])('confond les espaces et les signes moins : « %s »', (texte, attendu) => {
    const cours = recomposer(base, [
      ouverture,
      texteDe(AVANT, texte),
      atelierAvec({ solution: -30960, formePubliee: '−30 960' }),
      cloture,
    ]);

    expect(fuites(cours)).toEqual(attendu);
  });

  it('refuse le libelle exact de la bonne option d un vote, ecran de la question compris', () => {
    const cours = recomposer(base, [
      ouverture,
      citation,
      atelier,
      billetInvitant('Réponse attendue : Il gagne un point.'),
    ]);

    expect(fuites(cours)).toEqual([cloture.id]);
  });

  it('refuse les valeurs d un graphique arrondies a la precision de la question', () => {
    const graphique = lireEcranStocke(
      buildEcranStockeV3('fp-story', {
        screenId: AVANT,
        dureeMinutes: 1,
        proprietes: {
          presentation: {
            version: 2,
            screenId: AVANT,
            renderer: 'chart',
            props: {
              title: 'Part des canaux',
              labels: ['Marketplace'],
              series: [{ label: 'Part (%)', values: [45.478261] }],
              description: 'Une barre par canal.',
            },
          },
        },
      }),
    );

    expect(
      fuites(recomposer(base, [ouverture, graphique, atelier, cloture])),
    ).toEqual([AVANT]);
  });
});

describe('garde confidentialite — volet segments', () => {
  it('refuse une chaine precedente qui porte tous les segments, sans casse', () => {
    const cours = recomposer(base, [
      ouverture,
      citation,
      atelier,
      texteDe(APRES, 'On GAGNE toujours un Point quand le taux monte.'),
      cloture,
    ]);

    expect(fuites(cours)).toEqual([APRES]);
  });

  it('accepte des segments repartis dans deux chaines', () => {
    const cours = recomposer(base, [
      ouverture,
      citation,
      atelier,
      texteDe(APRES, 'On gagne du temps.'),
      texteDe('B2-01-A1-06-APRES', 'Un point de vue.'),
      cloture,
    ]);

    expect(fuites(cours)).toEqual([]);
  });

  it('ne cherche pas les segments sur l ecran de la question', () => {
    const cours = recomposer(base, [
      ouverture,
      citation,
      atelier,
      billetInvitant('Dites si l’on gagne un point et justifiez.'),
    ]);

    expect(fuites(cours)).toEqual([]);
  });
});

describe('garde confidentialite — rappels, productions et enigmes', () => {
  const rappel = (): Ecran =>
    lireEcranStocke(
      buildEcranStockeV3('fp-spaced', {
        screenId: 'B2-01-A1-05-RAPPEL',
        dureeMinutes: 3,
        proprietes: {
          rappel: { id: 'b2-01-a6-rappel', intitule: 'Rappel de mémoire' },
          banque: {
            questions: [
              buildVoteStocke({
                id: 'b2-01-r-compensation',
                concept: 'controle-coherence',
                noteCompte: false,
                enonce: 'Peut-on valider chaque écriture ?',
                options: [
                  buildOptionStockee('Non, deux écarts se compensent', null),
                  buildOptionStockee(
                    'Oui, le total concorde',
                    'total-concordant-vaut-preuve',
                  ),
                ],
                segments: ['écarts', 'compensent'],
              }),
            ],
            obligatoires: [],
          },
        },
      }),
    );

  it('exclut les rappels du volet segments et leur garde le volet exact', () => {
    const segments = recomposer(base, [
      ouverture,
      citation,
      atelier,
      texteDe(APRES, 'Deux écarts qui se compensent.'),
      rappel(),
      cloture,
    ]);
    const exact = recomposer(base, [
      ouverture,
      citation,
      atelier,
      texteDe(APRES, 'Non, deux écarts se compensent'),
      rappel(),
      cloture,
    ]);

    expect(fuites(segments)).toEqual([]);
    expect(fuites(exact)).toEqual([APRES]);
  });

  const feuille = (): Ecran =>
    lireEcranStocke(
      buildEcranStockeV3('fp-sheet', {
        screenId: 'B2-01-A1-05-FEUILLE',
        dureeMinutes: 8,
      }),
    );

  it.each([
    ['le CA du sur-mesure recule de 17,81 %', ['B2-01-A1-04-AVANT']],
    ['un taux de -0,1781', ['B2-01-A1-04-AVANT']],
    ['un recul de 17,8 %', []],
  ])(
    'cherche les attendus d une production a 2, 4 et 6 decimales : « %s »',
    (texte, attendu) => {
      const cours = recomposer(base, [
        ouverture,
        citation,
        atelier,
        texteDe('B2-01-A1-04-AVANT', texte),
        feuille(),
        cloture,
      ]);

      expect(fuites(cours)).toEqual(attendu);
    },
  );

  const coffre = (indice: string): Ecran =>
    lireEcranStocke(
      buildEcranStockeV3('fp-escape', {
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
    const avecChiffre = recomposer(base, [
      ouverture,
      citation,
      atelier,
      coffre('Divisez par 9.'),
      cloture,
    ]);
    const sansChiffre = recomposer(base, [
      ouverture,
      citation,
      atelier,
      coffre('Additionnez les marges, puis divisez.'),
      cloture,
    ]);

    expect(fuites(avecChiffre)).toEqual(['B2-01-A1-05-COFFRE']);
    expect(fuites(sansChiffre)).toEqual([]);
  });

  it('refuse la forme publiee de la solution d une enigme avant le coffre', () => {
    const cours = recomposer(base, [
      ouverture,
      citation,
      atelier,
      texteDe('B2-01-A1-04-AVANT', 'Le taux global vaut 23,4 %.'),
      coffre('Additionnez les marges, puis divisez.'),
      cloture,
    ]);

    expect(fuites(cours)).toEqual(['B2-01-A1-04-AVANT']);
  });
});
