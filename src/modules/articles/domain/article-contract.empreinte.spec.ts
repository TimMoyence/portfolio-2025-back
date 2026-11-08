import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { empreinteSha256 } from '../../../common/domain/crypto/empreintes';
import { RACINE } from '../../../../test/helpers/depot/racine';

const EMPREINTE =
  'e3434e840dad92bfea0a7d1d30b42a0842134611214c7fc36b6d5d23bdfa38e5';

const SCHEMA = join(RACINE, 'docs/contracts/article-ingest-envelope-v1.json');

const PARTAGE =
  'Il est partagé avec morning-brief (contracts/article-ingest-envelope-v1.schema.json) : ' +
  'modifier les deux copies ensemble, puis figer la nouvelle empreinte ici et dans ' +
  'tests/domain/test_schema_empreinte.py côté morning-brief.';

const MESSAGE = `Le JSON Schema d'ingestion a changé. ${PARTAGE}`;

const VECTEUR =
  '{"b":[2,1],"a":{"d":1,"c":2.0},"z":-0.0,"k":1e2,' +
  '"r":1.0000000000000001,"u":1e-400,"l":[true,false,null],"！":"é","😀":"\\t"}';

const VECTEUR_CANONIQUE =
  '{"a":{"c":2,"d":1},"b":[2,1],"k":100,' +
  '"l":[true,false,null],"r":1,"u":0,"z":0,"😀":"\\t","！":"é"}';

function texte(valeur: string): string {
  if (/\p{Cs}/u.test(valeur)) {
    throw new Error(
      `Texte mal formé, surrogat isolé : ${JSON.stringify(valeur)}`,
    );
  }
  return JSON.stringify(valeur);
}

function nombre(valeur: number): string {
  if (!Number.isSafeInteger(valeur)) {
    throw new Error(
      `Nombre hors de la forme canonique, entier sûr attendu : ${String(valeur)}`,
    );
  }
  return JSON.stringify(valeur);
}

function canonique(valeur: unknown): string {
  if (Array.isArray(valeur)) {
    return `[${valeur.map(canonique).join(',')}]`;
  }
  if (typeof valeur === 'string') {
    return texte(valeur);
  }
  if (typeof valeur === 'number') {
    return nombre(valeur);
  }
  if (valeur !== null && typeof valeur === 'object') {
    const objet = valeur as Record<string, unknown>;
    const champs = Object.keys(objet)
      .sort((a, b) => Number(a > b) - Number(a < b))
      .map((cle) => `${texte(cle)}:${canonique(objet[cle])}`);
    return `{${champs.join(',')}}`;
  }
  return JSON.stringify(valeur);
}

const BOM = String.fromCharCode(0xfe_ff);

function analyser(brut: string): unknown {
  return JSON.parse(brut.startsWith(BOM) ? brut.slice(BOM.length) : brut);
}

function empreinte(document: unknown): string {
  return empreinteSha256(canonique(document));
}

function lireLeSchema(octets: Uint8Array = readFileSync(SCHEMA)): unknown {
  return analyser(
    new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(octets),
  );
}

function empreinteDuSchema(): string {
  try {
    return empreinte(lireLeSchema());
  } catch (erreur) {
    throw new Error(
      `JSON Schema d'ingestion illisible ou hors de la forme canonique (${SCHEMA}). ${PARTAGE}`,
      { cause: erreur },
    );
  }
}

function clesInversees(valeur: unknown): unknown {
  if (Array.isArray(valeur)) {
    return valeur.map(clesInversees);
  }
  if (valeur !== null && typeof valeur === 'object') {
    return Object.fromEntries(
      Object.entries(valeur)
        .reverse()
        .map(([cle, enfant]) => [cle, clesInversees(enfant)]),
    );
  }
  return valeur;
}

describe("Empreinte du JSON Schema d'ingestion partagé avec morning-brief", () => {
  it('reste celle figée des deux côtés du contrat', () => {
    expect({ empreinte: empreinteDuSchema(), MESSAGE }).toEqual({
      empreinte: EMPREINTE,
      MESSAGE,
    });
  });

  it('suit la forme canonique figée à l’identique côté morning-brief', () => {
    expect(canonique(analyser(VECTEUR))).toBe(VECTEUR_CANONIQUE);
  });

  it('ignore la mise en forme du fichier', () => {
    const original = lireLeSchema();
    const reecrit = JSON.stringify(clesInversees(original), null, '\t');
    const variante = `${BOM}${reecrit.replaceAll('\n', '\r\n')}\r\n`;
    expect(JSON.stringify(analyser(variante))).not.toBe(
      JSON.stringify(original),
    );
    expect(empreinte(analyser(variante))).toBe(empreinte(original));
  });

  it('change dès que le contenu change', () => {
    const original = lireLeSchema() as Record<string, unknown>;
    const modifie = { ...original, title: `${String(original.title)} modifié` };
    expect(empreinte(modifie)).not.toBe(empreinte(original));
  });

  it('refuse un fichier qui n’est pas en UTF-8', () => {
    const latin1 = Buffer.from('{"title":"résumé"}', 'latin1');
    expect(() => lireLeSchema(latin1)).toThrow(/not valid for encoding utf-8/);
  });

  it.each<[string, string, RegExp | SyntaxErrorConstructor]>([
    ['un nombre non entier', '{"a":0.5}', /entier sûr attendu/],
    [
      'un entier hors de la plage sûre',
      '{"a":9007199254740992}',
      /entier sûr attendu/,
    ],
    ['un exposant géant', '{"a":1e999999999999}', /entier sûr attendu/],
    ['NaN, dès la lecture', '{"a":NaN}', SyntaxError],
    ['un surrogat isolé en valeur', '{"a":"\\ud800"}', /surrogat isolé/],
    ['un surrogat isolé en clé', '{"\\udc00":1}', /surrogat isolé/],
  ])(
    'refuse %s, que morning-brief écrirait autrement',
    (_cas, brut, attendu) => {
      expect(() => canonique(analyser(brut))).toThrow(attendu);
    },
  );
});
