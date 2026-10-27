import { CONTENUS } from '.';

const RETIRES: Readonly<Record<string, readonly string[]>> = {
  'b1-01-proportions-pourcentages': [
    'B1-01-A3-06-DEFI-IA',
    'B1-01-A4-01-SITUATION-FESTIVAL',
    'B1-01-A4-02-TABLEUR-FESTIVAL',
    'B1-01-A4-03-COFFRE-FESTIVAL',
    'B1-01-A4-06-BILLET-DE-SORTIE',
  ],
  'b2-01-traitement-information-chiffree': [
    'B2-01-A6-03-IA-CADRE',
    'B2-01-A6-04-IA-ERREUR',
    'B2-01-A6-08-BILLET-DE-SORTIE',
  ],
  'b2-02-series-statistiques': [
    'B2-02-A3-05-DEFI-IA',
    'B2-02-A4-06-BILLET-DE-SORTIE',
  ],
  'b2-03-logique': ['B2-03-A4-06-BILLET-DE-SORTIE'],
  'b2-04-suites': ['B2-04-A3-08-DEFI-IA', 'B2-04-A4-06-BILLET-DE-SORTIE'],
  'b2-05-mathematiques-financieres': [
    'B2-05-A3-08-DEFI-IA',
    'B2-05-A4-01-SITUATION-CAMIONNETTE',
    'B2-05-A4-02-TABLEUR-CAMIONNETTE',
    'B2-05-A4-03-COFFRE-CAMIONNETTE',
    'B2-05-A4-06-BILLET-DE-SORTIE',
  ],
  'b2-06-exponentielle-logarithme': [
    'B2-06-A3-08-DEFI-IA',
    'B2-06-A4-01-SITUATION-KITS',
    'B2-06-A4-02-TABLEUR-KITS',
    'B2-06-A4-03-COFFRE-KITS',
    'B2-06-A4-06-BILLET-DE-SORTIE',
  ],
  'b3-01-donnee-brute-decision': [
    'B3-01-A3-13-CE-QUI-RESTE-FLOU',
    'B3-01-A3-14-BILLET-DE-SORTIE',
  ],
};

const SANS_MINI_SITUATION: readonly string[] = [
  'b1-01-proportions-pourcentages',
  'b2-05-mathematiques-financieres',
  'b2-06-exponentielle-logarithme',
];

const ANNONCES_RETIREES = [
  'billet de sortie',
  'débat en binôme',
  'discussion en binôme',
  'convainquez votre voisin',
  'revote',
  'réponse d’ia',
  'une ia a ',
  'ce que l’ia peut faire',
  'cadre d’usage de l’ia',
];

function texteDe(valeur: unknown): string {
  return JSON.stringify(valeur).toLowerCase().replaceAll("'", '’');
}

describe.each(CONTENUS.map((contenu) => [contenu.slug, contenu] as const))(
  'M5 · M6 · M7 · M8 — %s après les retraits du 27/10',
  (slug, contenu) => {
    it('ne sert plus aucun écran retiré et finit sur sa fiche mémo', () => {
      const ids = contenu.ecrans.map((ecran) => ecran.screenId);

      expect(ids.filter((id) => RETIRES[slug]?.includes(id))).toEqual([]);
      expect(ids.at(-1)).toMatch(/-FICHE-MEMO$/);
    });

    it('n’annonce aucun écran retiré, aucun débat de vote ni aucun billet', () => {
      const texte = texteDe(contenu);
      const motifs = SANS_MINI_SITUATION.includes(slug)
        ? [...ANNONCES_RETIREES, 'mini-situation']
        : ANNONCES_RETIREES;

      expect(texte).toContain(contenu.titre.toLowerCase().slice(0, 12));
      expect(motifs.filter((motif) => texte.includes(motif))).toEqual([]);
    });

    it('M1 · ouvre sur une accroche sans liste de puces', () => {
      const accroches = contenu.ecrans.flatMap((ecran) => {
        const presentation =
          ecran.brique === 'fp-story' ? ecran.proprietes.presentation : null;
        return presentation?.version === 2 && presentation.renderer === 'hero'
          ? [presentation.props]
          : [];
      });

      expect(accroches).toHaveLength(1);
      expect(
        accroches.filter(
          (props) =>
            typeof props === 'object' && props !== null && 'bullets' in props,
        ),
      ).toEqual([]);
    });
  },
);
