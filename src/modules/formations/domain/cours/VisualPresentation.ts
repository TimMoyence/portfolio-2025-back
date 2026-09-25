import { z } from 'zod';
import { media, texte } from './SchemasCommuns';

const strict = <F extends z.ZodRawShape>(forme: F) => z.object(forme).strict();
const auMoinsUn = <T extends z.ZodType>(element: T) => z.array(element).min(1);
const rendu = <R extends string, P extends z.ZodType>(renderer: R, props: P) =>
  strict({ renderer: z.literal(renderer), props });

const textes = auMoinsUn(texte);
const lien = strict({ href: z.url(), label: texte });
const quiz = strict({
  id: texte,
  type: z.literal('quiz'),
  question: texte,
  options: z.array(texte).min(2),
  context: texte.optional(),
  competency: texte.optional(),
});
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
  href: z.url().optional(),
  external: z.boolean().optional(),
});
const column = strict({
  label: texte,
  tone: z.enum(['danger', 'warning', 'info', 'neutral', 'success']).optional(),
  items: textes,
});
const series = strict({
  label: texte,
  values: auMoinsUn(z.number()),
  tone: z.enum(['teal', 'gold', 'ink']).optional(),
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
      contexte.addIssue({
        code: 'custom',
        path: ['cards', position, 'category'],
        message: `catégorie ${carte.category} absente de la correction`,
      });
    }
  }
});
const correctionDeReponses = strict({
  ...titled,
  source: strict({ screenId: texte }),
  explications: auMoinsUn(strict({ reference: texte, texte })),
});
const image = {
  ...titled,
  image: media,
  imageAlt: texte,
  paragraphs: textes,
  items: textes.optional(),
  sourceLink: lien.optional(),
};

export const presentationVisuelle = z.discriminatedUnion('renderer', [
  rendu(
    'hero',
    strict({
      ...titled,
      bullets: textes,
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
  rendu('quiz', strict({ questionData: quiz })),
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
    'quote',
    strict({
      quote: texte,
      author: texte.optional(),
      role: texte.optional(),
      context: texte.optional(),
    }),
  ),
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
  rendu('image-left', strict({ ...image, nestedQuiz: quiz.optional() })),
  rendu('image-right', strict(image)),
  rendu(
    'cta',
    strict({
      title: texte,
      description: texte,
      ctaLabel: texte,
      ctaHref: texte,
    }),
  ),
  rendu(
    'guide',
    strict({
      ...titled,
      context: texte.optional(),
      takeaway: texte.optional(),
      nextAction: texte.optional(),
      items: auMoinsUn(
        strict({
          title: texte,
          description: texte,
          detail: texte.optional(),
        }),
      ),
    }),
  ),
  rendu('sort-review', correctionDeTri),
  rendu('answer-review', correctionDeReponses),
]);

export type VisualPresentation = z.infer<typeof presentationVisuelle>;

export function parseVisualPresentation(value: unknown): VisualPresentation {
  return presentationVisuelle.parse(value);
}
