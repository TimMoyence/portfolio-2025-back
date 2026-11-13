import { z } from 'zod';
import { lienHttp } from '../../../../../common/domain/liens/lien-web';
import { auMillionieme } from '../../../../../common/domain/nombres/arrondi';
import { avecVirgule } from '../../../../../common/domain/nombres/ecriture-francaise';
import { BRANCHE_A_DEDUIRE, produitDuChemin } from './ArbrePondere';
import {
  auMoinsUn,
  media,
  signaleurDe,
  texte,
} from '../stockage/SchemasCommuns';

const strict = <F extends z.ZodRawShape>(forme: F) => z.object(forme).strict();

const textes = auMoinsUn(texte);
const lien = strict({ href: lienHttp, label: texte });
const reflection = strict({
  id: texte,
  type: z.literal('reflection'),
  question: texte,
  placeholder: texte.optional(),
  context: texte.optional(),
  competency: texte.optional(),
});
const titled = { title: texte, subtitle: texte.optional() };
const item = strict({
  title: texte,
  description: texte,
  back: texte.optional(),
  href: lienHttp.optional(),
  external: z.boolean().optional(),
});
const column = strict({
  label: texte,
  tone: z.enum(['warning', 'info', 'success']).optional(),
  items: textes,
});
const series = strict({
  label: texte,
  values: auMoinsUn(z.number()),
  tone: z.enum(['teal', 'gold', 'ink']).optional(),
});
const resumeEnCinqNombres = strict({
  label: texte,
  min: z.number(),
  q1: z.number(),
  median: z.number(),
  q3: z.number(),
  max: z.number(),
  mean: z.number().optional(),
  tone: z.enum(['teal', 'gold', 'ink']).optional(),
}).refine(
  ({ min, q1, median, q3, max, mean }) =>
    min <= q1 &&
    q1 <= median &&
    median <= q3 &&
    q3 <= max &&
    (mean === undefined || (min <= mean && mean <= max)),
  { message: 'min ≤ Q1 ≤ médiane ≤ Q3 ≤ max, moyenne comprise' },
);
const axeCroissant = z
  .tuple([z.number(), z.number()])
  .refine(([debut, fin]) => debut < fin, { message: 'axe croissant' });
const boiteAMoustaches = strict({
  ...titled,
  unit: texte.optional(),
  axisRange: axeCroissant,
  series: auMoinsUn(resumeEnCinqNombres),
  reading: texte.optional(),
  source: texte.optional(),
  description: texte,
}).superRefine(({ axisRange: [debut, fin], series }, contexte) => {
  for (const [position, { min, max }] of series.entries()) {
    if (min < debut || max > fin) {
      signaleurDe(contexte)(
        ['series', position],
        `série hors de l’axe [${debut} ; ${fin}]`,
      );
    }
  }
});
const coordonnees = { x: z.number(), y: z.number() };
const nuageDePoints = strict({
  ...titled,
  xLabel: texte,
  yLabel: texte,
  xRange: axeCroissant,
  yRange: axeCroissant,
  points: z.array(strict({ ...coordonnees, label: texte.optional() })).min(2),
  meanPoint: strict(coordonnees).optional(),
  line: strict({
    slope: z.number(),
    intercept: z.number(),
    label: texte.optional(),
  }).optional(),
  reading: texte.optional(),
  source: texte.optional(),
  description: texte,
}).superRefine(({ xRange, yRange, points, meanPoint }, contexte) => {
  const signaler = signaleurDe(contexte);
  const dansLesAxes = ({ x, y }: { x: number; y: number }): boolean =>
    x >= xRange[0] && x <= xRange[1] && y >= yRange[0] && y <= yRange[1];
  for (const [position, point] of points.entries()) {
    if (!dansLesAxes(point)) {
      signaler(['points', position], 'point hors des axes');
    }
  }
  if (meanPoint !== undefined && !dansLesAxes(meanPoint)) {
    signaler(['meanPoint'], 'point moyen hors des axes');
  }
});
const probabiliteDeBranche = z.union([
  z.number(),
  z.literal(BRANCHE_A_DEDUIRE),
]);
const brancheFinale = strict({
  evenement: texte,
  probabilite: probabiliteDeBranche,
  produit: probabiliteDeBranche.optional(),
});
const brancheDeTete = strict({
  evenement: texte,
  probabilite: probabiliteDeBranche,
  branches: z.array(brancheFinale).optional(),
});
type BrancheDArbre = z.infer<typeof brancheFinale>;

function controlerNoeud(
  nom: string,
  branches: readonly BrancheDArbre[],
  signaler: (message: string) => void,
): void {
  if (branches.length < 2) {
    signaler(`nœud « ${nom} » : un nœud porte au moins deux branches`);
  }
  for (const { evenement, probabilite } of branches) {
    if (
      probabilite !== BRANCHE_A_DEDUIRE &&
      !(probabilite > 0 && probabilite < 1)
    ) {
      signaler(
        `nœud « ${nom} », branche « ${evenement} » : une probabilité de branche est strictement entre 0 et 1`,
      );
    }
  }
  const connues = branches.flatMap(({ probabilite }) =>
    probabilite === BRANCHE_A_DEDUIRE ? [] : [probabilite],
  );
  const aDeduire = branches.length - connues.length;
  const somme = auMillionieme(connues.reduce((total, p) => total + p, 0));
  if (aDeduire > 1) {
    signaler(`nœud « ${nom} » : deux branches « ? », une seule se déduit`);
  } else if (aDeduire === 1 && somme >= 1) {
    signaler(
      `nœud « ${nom} » : la somme connue atteint 1, le « ? » vaudrait 0`,
    );
  } else if (aDeduire === 0 && somme !== 1) {
    signaler(
      `nœud « ${nom} » : ses branches somment à ${avecVirgule(somme)} au lieu de 1`,
    );
  }
}

function controlerLesProduits(
  branches: readonly z.infer<typeof brancheDeTete>[],
  signaler: (message: string) => void,
): void {
  const chemins = branches.flatMap((branche) =>
    (branche.branches ?? []).map((feuille) => ({
      nom: `${branche.evenement} → ${feuille.evenement}`,
      saisi: feuille.produit,
      calcule: produitDuChemin(branche.probabilite, feuille.probabilite),
    })),
  );
  const affiches = chemins.filter(({ saisi }) => saisi !== undefined);
  if (affiches.length > 0 && affiches.length < chemins.length) {
    signaler('les produits s’affichent au bout de tous les chemins ou d’aucun');
  }
  for (const { nom, saisi, calcule } of affiches) {
    if (calcule === BRANCHE_A_DEDUIRE && saisi !== BRANCHE_A_DEDUIRE) {
      signaler(
        `chemin « ${nom} » : il traverse un « ? », son produit reste blanc`,
      );
    } else if (calcule !== BRANCHE_A_DEDUIRE && saisi !== calcule) {
      signaler(
        `chemin « ${nom} » : le produit vaut ${avecVirgule(calcule)}, pas ${saisi === BRANCHE_A_DEDUIRE ? '« ? »' : avecVirgule(saisi ?? 0)}`,
      );
    }
  }
}

const arbrePondere = strict({
  ...titled,
  branches: z.array(brancheDeTete),
  reading: texte.optional(),
  description: texte,
}).superRefine(({ branches }, contexte) => {
  const signaler = signaleurDe(contexte);
  controlerNoeud('racine', branches, (message) =>
    signaler(['branches'], message),
  );
  for (const [position, branche] of branches.entries()) {
    if (branche.branches !== undefined) {
      controlerNoeud(branche.evenement, branche.branches, (message) =>
        signaler(['branches', position, 'branches'], message),
      );
    }
  }
  controlerLesProduits(branches, (message) => signaler(['branches'], message));
});
const BLOCS_MAXIMUM_D_UNE_LECON = 4;
const blocDeLecon = strict({
  kind: z.enum(['definition', 'property', 'method', 'example', 'exam']),
  title: texte,
  text: texte,
  formula: texte.optional(),
  steps: textes.optional(),
});
const categorieCorrigee = strict({ id: texte, label: texte });
const carteCorrigee = strict({
  id: texte,
  label: texte,
  category: texte,
  justification: texte,
});
const correctionDeTri = strict({
  ...titled,
  source: strict({ screenId: texte, sortId: texte }),
  categories: auMoinsUn(categorieCorrigee),
  cards: auMoinsUn(carteCorrigee),
}).superRefine(({ categories, cards }, contexte) => {
  const connues = new Set(categories.map(({ id }) => id));
  for (const [position, carte] of cards.entries()) {
    if (!connues.has(carte.category)) {
      signaleurDe(contexte)(
        ['cards', position, 'category'],
        `catégorie ${carte.category} absente de la correction`,
      );
    }
  }
});
const image = {
  ...titled,
  image: media,
  imageAlt: texte,
  paragraphs: textes,
  items: textes.optional(),
  sourceLink: lien.optional(),
};
const pastille = z.number().int().min(1).max(4);
const passage = strict({
  text: texte,
  bold: z.boolean().optional(),
  italic: z.boolean().optional(),
  underline: z.boolean().optional(),
  tone: z.enum(['accent', 'alert', 'muted']).optional(),
  field: z.boolean().optional(),
});
const paragrapheDePage = strict({
  style: z.enum([
    'title',
    'subtitle',
    'heading1',
    'heading2',
    'normal',
    'list',
    'empty',
  ]),
  align: z.enum(['center', 'right', 'justify']).optional(),
  indent: z.boolean().optional(),
  runs: z.array(passage),
  marker: pastille.optional(),
}).refine(({ style, runs }) => (style === 'empty') === (runs.length === 0), {
  message: 'un paragraphe vide ne porte aucun texte, un autre en porte',
});
const tableauDePage = strict({
  style: z.literal('table'),
  rows: z.array(textes).min(2),
  marker: pastille.optional(),
});
const blocDePage = z.union([paragrapheDePage, tableauDePage]);
const pageDessinee = strict({
  ...titled,
  page: strict({
    orientation: z.enum(['portrait', 'landscape']),
    marks: z.boolean().optional(),
    marginMarker: pastille.optional(),
    header: blocDePage.optional(),
    footer: blocDePage.optional(),
    blocks: auMoinsUn(blocDePage),
  }),
  pageAlt: texte,
  paragraphs: textes,
  items: z.array(texte).min(3).max(4),
}).superRefine(({ page, items }, contexte) => {
  const posees = [
    page.marginMarker,
    page.header?.marker,
    ...page.blocks.map(({ marker }) => marker),
    page.footer?.marker,
  ]
    .filter((marker) => marker !== undefined)
    .sort((premiere, seconde) => premiere - seconde);
  if (posees.join() !== items.map((_, rang) => rang + 1).join()) {
    signaleurDe(contexte)(
      ['page'],
      `les pastilles vont de 1 à ${items.length}, une fois chacune, une par correspondance : la page porte ${posees.join(', ')}`,
    );
  }
});

export function presentationsVisuelles<S extends z.ZodRawShape>(socle: S) {
  const rendu = <R extends string, P extends z.ZodType>(
    renderer: R,
    props: P,
  ) => strict({ ...socle, renderer: z.literal(renderer), props });
  return z.discriminatedUnion('renderer', [
    rendu(
      'hero',
      strict({
        ...titled,
        bgImage: media.optional(),
        bgImageAlt: texte.optional(),
      }),
    ),
    rendu(
      'method-path',
      strict({
        ...titled,
        steps: auMoinsUn(
          strict({
            id: texte,
            title: texte,
            question: texte,
            proof: texte,
            result: texte,
          }),
        ),
      }),
    ),
    rendu(
      'chart',
      strict({
        title: texte,
        caption: texte.optional(),
        context: texte.optional(),
        labels: textes,
        series: auMoinsUn(series),
        axisRanges: z.array(z.tuple([z.number(), z.number()])).optional(),
        axisLabels: textes.optional(),
        unit: texte.optional(),
        formula: texte.optional(),
        reading: texte.optional(),
        source: texte.optional(),
        kind: z.enum(['bars', 'line']).optional(),
        description: texte.optional(),
      }),
    ),
    rendu('boxplot', boiteAMoustaches),
    rendu('scatter', nuageDePoints),
    rendu('arbre', arbrePondere),
    rendu(
      'lesson',
      strict({
        ...titled,
        blocks: z.array(blocDeLecon).min(1).max(BLOCS_MAXIMUM_D_UNE_LECON),
      }),
    ),
    rendu(
      'grid',
      strict({
        ...titled,
        items: auMoinsUn(item),
        imprimable: z.boolean().optional(),
      }),
    ),
    rendu(
      'comparison',
      strict({ ...titled, note: texte.optional(), columns: auMoinsUn(column) }),
    ),
    rendu(
      'stats',
      strict({
        ...titled,
        stats: auMoinsUn(strict({ value: texte, label: texte })),
      }),
    ),
    rendu('reflection', strict({ promptData: reflection })),
    rendu(
      'table',
      strict({
        ...titled,
        note: texte.optional(),
        columns: auMoinsUn(strict({ key: texte, label: texte })),
        rows: auMoinsUn(z.record(texte, texte)),
        sourceLink: lien.optional(),
      }),
    ),
    rendu('image-left', strict(image)),
    rendu('image-right', strict(image)),
    rendu('page', pageDessinee),
    rendu('illustration', strict({ image: media, imageAlt: texte })),
    rendu('sort-review', correctionDeTri),
  ]);
}

export const presentationVisuelle = presentationsVisuelles({});

export type VisualPresentation = z.infer<typeof presentationVisuelle>;

export function parseVisualPresentation(value: unknown): VisualPresentation {
  return presentationVisuelle.parse(value);
}
