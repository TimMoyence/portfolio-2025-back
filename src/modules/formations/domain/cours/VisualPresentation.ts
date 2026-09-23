import { z } from 'zod';
import { media, texte } from './SchemasCommuns';

const textes = z.array(texte).min(1);
const lien = z.object({ href: z.url(), label: texte }).strict();
const quiz = z
  .object({
    id: texte,
    type: z.literal('quiz'),
    question: texte,
    options: z.array(texte).min(2),
    context: texte.optional(),
    competency: texte.optional(),
  })
  .strict();
const reflection = z
  .object({
    id: texte,
    type: z.literal('reflection'),
    question: texte,
    placeholder: texte.optional(),
    context: texte.optional(),
    competency: texte.optional(),
  })
  .strict();
const titled = { title: texte, subtitle: texte.optional() };
const item = z
  .object({
    title: texte,
    description: texte,
    back: texte.optional(),
    href: z.url().optional(),
    external: z.boolean().optional(),
  })
  .strict();
const column = z
  .object({
    label: texte,
    tone: z
      .enum(['danger', 'warning', 'info', 'neutral', 'success'])
      .optional(),
    items: textes,
  })
  .strict();
const series = z
  .object({
    label: texte,
    values: z.array(z.number()).min(1),
    tone: z.enum(['teal', 'gold', 'ink']).optional(),
  })
  .strict();
const categorieCorrigee = z.object({ id: texte, label: texte }).strict();
const carteCorrigee = z
  .object({ id: texte, label: texte, category: texte, justification: texte })
  .strict();
const correctionDeTri = z
  .object({
    ...titled,
    source: z.object({ screenId: texte, sortId: texte }).strict(),
    categories: z.array(categorieCorrigee).min(1),
    cards: z.array(carteCorrigee).min(1),
  })
  .strict()
  .superRefine(({ categories, cards }, contexte) => {
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
const image = {
  ...titled,
  image: media,
  imageAlt: texte,
  paragraphs: textes,
  items: textes.optional(),
  sourceLink: lien.optional(),
};

export const presentationVisuelle = z.discriminatedUnion('renderer', [
  z
    .object({
      renderer: z.literal('hero'),
      props: z
        .object({
          ...titled,
          bullets: textes,
          bgImage: media.optional(),
          bgImageAlt: texte.optional(),
        })
        .strict(),
    })
    .strict(),
  z
    .object({
      renderer: z.literal('method-path'),
      props: z
        .object({
          ...titled,
          steps: z
            .array(
              z
                .object({
                  id: texte,
                  title: texte,
                  question: texte,
                  proof: texte,
                  result: texte,
                })
                .strict(),
            )
            .min(1),
        })
        .strict(),
    })
    .strict(),
  z
    .object({
      renderer: z.literal('quiz'),
      props: z.object({ questionData: quiz }).strict(),
    })
    .strict(),
  z
    .object({
      renderer: z.literal('chart'),
      props: z
        .object({
          title: texte,
          caption: texte.optional(),
          context: texte.optional(),
          labels: textes,
          series: z.array(series).min(1),
          axisRanges: z.array(z.tuple([z.number(), z.number()])).optional(),
          axisLabels: textes.optional(),
          unit: texte.optional(),
          formula: texte.optional(),
          reading: texte.optional(),
          source: texte.optional(),
          kind: z.enum(['bars', 'line']).optional(),
          description: texte.optional(),
        })
        .strict(),
    })
    .strict(),
  z
    .object({
      renderer: z.literal('grid'),
      props: z
        .object({
          ...titled,
          items: z.array(item).min(1),
          imprimable: z.boolean().optional(),
        })
        .strict(),
    })
    .strict(),
  z
    .object({
      renderer: z.literal('comparison'),
      props: z
        .object({
          ...titled,
          note: texte.optional(),
          columns: z.array(column).min(1),
        })
        .strict(),
    })
    .strict(),
  z
    .object({
      renderer: z.literal('stats'),
      props: z
        .object({
          ...titled,
          stats: z
            .array(z.object({ value: texte, label: texte }).strict())
            .min(1),
        })
        .strict(),
    })
    .strict(),
  z
    .object({
      renderer: z.literal('reflection'),
      props: z.object({ promptData: reflection }).strict(),
    })
    .strict(),
  z
    .object({
      renderer: z.literal('quote'),
      props: z
        .object({
          quote: texte,
          author: texte.optional(),
          role: texte.optional(),
          context: texte.optional(),
        })
        .strict(),
    })
    .strict(),
  z
    .object({
      renderer: z.literal('table'),
      props: z
        .object({
          ...titled,
          note: texte.optional(),
          columns: z
            .array(z.object({ key: texte, label: texte }).strict())
            .min(1),
          rows: z.array(z.record(texte, texte)).min(1),
          sourceLink: lien.optional(),
        })
        .strict(),
    })
    .strict(),
  z
    .object({
      renderer: z.literal('image-left'),
      props: z.object({ ...image, nestedQuiz: quiz.optional() }).strict(),
    })
    .strict(),
  z
    .object({
      renderer: z.literal('image-right'),
      props: z.object(image).strict(),
    })
    .strict(),
  z
    .object({
      renderer: z.literal('cta'),
      props: z
        .object({
          title: texte,
          description: texte,
          ctaLabel: texte,
          ctaHref: texte,
        })
        .strict(),
    })
    .strict(),
  z
    .object({
      renderer: z.literal('guide'),
      props: z
        .object({
          ...titled,
          context: texte.optional(),
          takeaway: texte.optional(),
          nextAction: texte.optional(),
          items: z
            .array(
              z
                .object({
                  title: texte,
                  description: texte,
                  detail: texte.optional(),
                })
                .strict(),
            )
            .min(1),
        })
        .strict(),
    })
    .strict(),
  z
    .object({
      renderer: z.literal('sort-review'),
      props: correctionDeTri,
    })
    .strict(),
]);

export type VisualPresentation = z.infer<typeof presentationVisuelle>;

export function parseVisualPresentation(value: unknown): VisualPresentation {
  return presentationVisuelle.parse(value);
}
