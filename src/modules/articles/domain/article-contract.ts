import { createHash } from 'node:crypto';
import { z } from 'zod';

const dateTime = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), {
    message: 'Invalid date-time',
  });

const httpUrl = z.url().refine((value) => /^https?:\/\//i.test(value), {
  message: 'Only HTTP(S) URLs are allowed',
});

const itemSchema = z
  .object({
    entity: z.string().max(160),
    text: z.string().min(20).max(4000),
    source: z.string().min(1).max(160),
    url: httpUrl,
    published_at: dateTime.optional(),
    retrieved_at: dateTime.optional(),
  })
  .strict();

const sectionSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]{2,80}$/),
    kind: z.enum(['essential', 'deep_dive', 'rubric', 'radar']),
    title: z.string().min(1).max(120),
    intro: z.string().max(4000),
    body: z.string().max(20000),
    items: z.array(itemSchema).max(30),
  })
  .strict();

const sourceSchema = z
  .object({
    name: z.string().min(1).max(160),
    url: httpUrl,
    published_at: dateTime.nullable(),
    retrieved_at: dateTime.nullable(),
  })
  .strict();

const articleSchema = z
  .object({
    article_id: z.string().regex(/^morning-brief-\d{4}-\d{2}-\d{2}-(fr|en)$/),
    slug: z.string().regex(/^morning-brief-\d{4}-\d{2}-\d{2}$/),
    locale: z.enum(['fr', 'en']),
    status: z.literal('published'),
    title: z.string().min(1).max(180),
    excerpt: z.string().min(1).max(280),
    content_markdown: z.string().min(100),
    reading_time_minutes: z.number().int().min(1).max(60),
    tags: z.array(z.string().min(1).max(40)).max(12),
    published_at: dateTime,
    updated_at: dateTime,
    sections: z.array(sectionSchema).min(1),
    sources: z.array(sourceSchema).min(1),
    provenance: z
      .object({
        run_id: z.string().min(1),
        edition_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        item_count: z.number().int().min(1),
        source_count: z.number().int().min(1),
        content_sha256: z.string().regex(/^[a-f0-9]{64}$/),
      })
      .strict(),
    seo: z
      .object({
        description: z.string().max(160),
        canonical_path: z.string().regex(/^\/articles\/[a-z0-9-]+$/),
        keywords: z.array(z.string()),
        image_url: httpUrl.nullable(),
        image_alt: z.string().nullable(),
      })
      .strict(),
  })
  .strict()
  .superRefine((article, context) => {
    const hash = createHash('sha256')
      .update(article.content_markdown)
      .digest('hex');
    if (hash !== article.provenance.content_sha256) {
      context.addIssue({
        code: 'custom',
        path: ['provenance', 'content_sha256'],
        message: 'Content hash mismatch',
      });
    }
  });

export const ArticleContract = z
  .object({
    schema_version: z.literal('1.0'),
    delivery_id: z.string().regex(/^mb-\d{4}-\d{2}-\d{2}-(fr|en)$/),
    producer: z
      .object({
        name: z.literal('morning-brief'),
        version: z.string().min(1),
        device: z.string().min(1),
      })
      .strict(),
    sent_at: dateTime,
    article: articleSchema,
  })
  .strict();

export type ArticleIngestEnvelope = z.infer<typeof ArticleContract>;
