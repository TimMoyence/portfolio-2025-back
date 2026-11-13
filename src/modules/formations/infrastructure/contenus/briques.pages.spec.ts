import {
  defiDeConsigne,
  pageDessineeDeLaSerie,
  paragraphe,
  strategie,
  texteDeLaPage,
  type PageDeSerie,
  type PageDeWord,
} from './briques';

const SERIE = { nom: 'Traitement de texte', pages: 11 };
const PAGE: PageDeSerie = {
  rang: 3,
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

describe('texteDeLaPage', () => {
  it('numérote la page dans sa série et écrit la syntaxe, le piège puis l’exemple, en deux minutes', () => {
    expect(texteDeLaPage(SERIE, PAGE)).toStrictEqual({
      sousTitre: 'Traitement de texte · page 3 sur 11',
      paragraphes: [
        'Syntaxe : Accueil › Gras.',
        'Le piège : souligner un titre.',
        'Exemple : « record » en gras.',
      ],
      correspondances: PAGE.correspondances,
      dureeMinutes: 2,
    });
  });
});

describe('pageDessineeDeLaSerie', () => {
  it('sert la page dessinée au catalogue, avec le texte de la série et une ligne par pastille', () => {
    const page: PageDeWord = {
      orientation: 'portrait',
      blocks: [paragraphe([{ text: 'Bilan' }], 1)],
    };

    expect(
      pageDessineeDeLaSerie(SERIE)(
        {
          screenId: 'B3-03-A1-08-PAGE',
          titre: 'Page : le gras',
          concepts: ['mise-en-forme-des-caracteres'],
          notes: ['2 min.'],
        },
        { ...PAGE, page, pageAlt: 'Une page portrait.' },
      ),
    ).toMatchObject({
      diffusion: 'catalogue',
      dureeMinutes: 2,
      notes: '• 2 min.',
      proprietes: {
        presentation: {
          renderer: 'page',
          props: {
            title: 'Page : le gras',
            subtitle: 'Traitement de texte · page 3 sur 11',
            page,
            pageAlt: 'Une page portrait.',
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
