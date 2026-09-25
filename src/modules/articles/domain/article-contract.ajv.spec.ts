import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { validArticleIngestEnvelope } from '../testing/article-ingest.fixture';

const schema = JSON.parse(
  readFileSync(
    resolve(
      __dirname,
      '../../../../docs/contracts/article-ingest-envelope-v1.json',
    ),
    'utf8',
  ),
);

type Enveloppe = typeof validArticleIngestEnvelope;

function valider(modifier: (payload: Enveloppe) => void = () => undefined) {
  const ajv = new Ajv2020({ allErrors: true });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  const payload = structuredClone(validArticleIngestEnvelope);
  modifier(payload);
  return validate(payload);
}

describe('ArticleIngestEnvelopeV1 JSON Schema', () => {
  it('est accepté par le validateur AJV à partir du schéma partagé', () => {
    expect(valider()).toBe(true);
  });

  it('accepte les dates de source nulles et une description SEO courte autorisées par le Pi', () => {
    expect(
      valider((payload) => {
        payload.article.sources[0].published_at = null;
        payload.article.sources[0].retrieved_at = null;
        payload.article.seo.description = 'Veille IA sourcée du jour.';
      }),
    ).toBe(true);
  });

  it('refuse un section.id d un seul caractère, comme zod', () => {
    expect(
      valider((payload) => {
        payload.article.sections[0].id = 'a';
      }),
    ).toBe(false);
  });
});
