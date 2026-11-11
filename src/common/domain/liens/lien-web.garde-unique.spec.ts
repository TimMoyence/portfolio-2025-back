import { readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { RACINE } from '../../../../test/helpers/depot/racine';
import { collectFiles } from '../../../../test/helpers/depot/source-tree';

const PROPRIETAIRE = 'src/common/domain/liens/lien-web.ts';

describe('Un lien web ne se valide qu à un seul endroit : lien-web.ts', () => {
  it('aucun schéma de production ne valide un lien par z.url() hors de lien-web.ts', () => {
    const fautifs = collectFiles(join(RACINE, 'src'))
      .filter(
        (fichier) => fichier.endsWith('.ts') && !fichier.endsWith('.spec.ts'),
      )
      .map((fichier) => relative(RACINE, fichier))
      .filter((fichier) => fichier !== PROPRIETAIRE)
      .flatMap((fichier) =>
        readFileSync(join(RACINE, fichier), 'utf8')
          .split('\n')
          .map((ligne, rang) => [fichier, rang + 1, ligne] as const)
          .filter(([, , ligne]) => /\bz\.url\(/.test(ligne))
          .map(([f, n]) => `${f}:${n}`),
      );
    expect(fautifs).toEqual([]);
  });
});
