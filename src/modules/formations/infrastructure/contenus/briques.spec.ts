import {
  corrigeSurPlace,
  enPiege,
  pourComprendreDans,
  pulsation,
} from './briques';

describe('enPiege', () => {
  it('écrit un piège chiffré en objet, sa valeur puis sa confusion', () => {
    expect(enPiege([12.5, 'base-inversee'])).toStrictEqual({
      valeur: 12.5,
      confusion: 'base-inversee',
    });
  });

  it('garde une valeur nulle ou négative telle quelle', () => {
    expect(enPiege([-0.5, 'base-inversee'])).toStrictEqual({
      valeur: -0.5,
      confusion: 'base-inversee',
    });
  });
});

const pourComprendre = pourComprendreDans('/assets/cours/b2-99/v1');
const SOCLE_D_IMAGE: Parameters<typeof pourComprendre>[0] = {
  screenId: 'B2-99-A1-02-ENFANT-VELO',
  titre: 'La pente sous le vélo',
  concepts: ['fonction-derivee'],
};
const SCENE: Parameters<typeof pourComprendre>[1] = {
  fichier: 'velo.webp',
  imageAlt: 'Un vélo monte une colline, roule à plat au sommet, puis descend.',
  scene: 'Le vélo monte, roule à plat, puis redescend.',
  regle: 'f′(a) est la pente de la tangente.',
  correspondances: [
    ['La montée', 'f′(a) > 0'],
    ['Le plat du sommet', 'f′(a) = 0'],
    ['La descente', 'f′(a) < 0'],
  ],
};

describe('pourComprendreDans', () => {
  it('RET-05 · sert la phrase, puis chaque correspondance image → cours, puis la règle en conclusion', () => {
    expect(
      pourComprendre(SOCLE_D_IMAGE, SCENE, 'Question : la pente en haut ?'),
    ).toMatchObject({
      notes: '• Question : la pente en haut ?',
      proprietes: {
        presentation: {
          renderer: 'image-left',
          props: {
            title: 'La pente sous le vélo',
            image: '/assets/cours/b2-99/v1/velo.webp',
            paragraphs: ['Le vélo monte, roule à plat, puis redescend.'],
            items: [
              'La montée → f′(a) > 0',
              'Le plat du sommet → f′(a) = 0',
              'La descente → f′(a) < 0',
            ],
            conclusion:
              'En maths, on écrit : f′(a) est la pente de la tangente.',
          },
        },
      },
    });
  });

  it('RET-09 · ne sert aucune note quand l’écran n’a pas de relance', () => {
    expect(pourComprendre(SOCLE_D_IMAGE, SCENE).notes).toBe('');
  });

  it('sert la quatrième correspondance quand l’écran en donne quatre', () => {
    const ecran = pourComprendre(
      SOCLE_D_IMAGE,
      {
        ...SCENE,
        correspondances: [
          ['La montée', 'f′(a) > 0'],
          ['Le plat du sommet', 'f′(a) = 0'],
          ['La descente', 'f′(a) < 0'],
          ['Le segment sous la roue', 'la tangente'],
        ],
      },
      'Question : la pente en haut ?',
    );

    expect(ecran).toMatchObject({
      proprietes: {
        presentation: {
          props: {
            items: [
              'La montée → f′(a) > 0',
              'Le plat du sommet → f′(a) = 0',
              'La descente → f′(a) < 0',
              'Le segment sous la roue → la tangente',
            ],
          },
        },
      },
    });
  });
});

const SOCLE: Parameters<typeof pulsation>[0] = {
  screenId: 'B2-99-A1-09-JALON',
  titre: 'Jalon 1 : lire un tableau',
  concepts: ['contrat-de-lecture'],
};
const SONDAGE = { id: 'b2-99-a1-jalon', invite: 'Je sais lire un tableau.' };

describe('pulsation', () => {
  it('projette en séance un sondage anonyme d une minute', () => {
    const ecran = pulsation(SOCLE, SONDAGE);

    expect(ecran).toEqual({
      ...SOCLE,
      diffusion: 'seance',
      brique: 'fp-pulse',
      dureeMinutes: 1,
      notes: '',
      proprietes: { sondage: SONDAGE },
    });
  });

  it('RET-09 · ne sert que les notes écrites pour le jalon', () => {
    const { notes } = pulsation(SOCLE, SONDAGE, 'Reprendre la fiche A1-06.');

    expect(notes).toBe('• Reprendre la fiche A1-06.');
  });
});

describe('corrigeSurPlace', () => {
  it('RET-09 · ajoute la durée de la correction sans écrire de note d’office', () => {
    const corrige = corrigeSurPlace(pulsation(SOCLE, SONDAGE), { minutes: 3 }, [
      ['A1', 'Lire la ligne 1.'],
    ]);

    expect([corrige.dureeMinutes, corrige.notes]).toEqual([4, '']);
  });

  it('fait suivre les notes de l’exercice de celles de sa correction', () => {
    const corrige = corrigeSurPlace(
      pulsation(SOCLE, SONDAGE, 'Relancer les binômes.'),
      { minutes: 3, notes: ['Corriger au tableau.'] },
      [['A1', 'Lire la ligne 1.']],
    );

    expect(corrige.notes).toBe(
      '• Relancer les binômes.\n• Corriger au tableau.',
    );
  });
});
