import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { ArticleContract } from '../../../src/modules/articles/domain/contrat/article-contract';
import { RACINE } from './racine';

const schemaPartage: object = JSON.parse(
  readFileSync(
    join(RACINE, 'docs/contracts/article-ingest-envelope-v2.json'),
    'utf8',
  ),
);

export function accepteeParLeSchemaPartage(enveloppe: unknown): boolean {
  const ajv = new Ajv2020({ allErrors: true });
  addFormats(ajv);
  return ajv.compile(schemaPartage)(enveloppe);
}

export function recitDuMatin<T>(
  modifier: (enveloppe: T) => void = () => undefined,
): T {
  const enveloppe = JSON.parse(
    readFileSync(
      join(RACINE, 'test/fixtures/articles/enveloppe-recit-du-matin.json'),
      'utf8',
    ),
  ) as T;
  modifier(enveloppe);
  return enveloppe;
}

export function verdicts(enveloppe: unknown): {
  schemaPartage: boolean;
  ingestion: boolean;
} {
  return {
    schemaPartage: accepteeParLeSchemaPartage(enveloppe),
    ingestion: ArticleContract.safeParse(enveloppe).success,
  };
}

export const REFUSEE_DES_DEUX_COTES = {
  schemaPartage: false,
  ingestion: false,
};
export const ACCEPTEE_DES_DEUX_COTES = { schemaPartage: true, ingestion: true };

export function refuseeCommeParLeSchemaPartage<T>(
  cas: [string, (enveloppe: T) => void][],
): void {
  it.each(cas)(
    'MB-24 · refuse %s, comme le schéma partagé',
    (_cas, modifier) => {
      expect(verdicts(recitDuMatin(modifier))).toEqual(REFUSEE_DES_DEUX_COTES);
    },
  );
}
