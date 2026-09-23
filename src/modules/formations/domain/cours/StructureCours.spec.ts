import {
  buildEcranDeBrique,
  buildProprietesStockees,
  NOTES_DU_FORMATEUR,
} from '../../../../../test/factories/ecrans-stockes.factory';
import {
  buildOptionStockee,
  buildVoteStocke,
} from '../../../../../test/factories/questions-stockees.factory';
import {
  buildCoursConforme,
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

describe('verifierStructure', () => {
  it('expose les treize regles de structure dans l ordre applique aux violations', () => {
    expect(REGLES_STRUCTURE).toEqual([
      'exposition-continue',
      'ratio-interaction',
      'ouverture-cloture',
      'duree-ecran',
      'duree-cours',
      'reference-inconnue',
      'reference-circulaire',
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
    const cours = recomposer(base, [
      ouverture,
      { ...citation, notes },
      atelier,
      cloture,
    ]);

    expect(regles(cours)).not.toContain('notes-formateur');
  });

  it.each([
    ['faites d espaces', '   '],
    ['avec une ligne blanche', `${NOTES_DU_FORMATEUR}\n  `],
    ['avec une puce vide', `${NOTES_DU_FORMATEUR}\n•  `],
  ])('G03 · refuse des notes présentes mais %s', (_, notes) => {
    const cours = recomposer(base, [
      ouverture,
      { ...citation, notes },
      atelier,
      cloture,
    ]);

    expect(verifierStructure(cours)).toEqual([
      expect.objectContaining({ regle: 'notes-formateur', ecran: citation.id }),
    ]);
  });
});

describe('verifierStructure — questions fermees en atelier', () => {
  it.each([7, 16])('refuse un atelier note de %i minutes', (duree) => {
    const cours = recomposer(base, [
      ouverture,
      citation,
      { ...atelier, dureeMinutes: duree },
      cloture,
    ]);

    expect(regles(cours)).toContain('atelier-questions-fermees');
  });

  it.each([8, 15])('accepte un atelier note de %i minutes', (duree) => {
    const cours = recomposer(base, [
      ouverture,
      citation,
      { ...atelier, dureeMinutes: duree },
      cloture,
    ]);

    expect(regles(cours)).not.toContain('atelier-questions-fermees');
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
      ouverture,
      cloture,
      citation,
    ]);

    expect(
      verifierStructure(cours)
        .filter((violation) => violation.regle === 'atelier-questions-fermees')
        .map((violation) => violation.ecran),
    ).toEqual([ouverture.id, cloture.id]);
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
