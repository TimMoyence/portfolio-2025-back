import { fileURLToPath } from 'node:url';

export const RACINE = fileURLToPath(new URL('../..', import.meta.url));
