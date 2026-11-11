import { z } from 'zod';
import { empreinteSha256 } from '../../../common/domain/crypto/empreintes';
import { nommeAuContrat } from '../../../common/domain/liens/registre-du-contrat';
import { LOCALES_SUPPORTEES } from '../../../common/domain/value-objects/LocaleCode';

const DATE_HEURE_AVEC_FUSEAU =
  /^(\d{4})-(\d{2})-(\d{2})T([01]\d|2[0-3]):[0-5]\d:[0-5]\d(\.\d+)?(Z|[+-]([01]\d|2[0-3]):[0-5]\d)$/i;

function existeAuCalendrier(value: string): boolean {
  const parties = DATE_HEURE_AVEC_FUSEAU.exec(value);
  if (parties === null) {
    return false;
  }
  const [annee, mois, jour] = parties.slice(1, 4).map(Number);
  const date = new Date(Date.UTC(annee, mois - 1, jour));
  return date.getUTCMonth() === mois - 1 && date.getUTCDate() === jour;
}

const dateTime = z
  .string()
  .refine(existeAuCalendrier, { message: 'Invalid date-time' });

export const MOTIF_LIEN_HTTP = '^[Hh][Tt][Tt][Pp][Ss]?://';
export const MOTIF_LIEN_HTTPS = '^https://';

const lienDuSchema = (motif: RegExp, message: string) =>
  z
    .url()
    .max(2048)
    .refine((value) => motif.test(value), { message });

const httpUrl = lienDuSchema(
  /^https?:\/\/\S+$/,
  'Only HTTP(S) URLs are allowed',
);
const httpsUrl = lienDuSchema(/^https:\/\/\S+$/, 'Only HTTPS URLs are allowed');

const enCaracteres = (min: number, max?: number) =>
  z
    .string()
    .refine(
      (valeur) =>
        [...valeur].length >= min &&
        (max === undefined || [...valeur].length <= max),
      { message: `Entre ${min} et ${max ?? '∞'} caractères` },
    )
    .meta({
      ...(min > 0 ? { minLength: min } : {}),
      ...(max === undefined ? {} : { maxLength: max }),
    });
const texte = (max: number) => enCaracteres(1, max);
const texteFacultatif = (max: number) => enCaracteres(0, max);

export const UNITES_DU_GRAPHIQUE = ['', '%', '$', '€'] as const;

const sourceSchema = z
  .object({
    nom: texte(160),
    url: httpUrl,
    publie_le: dateTime.nullable(),
  })
  .strict();

const imageSchema = z
  .object({ url: httpsUrl, credit: texte(160) })
  .strict()
  .nullable();

const feuilletonSchema = z
  .object({ date: z.iso.date(), rappel: texteFacultatif(400) })
  .strict()
  .nullable();

const graphiqueSchema = z
  .object({
    titre: texte(160),
    unite: z.enum(UNITES_DU_GRAPHIQUE),
    barres: z
      .array(
        z
          .object({
            libelle: texte(80),
            valeur: z.number(),
            affichage: texte(60),
          })
          .strict(),
      )
      .min(3)
      .max(12),
  })
  .strict()
  .nullable();

const editoSchema = z
  .object({
    kind: z.literal('edito'),
    texte: texteFacultatif(2000),
    signature: texteFacultatif(80),
  })
  .strict();

const sujetSchema = z
  .object({
    kind: z.literal('sujet'),
    titre: texte(160),
    accroche: texte(400),
    pourquoi: texte(2000),
    contexte: texteFacultatif(2000),
    faits: texte(2000),
    et_maintenant: texteFacultatif(2000),
    bref: texte(400),
    source: sourceSchema,
    image: imageSchema,
    graphique: graphiqueSchema,
    feuilleton: feuilletonSchema,
  })
  .strict();

const shotSchema = z
  .object({
    kind: z.literal('shot'),
    histoires: z
      .array(
        z
          .object({
            accroche: texteFacultatif(120),
            texte: texte(1500),
            rubrique: z
              .string()
              .regex(/^[a-z][a-z_]{1,39}$/)
              .nullable(),
            source: sourceSchema,
            image: imageSchema,
            feuilleton: feuilletonSchema,
          })
          .strict(),
      )
      .min(2)
      .max(4),
  })
  .strict();

const decodeurSchema = z
  .object({
    kind: z.literal('decodeur'),
    terme: texte(80),
    explication: texte(1000),
  })
  .strict();

const aTesterSchema = z
  .object({
    kind: z.literal('a_tester'),
    nom: texte(160),
    texte: texte(600),
    source: sourceSchema,
  })
  .strict();

const sortiesSchema = z
  .object({
    kind: z.literal('sorties'),
    lignes: z
      .array(
        z
          .object({
            produit: texte(80),
            version: texte(40),
            changement: texte(120),
            source: sourceSchema,
          })
          .strict(),
      )
      .min(1)
      .max(6),
  })
  .strict();

const chiffreSchema = z
  .object({
    kind: z.literal('chiffre'),
    valeur: texte(60),
    texte: texte(400),
    source: sourceSchema,
  })
  .strict();

const citationSchema = z
  .object({
    kind: z.literal('citation'),
    texte: texte(600),
    auteur: texte(160),
    traduite_de: texteFacultatif(40).nullable(),
    contexte: texteFacultatif(400),
    source: sourceSchema,
  })
  .strict();

const aPartCaSchema = z
  .object({
    kind: z.literal('a_part_ca'),
    breves: z
      .array(z.object({ texte: texte(400), source: sourceSchema }).strict())
      .min(1)
      .max(5),
  })
  .strict();

export const SectionDuRecit = z.discriminatedUnion('kind', [
  editoSchema,
  sujetSchema,
  shotSchema,
  decodeurSchema,
  aTesterSchema,
  sortiesSchema,
  chiffreSchema,
  citationSchema,
  aPartCaSchema,
]);

export const TYPES_DE_SECTION = SectionDuRecit.options.map(
  (option) => option.shape.kind.value,
);

export const ArticleId = z
  .string()
  .regex(/^morning-brief-\d{4}-\d{2}-\d{2}-(fr|en)$/);

export const ArticleSlug = z
  .string()
  .regex(/^morning-brief-\d{4}-\d{2}-\d{2}$/);

export const LONGUEUR_MAX_DU_NONCE = 128;

export const DeliveryId = z.string().regex(/^mb-\d{4}-\d{2}-\d{2}-(fr|en)$/);

const seoSchema = z
  .object({
    description: texteFacultatif(160),
    canonical_path: z.string().regex(/^\/articles\/[a-z0-9-]+$/),
    keywords: z.array(z.string()),
    image_url: httpsUrl.nullable(),
    image_alt: z.string().nullable(),
  })
  .strict();

const champsCommuns = {
  article_id: ArticleId,
  slug: ArticleSlug,
  locale: z.enum(LOCALES_SUPPORTEES),
  status: z.literal('published'),
  title: texte(180),
  excerpt: texte(280),
  content_markdown: enCaracteres(100),
  reading_time_minutes: z.number().int().min(1).max(60),
  tags: z.array(texte(40)).max(12),
  published_at: dateTime,
  updated_at: dateTime,
};

function empreinteVerifiee(
  article: { content_markdown: string; provenance: { content_sha256: string } },
  context: z.RefinementCtx,
): void {
  if (
    empreinteSha256(article.content_markdown) !==
    article.provenance.content_sha256
  ) {
    context.addIssue({
      code: 'custom',
      path: ['provenance', 'content_sha256'],
      message: 'Content hash mismatch',
    });
  }
}

const provenanceDuRecit = z
  .object({
    run_id: z.string().min(1),
    edition_date: z.iso.date(),
    content_sha256: z.string().regex(/^[a-f0-9]{64}$/),
  })
  .strict();

const articleDuRecit = z
  .object({
    ...champsCommuns,
    sections: z.array(SectionDuRecit).min(2),
    sources: z.array(sourceSchema).min(1),
    provenance: provenanceDuRecit,
    seo: seoSchema,
  })
  .strict()
  .superRefine((article, context) => {
    if (
      article.sections[0].kind !== 'edito' ||
      article.sections[1].kind !== 'sujet'
    ) {
      context.addIssue({
        code: 'custom',
        path: ['sections'],
        message: 'Le récit commence par l édito puis le sujet du jour',
      });
    }
    empreinteVerifiee(article, context);
  });

const articleDAvantLaRefonte = z
  .object({
    ...champsCommuns,
    sections: z.array(z.record(z.string(), z.unknown())).min(1),
    sources: z
      .array(
        z
          .object({
            name: texte(160),
            url: httpUrl,
            published_at: dateTime.nullable(),
            retrieved_at: dateTime.nullable(),
          })
          .strict(),
      )
      .min(1),
    provenance: provenanceDuRecit.extend({
      edition_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      item_count: z.number().int().min(1),
      source_count: z.number().int().min(1),
    }),
    seo: seoSchema.extend({ image_url: httpUrl.nullable() }),
  })
  .strict()
  .superRefine(empreinteVerifiee);

const enTete = {
  delivery_id: DeliveryId,
  producer: z
    .object({
      name: z.literal('morning-brief'),
      version: z.string().min(1),
      device: z.string().min(1),
    })
    .strict(),
  sent_at: dateTime,
};

const EnveloppeDuRecit = z
  .object({
    schema_version: z.literal('2.0'),
    ...enTete,
    article: articleDuRecit,
  })
  .strict();

export const EnveloppeDAvantLaRefonte = z
  .object({
    schema_version: z.literal('1.0'),
    ...enTete,
    article: articleDAvantLaRefonte,
  })
  .strict();

export const ArticleContract = nommeAuContrat(
  z.union([EnveloppeDuRecit, EnveloppeDAvantLaRefonte]),
  'ArticleIngestEnvelope',
);

export type ArticleIngestEnvelope = z.infer<typeof ArticleContract>;
export type EnveloppeDAvantLaRefonte = z.infer<typeof EnveloppeDAvantLaRefonte>;
export type ArticleIngere = z.infer<typeof articleDuRecit>;
export type SectionDuRecit = z.infer<typeof SectionDuRecit>;
