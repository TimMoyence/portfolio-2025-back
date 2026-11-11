import { schemasDeLArticleServi } from '../../../../../test/helpers/http/schemas-de-l-article-servi';
import {
  MOTIF_LIEN_HTTPS,
  TYPES_DE_SECTION,
} from '../../domain/contrat/article-contract';

describe('MB-19 · l API sert le récit du matin', () => {
  const schemas = schemasDeLArticleServi();

  const kindDe = (nom: string) =>
    (schemas()[nom]?.properties?.kind?.enum as string[] | undefined)?.[0];

  it('MB-19 · les sections sont une union discriminée par kind, une forme par bloc du récit', () => {
    const sections = schemas().PublishedArticleResponseDto.properties?.sections
      ?.items as
      | { oneOf?: { $ref: string }[]; discriminator?: { propertyName: string } }
      | undefined;
    expect(sections?.discriminator?.propertyName).toBe('kind');
    const formes = (sections?.oneOf ?? []).map(({ $ref }) =>
      kindDe($ref.split('/').pop() ?? ''),
    );
    const parOrdre = (a?: string, b?: string) =>
      String(a).localeCompare(String(b));
    expect(formes.toSorted(parOrdre)).toEqual(
      [...TYPES_DE_SECTION].toSorted(parOrdre),
    );
  });

  it('MB-19 · aucun bloc d avant la refonte ni compteur d informations ou de sources n est servi', () => {
    const texte = JSON.stringify(schemas());
    for (const ancien of [
      'essential',
      'deep_dive',
      'radar',
      'for_business',
      'under_the_hood',
      'item_count',
      'source_count',
    ]) {
      expect(texte).not.toContain(ancien);
    }
  });

  it('MB-11 · une image servie est en https', () => {
    expect(schemas().ImageDuRecitDto?.properties?.url?.pattern).toBe(
      MOTIF_LIEN_HTTPS,
    );
  });
});
