import { PublishedArticleResponseDto } from '../../../src/modules/articles/interfaces/dto/article.response.dto';
import { schemasDesModeles } from './saisies-validees';
import type { SchemaOpenApi } from './schema-openapi';

export function schemasDeLArticleServi(): () => Record<string, SchemaOpenApi> {
  let schemas: Record<string, SchemaOpenApi> = {};
  beforeAll(async () => {
    schemas =
      (await schemasDesModeles([PublishedArticleResponseDto])).get(
        PublishedArticleResponseDto,
      ) ?? {};
  });
  return () => schemas;
}
