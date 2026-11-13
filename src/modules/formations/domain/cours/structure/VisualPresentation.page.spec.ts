import { parseVisualPresentation } from './VisualPresentation';

type Bloc = Readonly<Record<string, unknown>>;

const titre = (marker?: number): Bloc => ({
  style: 'heading1',
  runs: [{ text: '1. Bilan de l’année' }],
  ...(marker === undefined ? {} : { marker }),
});

const PAGE_JUSTE = {
  orientation: 'portrait',
  marks: true,
  header: {
    style: 'normal',
    align: 'right',
    runs: [{ text: 'Brasserie des Halles · exemple inventé', tone: 'muted' }],
    marker: 1,
  },
  blocks: [
    { style: 'title', align: 'center', runs: [{ text: 'Rapport d’activité' }] },
    titre(2),
    {
      style: 'normal',
      align: 'justify',
      runs: [
        { text: 'Bonjour ' },
        { text: '«prenom»', field: true },
        { text: ', le chiffre d’affaires ' },
        { text: 'progresse', bold: true, italic: true, underline: true },
        { text: '.', tone: 'accent' },
      ],
    },
    { style: 'empty', runs: [] },
    {
      style: 'table',
      rows: [
        ['client', 'ville'],
        ['Halles', 'Lyon'],
      ],
    },
  ],
  footer: {
    style: 'normal',
    align: 'center',
    runs: [{ text: 'Page 2 sur 5' }],
    marker: 3,
  },
};

const page = (contenu: Bloc, items: readonly string[]) => ({
  renderer: 'page',
  props: {
    title: 'Page : en-tête et pied de page',
    subtitle: 'Traitement de texte · page 6 sur 11',
    page: contenu,
    pageAlt:
      'Une page portrait : un en-tête aligné à droite, un titre de niveau 1, un pied centré « Page 2 sur 5 ».',
    paragraphs: [
      'Syntaxe : Insertion › En-tête.',
      'Le piège : taper le numéro à la main.',
      'Exemple : « Page 2 sur 5 ».',
    ],
    items,
  },
});

const TROIS = [
  'Pastille 1 → l’en-tête',
  'Pastille 2 → Titre 1',
  'Pastille 3 → le pied',
];

const refusDe = (contenu: Bloc, items: readonly string[]): string => {
  try {
    parseVisualPresentation(page(contenu, items));
  } catch (erreur) {
    return String(erreur);
  }
  return 'accepté';
};

describe('rendu page dessinée (B3-03, B3-04)', () => {
  it('PAGE-01 sert une page : en-tête, corps stylé, champ de fusion, tableau, pied et trois pastilles', () => {
    expect(parseVisualPresentation(page(PAGE_JUSTE, TROIS))).toEqual(
      page(PAGE_JUSTE, TROIS),
    );
  });

  it('PAGE-01 accepte une quatrième pastille posée sur la marge d’une page paysage', () => {
    const paysage = {
      ...PAGE_JUSTE,
      orientation: 'landscape',
      marginMarker: 4,
    };

    expect(refusDe(paysage, [...TROIS, 'Pastille 4 → la marge'])).toBe(
      'accepté',
    );
  });

  it('PAGE-02 refuse une pastille posée deux fois', () => {
    const doublee = { ...PAGE_JUSTE, blocks: [titre(1), ...PAGE_JUSTE.blocks] };

    expect(refusDe(doublee, TROIS)).toContain(
      'les pastilles vont de 1 à 3, une fois chacune, une par correspondance : la page porte 1, 1, 2, 3',
    );
  });

  it('PAGE-02 refuse une correspondance sans pastille', () => {
    expect(refusDe(PAGE_JUSTE, [...TROIS, 'Pastille 4 → rien'])).toContain(
      'les pastilles vont de 1 à 4, une fois chacune, une par correspondance : la page porte 1, 2, 3',
    );
  });

  it('PAGE-02 refuse deux pastilles seulement, comme une image commentée', () => {
    const deux = {
      ...PAGE_JUSTE,
      footer: { ...PAGE_JUSTE.footer, marker: undefined },
    };

    expect(refusDe(deux, TROIS.slice(0, 2))).not.toBe('accepté');
  });

  const avecUnTon = (tone: string): Bloc => ({
    ...PAGE_JUSTE,
    blocks: [
      ...PAGE_JUSTE.blocks,
      { style: 'normal', runs: [{ text: 'alerte', tone }] },
    ],
  });

  it.each(['accent', 'alert', 'muted'])(
    'PAGE-01 accepte le ton %s, pris dans la liste fermée',
    (tone) => {
      expect(refusDe(avecUnTon(tone), TROIS)).toBe('accepté');
    },
  );

  it('PAGE-01 refuse un ton libre, les pastilles restant justes', () => {
    const refus = refusDe(avecUnTon('red'), TROIS);

    expect(refus).toContain('tone');
    expect(refus).not.toContain('les pastilles vont de');
  });

  it('PAGE-01 refuse un style de paragraphe hors de la liste du contrat', () => {
    const citation = {
      ...PAGE_JUSTE,
      blocks: [...PAGE_JUSTE.blocks, { style: 'quote', runs: [{ text: 'x' }] }],
    };

    expect(refusDe(citation, TROIS)).not.toBe('accepté');
  });

  it('PAGE-01 aligne à gauche le paragraphe sans alignement, et refuse un alignement à gauche écrit', () => {
    const aGauche = {
      ...PAGE_JUSTE,
      blocks: [
        ...PAGE_JUSTE.blocks,
        { style: 'normal', align: 'left', runs: [{ text: 'x' }] },
      ],
    };
    const sansAlignement = {
      ...PAGE_JUSTE,
      blocks: [
        ...PAGE_JUSTE.blocks,
        { style: 'normal', runs: [{ text: 'x' }] },
      ],
    };

    expect(refusDe(aGauche, TROIS)).not.toBe('accepté');
    expect(refusDe(sansAlignement, TROIS)).toBe('accepté');
  });

  it('PAGE-01 refuse un paragraphe vide qui porte du texte, et un paragraphe écrit sans texte', () => {
    const videPlein = {
      ...PAGE_JUSTE,
      blocks: [...PAGE_JUSTE.blocks, { style: 'empty', runs: [{ text: 'x' }] }],
    };
    const normalVide = {
      ...PAGE_JUSTE,
      blocks: [...PAGE_JUSTE.blocks, { style: 'normal', runs: [] }],
    };

    expect(refusDe(videPlein, TROIS)).toContain(
      'un paragraphe vide ne porte aucun texte, un autre en porte',
    );
    expect(refusDe(normalVide, TROIS)).toContain(
      'un paragraphe vide ne porte aucun texte, un autre en porte',
    );
  });
});
