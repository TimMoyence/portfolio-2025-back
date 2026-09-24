import { fichiersDeMigration } from './lib/migrations-chargees.mjs';
import { prochainHorodatage } from './lib/prochain-horodatage.mjs';

const root = new URL('..', import.meta.url).pathname;

process.stdout.write(
  `${prochainHorodatage(fichiersDeMigration(root), Date.now())}\n`,
);
