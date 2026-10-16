import { schemasDesModeles } from '../../../../../test/helpers/saisies-validees';
import type { SchemaOpenApi } from '../../../../../test/helpers/schema-openapi';
import { ToolkitPageResponseDto } from './toolkit-page.response.dto';

const REFERENCE = {
  $ref: expect.stringMatching(/^#\/components\/schemas\/\w+Dto$/),
};

describe('ToolkitPageResponseDto', () => {
  let proprietes: Record<string, SchemaOpenApi> | undefined;

  beforeAll(async () => {
    proprietes = (await schemasDesModeles([ToolkitPageResponseDto])).get(
      ToolkitPageResponseDto,
    )?.ToolkitPageResponseDto?.properties;
  });

  it.each(['cheatsheet', 'prompts', 'workflows', 'templates'])(
    'documente %s comme un tableau d objets decrits dans le schema OpenAPI',
    (propriete) => {
      expect(proprietes?.[propriete]).toEqual({
        type: 'array',
        items: REFERENCE,
      });
    },
  );

  it('documente recap comme un objet decrit dans le schema OpenAPI', () => {
    expect(proprietes?.recap).toEqual(REFERENCE);
  });
});
