import { fichiersDeMigration } from './lib/migrations-chargees.mjs';
import { prochainHorodatage } from './lib/prochain-horodatage.mjs';
import { RACINE as root } from './lib/racine.mjs';

process.stdout.write(
  `${prochainHorodatage(fichiersDeMigration(root), Date.now())}\n`,
);
