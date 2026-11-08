import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { RACINE } from '../../../../test/helpers/depot/racine';

const EMPREINTE =
  'e3434e840dad92bfea0a7d1d30b42a0842134611214c7fc36b6d5d23bdfa38e5';

const MESSAGE =
  "Le JSON Schema d'ingestion a changé. Il est partagé avec morning-brief " +
  '(contracts/article-ingest-envelope-v1.schema.json) : modifier les deux copies ensemble, ' +
  'puis figer la nouvelle empreinte ici et dans tests/domain/test_schema_empreinte.py côté morning-brief.';

function canonique(valeur: unknown): string {
  if (Array.isArray(valeur)) {
    return `[${valeur.map(canonique).join(',')}]`;
  }
  if (valeur !== null && typeof valeur === 'object') {
    const objet = valeur as Record<string, unknown>;
    const champs = Object.keys(objet)
      .sort((a, b) => Number(a > b) - Number(a < b))
      .map((cle) => `${JSON.stringify(cle)}:${canonique(objet[cle])}`);
    return `{${champs.join(',')}}`;
  }
  return JSON.stringify(valeur);
}

function empreinte(document: unknown): string {
  return createHash('sha256').update(canonique(document), 'utf8').digest('hex');
}

const schema: unknown = JSON.parse(
  readFileSync(
    join(RACINE, 'docs/contracts/article-ingest-envelope-v1.json'),
    'utf8',
  ),
);

describe("Empreinte du JSON Schema d'ingestion partagé avec morning-brief", () => {
  it('reste celle figée des deux côtés du contrat', () => {
    expect({ empreinte: empreinte(schema), MESSAGE }).toEqual({
      empreinte: EMPREINTE,
      MESSAGE,
    });
  });

  it('ignore la mise en forme du fichier', () => {
    const reformate: unknown = JSON.parse(JSON.stringify(schema, null, 4));
    expect(empreinte(reformate)).toBe(EMPREINTE);
  });

  it('change dès que le contenu change', () => {
    const modifie = structuredClone(schema) as Record<string, unknown>;
    modifie.title = `${String(modifie.title)} modifié`;
    expect(empreinte(modifie)).not.toBe(EMPREINTE);
  });
});
