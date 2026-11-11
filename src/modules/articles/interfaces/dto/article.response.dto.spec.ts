import { schemasDesModeles } from '../../../../../test/helpers/http/saisies-validees';
import type { SchemaOpenApi } from '../../../../../test/helpers/http/schema-openapi';
import {
  MOTIF_LIEN_HTTP,
  MOTIF_LIEN_HTTPS,
} from '../../domain/contrat/article-contract';
import { PublishedArticleResponseDto } from './article.response.dto';

const champsUri = (
  schemas: Record<string, SchemaOpenApi>,
): [string, SchemaOpenApi][] =>
  Object.entries(schemas).flatMap(([nom, schema]) =>
    Object.entries(schema.properties ?? {})
      .filter(([, propriete]) => propriete.format === 'uri')
      .map(([cle, propriete]): [string, SchemaOpenApi] => [
        `${nom}.${cle}`,
        propriete,
      ]),
  );

describe('PublishedArticleResponseDto', () => {
  let champs: [string, SchemaOpenApi][] = [];

  beforeAll(async () => {
    champs = champsUri(
      (await schemasDesModeles([PublishedArticleResponseDto])).get(
        PublishedArticleResponseDto,
      ) ?? {},
    );
  });

  it('borne les liens d une edition au motif du contrat d ingestion', () => {
    expect(
      champs
        .map(([nom, propriete]) => [nom, propriete.pattern])
        .sort(([a], [b]) => String(a).localeCompare(String(b))),
    ).toEqual([
      ['ArticleSeoResponseDto.image_url', MOTIF_LIEN_HTTP],
      ['ImageDuRecitDto.url', MOTIF_LIEN_HTTPS],
      ['SourceDuRecitDto.url', MOTIF_LIEN_HTTP],
    ]);
  });

  it.each([
    'javascript:alert(1)',
    'JavaScript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    ' https://exemple.fr',
  ])('le motif refuse le lien %s', (lien) => {
    expect(new RegExp(MOTIF_LIEN_HTTP).test(lien)).toBe(false);
  });

  it.each(['https://exemple.fr/a', 'HTTPS://EXEMPLE.FR'])(
    'le motif accepte le lien %s',
    (lien) => {
      expect(new RegExp(MOTIF_LIEN_HTTP).test(lien)).toBe(true);
    },
  );
});
