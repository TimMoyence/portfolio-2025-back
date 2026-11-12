import {
  corrigeSurPlace,
  pourComprendreDans,
  pulsation,
  tempsDeLExercice,
} from './briques';

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
  it('sert la phrase, la règle, puis chaque correspondance image → cours dans l’ordre', () => {
    expect(
      pourComprendre(SOCLE_D_IMAGE, SCENE, 'Question : la pente en haut ?'),
    ).toMatchObject({
      notes:
        '• 1 min : faire décrire l’image, puis faire dire à quoi correspond chaque élément dans le cours.\n• Question : la pente en haut ?',
      proprietes: {
        presentation: {
          renderer: 'image-left',
          props: {
            title: 'La pente sous le vélo',
            image: '/assets/cours/b2-99/v1/velo.webp',
            paragraphs: [
              'Le vélo monte, roule à plat, puis redescend.',
              'En maths, on écrit : f′(a) est la pente de la tangente.',
            ],
            items: [
              'La montée → f′(a) > 0',
              'Le plat du sommet → f′(a) = 0',
              'La descente → f′(a) < 0',
            ],
          },
        },
      },
    });
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
      notes: '• 30 s de vote anonyme.',
      proprietes: { sondage: SONDAGE },
    });
  });

  it('fait suivre la consigne du vote des notes propres au jalon', () => {
    const { notes } = pulsation(SOCLE, SONDAGE, 'Reprendre la fiche A1-06.');

    expect(notes).toBe('• 30 s de vote anonyme.\n• Reprendre la fiche A1-06.');
  });
});

describe('tempsDeLExercice', () => {
  it('annonce la réflexion puis le travail', () => {
    expect(tempsDeLExercice(2, 6)).toBe(
      'Temps : réflexion 2 min · travail 6 min',
    );
  });

  it('reste la ligne que la correction sur place prolonge de sa durée', () => {
    const corrige = corrigeSurPlace(
      pulsation(SOCLE, SONDAGE, tempsDeLExercice(1, 5)),
      { minutes: 3, notes: ['Corriger au tableau.'] },
      [['A1', 'Lire la ligne 1.']],
    );

    expect(corrige.notes).toContain(
      '• Temps : réflexion 1 min · travail 5 min · correction 3 min',
    );
  });
});
