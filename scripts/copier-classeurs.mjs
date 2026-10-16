import { cpSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { CLASSEURS_DANS_DIST, FICHIER_SERVI } from './lib/classeurs-servis.mjs';
import { RACINE as root } from './lib/racine.mjs';

cpSync(
  join(root, 'src', CLASSEURS_DANS_DIST),
  join(root, 'dist', CLASSEURS_DANS_DIST),
  {
    recursive: true,
    filter: (source) =>
      statSync(source).isDirectory() || FICHIER_SERVI.test(source),
  },
);
