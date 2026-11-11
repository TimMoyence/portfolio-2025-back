import {
  referenceAuContrat,
  schemasDuContrat,
} from '../../../../common/interfaces/http/schemas-du-contrat';
import { ArticleContract } from './article-contract';

type Propriete = {
  minLength?: number;
  maxLength?: number;
  properties?: Record<string, Propriete>;
  items?: Propriete;
};

describe('MB-24 · le contrat d ingestion publié garde les bornes en caractères du schéma partagé', () => {
  const id = referenceAuContrat(ArticleContract).$ref.split('/').pop() ?? '';
  const enveloppe = schemasDuContrat()[id] as unknown as {
    anyOf: { properties: { article: Propriete } }[];
  };
  const article = enveloppe.anyOf[0].properties.article.properties ?? {};

  it.each([
    ['title', article.title, 1, 180],
    ['excerpt', article.excerpt, 1, 280],
    ['seo.description', article.seo?.properties?.description, undefined, 160],
    ['sources[].nom', article.sources?.items?.properties?.nom, 1, 160],
  ])('MB-24 · %s publie ses bornes', (_champ, propriete, min, max) => {
    expect(propriete?.maxLength).toBe(max);
    expect(propriete?.minLength).toBe(min);
  });
});
