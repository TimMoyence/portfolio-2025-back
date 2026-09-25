import {
  buildCorrectionDeReponses,
  buildCorrectionDExemple,
  buildEcranDeBrique,
  buildEcranDeTableau,
  buildProprietesStockees,
  NOTES_DU_FORMATEUR,
} from '../../../../../test/factories/ecrans-stockes.factory';
import {
  buildOptionStockee,
  buildVoteStocke,
} from '../../../../../test/factories/questions-stockees.factory';
import {
  buildCoursConforme,
  buildEcranDAtelier,
  buildEcranDeCitation,
  buildEcranDExemple,
  lireEcranStocke,
  recomposer,
} from '../../../../../test/factories/structure.factory';
import type { Cours, Ecran } from '../contrats/cours';
import type { Derogation } from './StructureCours';
import { REGLES_STRUCTURE, verifierStructure } from './StructureCours';

function regles(
  cours: Cours,
  derogations: readonly Derogation[] = [],
): string[] {
  return verifierStructure(cours, derogations).map(
    (violation) => violation.regle,
  );
}

const base = buildCoursConforme();
const [ouverture, citation, atelier, cloture] = base.ecrans;

const avecNotesDeCitation = (notes: string): Cours =>
  recomposer(base, [ouverture, { ...citation, notes }, atelier, cloture]);

const avecAtelierDe = (dureeMinutes: number): Cours =>
  recomposer(base, [
    ouverture,
    citation,
    { ...atelier, dureeMinutes },
    cloture,
  ]);

describe('verifierStructure', () => {
  it('expose les seize regles de structure dans l ordre applique aux violations', () => {
    expect(REGLES_STRUCTURE).toEqual([
      'exposition-continue',
      'ratio-interaction',
      'ouverture-cloture',
      'duree-ecran',
      'duree-cours',
      'reference-inconnue',
      'renvoi-anterieur',
      'cadrage-du-renvoi',
      'reference-circulaire',
      'correction-apres-source',
      'notes-formateur',
      'atelier-questions-fermees',
      'confidentialite',
      'catalogue-sans-question',
      'media-sans-licence',
      'options-neutres',
    ]);
  });

  it('accepte un cours conforme, sans derogation', () => {
    expect(verifierStructure(base)).toEqual([]);
  });

  it('accepte un cours de lecture sans rappel, exit ticket ni interaction', () => {
    expect(
      verifierStructure(
        recomposer(base, [buildEcranDeCitation('B2-01-A1-01-LECTURE', 8)]),
      ),
    ).toEqual([]);
  });

  it('refuse sept minutes d exposition d affilee et accepte six', () => {
    const avec = (secondes: number): Cours =>
      recomposer(base, [
        ouverture,
        buildEcranDeCitation('B2-01-A1-05-A', 2),
        buildEcranDeCitation('B2-01-A1-06-B', secondes),
        citation,
        atelier,
        cloture,
      ]);

    expect(regles(avec(3))).toContain('exposition-continue');
    expect(regles(avec(2))).not.toContain('exposition-continue');
  });

  it('compte un jalon comme de l exposition', () => {
    const jalon = lireEcranStocke(
      buildEcranDeBrique('fp-pulse', { dureeMinutes: 1 }),
    );
    const cours = recomposer(base, [
      ouverture,
      buildEcranDeCitation('B2-01-A1-05-A', 4),
      jalon,
      citation,
      atelier,
      cloture,
    ]);

    expect(regles(cours)).toContain('exposition-continue');
  });

  it('exige l ouverture par un rappel et la cloture par un exit ticket', () => {
    const inverse = recomposer(base, [cloture, citation, atelier, ouverture]);

    expect(
      regles(inverse).filter((regle) => regle === 'ouverture-cloture'),
    ).toHaveLength(2);
  });

  it('refuse une remediation vers un ecran absent et accepte un ecran du cours', () => {
    const absent: Cours = {
      ...base,
      remediations: { 'base-arrivee': 'B2-01-A9-99-ABSENT' },
    };
    const present: Cours = {
      ...base,
      remediations: { 'base-arrivee': citation.id },
    };

    expect(regles(absent)).toContain('reference-inconnue');
    expect(regles(present)).toEqual([]);
  });

  it('E10 · refuse un renvoi vers un écran absent et accepte un écran du cours', () => {
    const renvoyer = (renvoi: string): Cours =>
      recomposer(base, [ouverture, citation, { ...atelier, renvoi }, cloture]);

    expect(regles(renvoyer('B2-01-A9-99-ABSENT'))).toContain(
      'reference-inconnue',
    );
    expect(regles(renvoyer(citation.id))).toEqual([]);
  });

  it('SEC-4.2 · refuse un renvoi vers l écran lui-même ou un écran pas encore projeté', () => {
    const renvoyer = (renvoi: string): Cours =>
      recomposer(base, [ouverture, citation, { ...atelier, renvoi }, cloture]);

    expect(regles(renvoyer(cloture.id))).toEqual(['renvoi-anterieur']);
    expect(regles(renvoyer(atelier.id))).toContain('renvoi-anterieur');
    expect(regles(renvoyer('B2-01-A9-99-ABSENT'))).not.toContain(
      'renvoi-anterieur',
    );
  });

  describe('R3 · cadrage de la diapositive commentée', () => {
    const tableau = lireEcranStocke(
      buildEcranDeTableau('B2-01-A1-02-TABLEAU', [
        { indicateur: 'CA', valeur: '1 150 000 €' },
        { indicateur: 'Taux de marge', valeur: '25,3 %' },
      ]),
    );
    const cas = lireEcranStocke(
      buildEcranDeBrique('fp-pro', {
        screenId: 'B2-01-A1-03-MISSION',
        dureeMinutes: 1,
      }),
    );
    const cadrer = (
      renvoi: string | undefined,
      cadrageDuRenvoi: NonNullable<Ecran['cadrageDuRenvoi']>,
    ): Cours =>
      recomposer(base, [
        ouverture,
        tableau,
        cas,
        {
          ...atelier,
          ...(renvoi === undefined ? {} : { renvoi }),
          cadrageDuRenvoi,
        },
        cloture,
      ]);

    it('accepte une part seule, des lignes du tableau renvoyé ou des champs du cas renvoyé', () => {
      expect(regles(cadrer(tableau.id, { part: 30 }))).toEqual([]);
      expect(
        regles(cadrer(tableau.id, { part: 40, extrait: { lignes: [1] } })),
      ).toEqual([]);
      expect(
        regles(
          cadrer(cas.id, { part: 70, extrait: { champs: ['situation'] } }),
        ),
      ).toEqual([]);
    });

    it('refuse un cadrage sans renvoi', () => {
      expect(regles(cadrer(undefined, { part: 60 }))).toEqual([
        'cadrage-du-renvoi',
      ]);
    });

    it('refuse une ligne absente du tableau ou des lignes sur un écran sans tableau', () => {
      expect(
        regles(cadrer(tableau.id, { part: 40, extrait: { lignes: [2] } })),
      ).toEqual(['cadrage-du-renvoi']);
      expect(
        regles(cadrer(cas.id, { part: 40, extrait: { lignes: [0] } })),
      ).toEqual(['cadrage-du-renvoi']);
    });

    it('refuse un champ que le cas renvoyé ne porte pas', () => {
      expect(
        regles(
          cadrer(cas.id, { part: 70, extrait: { champs: ['consequence'] } }),
        ),
      ).toEqual(['cadrage-du-renvoi']);
      expect(
        regles(
          cadrer(tableau.id, { part: 70, extrait: { champs: ['situation'] } }),
        ),
      ).toEqual(['cadrage-du-renvoi']);
    });
  });

  it('leve une violation par une derogation justifiee et signale une derogation vide', () => {
    const decale: Cours = { ...base, dureeMinutes: 100 };

    expect(regles(decale)).toContain('duree-cours');
    expect(
      regles(decale, [
        { regle: 'duree-cours', raison: 'Séance raccourcie par l’école.' },
      ]),
    ).toEqual([]);
    expect(regles(decale, [{ regle: 'duree-cours', raison: '  ' }])).toEqual([
      'duree-cours',
      'derogation-sans-justification',
    ]);
  });

  it('ne leve par une derogation ciblee que l ecran vise', () => {
    const cours = recomposer(base, [
      { ...ouverture, notes: '•' },
      citation,
      atelier,
      { ...cloture, notes: '•' },
    ]);

    expect(
      verifierStructure(cours, [
        {
          regle: 'notes-formateur',
          ecran: ouverture.id,
          raison: 'Rappel conduit à l’oral.',
        },
      ]).map((violation) => violation.ecran),
    ).toEqual([cloture.id]);
  });

  it('accepte un ratio interaction sur exposition de 0,30 exactement et refuse 0,29', () => {
    const avec = (interaction: number): Cours =>
      recomposer(base, [
        { ...ouverture, dureeMinutes: interaction },
        buildEcranDeCitation('B2-01-A1-05-EXPO', 100),
      ]);

    expect(regles(avec(30))).not.toContain('ratio-interaction');
    expect(regles(avec(29))).toContain('ratio-interaction');
  });

  it('refuse un ecran de duree nulle ou fractionnaire et accepte une duree entiere positive', () => {
    const avec = (duree: number): Cours =>
      recomposer(base, [
        ouverture,
        buildEcranDeCitation('B2-01-A1-05-DUREE', duree),
        atelier,
        cloture,
      ]);

    expect(regles(avec(0))).toContain('duree-ecran');
    expect(regles(avec(1.5))).toContain('duree-ecran');
    expect(regles(avec(1))).not.toContain('duree-ecran');
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY, -1])(
    'refuse une duree %s pour un ecran comme pour le cours, sans la compter',
    (duree) => {
      const ecranFautif = recomposer(base, [
        ouverture,
        buildEcranDeCitation('B2-01-A1-05-DUREE', duree),
        atelier,
        cloture,
      ]);
      const valide = recomposer(base, [ouverture, atelier, cloture]);
      const coursFautif: Cours = { ...base, dureeMinutes: duree };

      expect(
        regles({ ...ecranFautif, dureeMinutes: valide.dureeMinutes }),
      ).toEqual(['duree-ecran']);
      expect(regles(coursFautif)).toContain('duree-cours');
    },
  );

  it('exige l egalite exacte entre la duree annoncee et la somme des ecrans', () => {
    expect(regles({ ...base, dureeMinutes: base.dureeMinutes + 1 })).toEqual([
      'duree-cours',
    ]);
  });

  it('signale une reference circulaire entre deux ecrans qui se renvoient l un a l autre', () => {
    const cours = recomposer(base, [
      ouverture,
      buildEcranDExemple('B2-01-A1-05-TRAVAIL-A', 'ref:B2-01-A1-06-TRAVAIL-B'),
      buildEcranDExemple('B2-01-A1-06-TRAVAIL-B', 'ref:B2-01-A1-05-TRAVAIL-A'),
      atelier,
      cloture,
    ]);

    expect(regles(cours)).toContain('reference-circulaire');
  });
});

describe('verifierStructure — notes du formateur', () => {
  it.each([
    ['absentes', ''],
    ['en puces', NOTES_DU_FORMATEUR],
    ['en une phrase', 'Relance : « Rapporté à quoi ? »'],
  ])('G03 · accepte des notes %s', (_, notes) => {
    expect(regles(avecNotesDeCitation(notes))).not.toContain('notes-formateur');
  });

  it.each([
    ['faites d espaces', '   '],
    ['avec une ligne blanche', `${NOTES_DU_FORMATEUR}\n  `],
    ['avec une puce vide', `${NOTES_DU_FORMATEUR}\n•  `],
  ])('G03 · refuse des notes présentes mais %s', (_, notes) => {
    expect(verifierStructure(avecNotesDeCitation(notes))).toEqual([
      expect.objectContaining({ regle: 'notes-formateur', ecran: citation.id }),
    ]);
  });
});

describe('verifierStructure — questions fermees en atelier', () => {
  it.each([7, 16])('refuse un atelier note de %i minutes', (duree) => {
    expect(regles(avecAtelierDe(duree))).toContain('atelier-questions-fermees');
  });

  it.each([8, 15])('accepte un atelier note de %i minutes', (duree) => {
    expect(regles(avecAtelierDe(duree))).not.toContain(
      'atelier-questions-fermees',
    );
  });

  it('refuse un classement note sur un ecran court et ignore un vote non note', () => {
    const classement = lireEcranStocke(
      buildEcranDeBrique('fp-cardsort', {
        screenId: 'B2-01-A1-05-CLASSEMENT',
        dureeMinutes: 5,
      }),
    );
    const voteLibre = lireEcranStocke(
      buildEcranDeBrique('fp-vote', {
        screenId: 'B2-01-A1-06-VOTE-LIBRE',
        dureeMinutes: 3,
        proprietes: {
          questions: [
            buildVoteStocke({ id: 'b2-01-a1-vote-libre', noteCompte: false }),
          ],
        },
      }),
    );

    expect(
      verifierStructure(
        recomposer(base, [ouverture, classement, voteLibre, atelier, cloture]),
      )
        .filter((violation) => violation.regle === 'atelier-questions-fermees')
        .map((violation) => violation.ecran),
    ).toEqual([classement.id]);
  });

  it('n exempte le rappel qu en ouverture et le billet qu en cloture', () => {
    const cours = recomposer(base, [
      { ...atelier, id: 'B2-01-A1-00-ATELIER-0', dureeMinutes: 8 },
      citation,
      ouverture,
      buildEcranDeCitation('B2-01-A1-05-ENTRE', 1),
      cloture,
      buildEcranDeCitation('B2-01-A1-09-FIN', 1),
    ]);

    expect(
      verifierStructure(cours)
        .filter((violation) => violation.regle === 'atelier-questions-fermees')
        .map((violation) => violation.ecran),
    ).toEqual([ouverture.id, cloture.id]);
  });

  const ateliersEnSuite = (
    premier: number,
    second: number,
    entre: readonly Ecran[] = [],
  ): Cours =>
    recomposer(base, [
      ouverture,
      citation,
      buildEcranDAtelier('B2-01-A2-03-ATELIER', premier, 'b2-01-a2-q1'),
      lireEcranStocke(buildCorrectionDeReponses('B2-01-A2-03-ATELIER')),
      ...entre,
      buildEcranDAtelier('B2-01-A2-04-ATELIER-SUITE', second, 'b2-01-a2-q2'),
      lireEcranStocke(buildCorrectionDeReponses('B2-01-A2-04-ATELIER-SUITE')),
      cloture,
    ]);

  const ateliersFautifs = (cours: Cours): (string | null)[] =>
    verifierStructure(cours)
      .filter((violation) => violation.regle === 'atelier-questions-fermees')
      .map((violation) => violation.ecran);

  it('G01 · accepte un questionnaire decoupe en deux temps suivis de leur correction', () => {
    expect(ateliersFautifs(ateliersEnSuite(6, 6))).toEqual([]);
  });

  it('G01 · compte la correction dans la duree d un atelier', () => {
    const cours = recomposer(base, [
      ouverture,
      citation,
      buildEcranDAtelier('B2-01-A2-03-ATELIER', 7, 'b2-01-a2-q1'),
      lireEcranStocke(buildCorrectionDeReponses('B2-01-A2-03-ATELIER')),
      cloture,
    ]);

    expect(ateliersFautifs(cours)).toEqual([]);
  });

  it('G01 · refuse un temps note de plus de quinze minutes, correction comprise', () => {
    expect(ateliersFautifs(ateliersEnSuite(15, 6))).toEqual([
      'B2-01-A2-03-ATELIER',
    ]);
  });

  it('G01 · refuse deux temps trop courts separes par un ecran d exposition', () => {
    expect(
      ateliersFautifs(
        ateliersEnSuite(6, 6, [buildEcranDeCitation('B2-01-A2-03-PAUSE', 1)]),
      ),
    ).toEqual(['B2-01-A2-03-ATELIER', 'B2-01-A2-04-ATELIER-SUITE']);
  });
});

describe('verifierStructure — ecrans de correction', () => {
  const avecCorrection = (correction: Ecran, avant = false): Cours =>
    recomposer(
      base,
      avant
        ? [ouverture, citation, correction, atelier, cloture]
        : [ouverture, citation, atelier, correction, cloture],
    );

  const fautifs = (cours: Cours): (string | null)[] =>
    verifierStructure(cours)
      .filter((violation) => violation.regle === 'correction-apres-source')
      .map((violation) => violation.ecran);

  it('accepte une correction de reponses et un corrige d exemple places apres leur source', () => {
    const exemple = buildEcranDExemple('B2-01-A1-05-EXEMPLE', 'Calculez.');
    const cours = recomposer(base, [
      ouverture,
      citation,
      atelier,
      lireEcranStocke(buildCorrectionDeReponses(atelier.id)),
      exemple,
      lireEcranStocke(buildCorrectionDExemple(exemple.id)),
      cloture,
    ]);

    expect(verifierStructure(cours)).toEqual([]);
  });

  it('refuse une correction placee avant son ecran source', () => {
    expect(
      fautifs(
        avecCorrection(
          lireEcranStocke(buildCorrectionDeReponses(atelier.id)),
          true,
        ),
      ),
    ).toEqual([`${atelier.id}-CORRECTION`]);
  });

  it('refuse une correction dont la source est absente du cours', () => {
    expect(
      fautifs(
        avecCorrection(
          lireEcranStocke(
            buildCorrectionDExemple(
              'B2-01-A9-99-ABSENT',
              'B2-01-A1-05-CORRIGE',
            ),
          ),
        ),
      ),
    ).toEqual(['B2-01-A1-05-CORRIGE']);
  });

  it('refuse une correction diffusee au catalogue', () => {
    const correction = lireEcranStocke(
      buildCorrectionDeReponses(atelier.id, undefined, {
        diffusion: 'catalogue',
      }),
    );

    expect(fautifs(avecCorrection(correction))).toEqual([correction.id]);
  });
});

describe('verifierStructure — diffusion, medias et options', () => {
  it('refuse une activite en diffusion catalogue', () => {
    const cours = recomposer(base, [
      ouverture,
      citation,
      { ...atelier, diffusion: 'catalogue' },
      cloture,
    ]);

    expect(regles(cours)).toEqual(['catalogue-sans-question']);
  });

  const recitIllustre = (src: string): Ecran =>
    lireEcranStocke(
      buildEcranDeBrique('fp-story', {
        screenId: 'B2-01-A1-05-PLAYFAIR',
        dureeMinutes: 2,
        proprietes: {
          titre: 'Playfair',
          paragraphes: ['Le premier graphique en barres.'],
          visuel: { src, alt: 'Graphique en barres de 1786' },
        },
      }),
    );
  const PLAYFAIR = '/assets/cours/b2-01/v3/playfair-ecosse-1786.webp';

  it('refuse un media absent du catalogue des medias et accepte un media catalogue', () => {
    const cours = recomposer(base, [
      ouverture,
      recitIllustre(PLAYFAIR),
      atelier,
      cloture,
    ]);
    const catalogue: Cours = {
      ...cours,
      medias: [
        {
          id: 'M1',
          chemins: [PLAYFAIR],
          pageSource: 'https://commons.wikimedia.org/wiki/File:Playfair.jpg',
          auteur: 'William Playfair',
          date: '1786',
          licence: 'Domaine public',
          attribution: 'Wikimedia Commons (domaine public)',
        },
      ],
    };

    expect(regles(cours)).toEqual(['media-sans-licence']);
    expect(regles(catalogue)).toEqual([]);
  });

  it('refuse une option de vote dont l identifiant ne derive pas du libelle', () => {
    const libre = lireEcranStocke(
      buildEcranDeBrique('fp-recall', {
        screenId: ouverture.id,
        dureeMinutes: 3,
        proprietes: {
          ...buildProprietesStockees('fp-recall'),
          questions: [
            buildVoteStocke({
              options: [
                { id: 'o1', libelle: '+25 %', confusion: null },
                buildOptionStockee('+20 %', 'base-arrivee'),
              ],
            }),
          ],
        },
      }),
    );

    expect(
      verifierStructure(recomposer(base, [libre, citation, atelier, cloture])),
    ).toEqual([
      expect.objectContaining({
        regle: 'options-neutres',
        ecran: ouverture.id,
      }),
    ]);
  });
});
