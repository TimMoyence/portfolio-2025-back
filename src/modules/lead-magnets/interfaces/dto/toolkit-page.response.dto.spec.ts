import { DECORATORS } from '@nestjs/swagger/dist/constants';
import { ToolkitPageResponseDto } from './toolkit-page.response.dto';

const typeDocumente = (propriete: string): unknown =>
  (
    Reflect.getMetadata(
      DECORATORS.API_MODEL_PROPERTIES,
      ToolkitPageResponseDto.prototype,
      propriete,
    ) as { type?: unknown } | undefined
  )?.type;

describe('ToolkitPageResponseDto', () => {
  it.each(['cheatsheet', 'prompts', 'workflows', 'templates'])(
    'documente %s comme un tableau dans le schema OpenAPI',
    (propriete) => {
      expect(typeDocumente(propriete)).toBe(Array);
    },
  );

  it('documente recap comme un objet dans le schema OpenAPI', () => {
    expect(typeDocumente('recap')).toBe(Object);
  });
});
