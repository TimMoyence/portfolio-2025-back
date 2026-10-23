import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { CODES_D_ERREUR } from './codes-d-erreur';

const CODES_PORTES = new Set(
  [
    ...readFileSync(join(__dirname, 'FormationErrors.ts'), 'utf8').matchAll(
      /readonly code(?:: CodeDErreur)? = '([A-Z_]+)'/gu,
    ),
  ].map(([, code]) => code),
);

describe('codes d erreur publiés', () => {
  it('publie chaque code porté par une erreur de formation, et aucun autre', () => {
    expect(new Set(CODES_D_ERREUR)).toEqual(CODES_PORTES);
  });

  it('type chaque code porté par la liste publiée', () => {
    expect(
      readFileSync(join(__dirname, 'FormationErrors.ts'), 'utf8').match(
        /readonly code = '/gu,
      ),
    ).toBeNull();
  });
});
