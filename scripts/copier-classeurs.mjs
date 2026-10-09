import { cpSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const CLASSEURS = 'modules/formations/infrastructure/classeurs';
const FICHIER_SERVI = /\.(xlsx|csv|pdf)$/;

cpSync(join(root, 'src', CLASSEURS), join(root, 'dist', CLASSEURS), {
  recursive: true,
  filter: (source) =>
    statSync(source).isDirectory() || FICHIER_SERVI.test(source),
});
