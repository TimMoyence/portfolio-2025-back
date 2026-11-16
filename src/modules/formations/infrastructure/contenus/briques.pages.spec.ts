import {
  defiDeConsigne,
  pageDessinee,
  paragraphe,
  strategie,
  type PageDeSerie,
  type PageDeWord,
} from './briques';

const PAGE: PageDeSerie = {
  syntaxe: 'Accueil › Gras.',
  piege: 'souligner un titre.',
  exemple: '« record » en gras.',
  correspondances: [
    ['Pastille 1', 'le gras'],
    ['Pastille 2', 'l’italique'],
    ['Pastille 3', 'le soulignement'],
  ],
};

describe('paragraphe', () => {
  it('écrit un paragraphe Normal, sans pastille quand on n’en donne pas', () => {
    expect(paragraphe([{ text: 'Bilan' }])).toStrictEqual({
      style: 'normal',
      runs: [{ text: 'Bilan' }],
    });
  });

  it('porte la pastille qu’on lui donne', () => {
    expect(paragraphe([{ text: 'Bilan' }], 2)).toStrictEqual({
      style: 'normal',
      runs: [{ text: 'Bilan' }],
      marker: 2,
    });
  });
});

describe('pageDessinee', () => {
  it('sert la page dessinée au catalogue en deux minutes, sans sous-titre, avec la syntaxe, le piège puis l’exemple et une ligne par pastille', () => {
    const page: PageDeWord = {
      orientation: 'portrait',
      blocks: [paragraphe([{ text: 'Bilan' }], 1)],
    };

    const ecran = pageDessinee(
      {
        screenId: 'B3-03-A1-08-PAGE',
        titre: 'Page : le gras',
        concepts: ['mise-en-forme-des-caracteres'],
        notes: ['2 min.'],
      },
      { ...PAGE, page, pageAlt: 'Une page portrait.' },
    );

    expect(ecran.proprietes.presentation?.props).not.toHaveProperty('subtitle');
    expect(ecran).toMatchObject({
      diffusion: 'catalogue',
      dureeMinutes: 2,
      notes: '• 2 min.',
      proprietes: {
        presentation: {
          renderer: 'page',
          props: {
            title: 'Page : le gras',
            page,
            pageAlt: 'Une page portrait.',
            paragraphs: [
              'Syntaxe : Accueil › Gras.',
              'Le piège : souligner un titre.',
              'Exemple : « record » en gras.',
            ],
            items: [
              'Pastille 1 → le gras',
              'Pastille 2 → l’italique',
              'Pastille 3 → le soulignement',
            ],
          },
        },
      },
    });
  });
});

describe('defiDeConsigne', () => {
  const defi = defiDeConsigne({
    screenId: 'B3-99-A3-05-DEFI-CONSIGNE',
    titre: 'Exercice 9 — Votre consigne',
    aRelire: 'la consigne en cinq parties',
    probleme: {
      id: 'b3-99-consigne',
      enonce: 'Écrivez la consigne.',
      invite: 'En cinq parties.',
    },
    strategies: [strategie('ameliorer', '« Améliore ce texte. »', true)],
    pourquoiLaFausse: 'ni lecteur, ni format.',
    explication: 'Une bonne consigne tient en cinq parties.',
  });

  it('ouvre les stratégies par le rôle de l’assistant de Norvane, avant celles de l’écran', () => {
    expect(
      defi.proprietes.corrige.strategies.map(({ id }) => id),
    ).toStrictEqual(['role', 'ameliorer']);
  });

  it('dure cinq minutes de défi solo, plus deux de correction sur place qui disent pourquoi la dernière est fausse', () => {
    expect(defi).toMatchObject({
      brique: 'fp-challenge',
      diffusion: 'seance',
      dureeMinutes: 7,
      concepts: ['ia-redactrice'],
      proprietes: {
        modalite: 'solo',
        correctionSurPlace: {
          explications: [
            {
              reference: 'consigne',
              texte: 'Une bonne consigne tient en cinq parties.',
            },
          ],
        },
      },
    });
    expect(defi.notes).toContain(
      'Révéler les stratégies ; demander pourquoi la dernière est fausse : ni lecteur, ni format.',
    );
  });
});
