import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { RACINE } from './racine';

const schemaPartage: object = JSON.parse(
  readFileSync(
    join(RACINE, 'docs/contracts/article-ingest-envelope-v1.json'),
    'utf8',
  ),
);

export function accepteeParLeSchemaPartage(enveloppe: unknown): boolean {
  const ajv = new Ajv2020({ allErrors: true });
  addFormats(ajv);
  return ajv.compile(schemaPartage)(enveloppe);
}
