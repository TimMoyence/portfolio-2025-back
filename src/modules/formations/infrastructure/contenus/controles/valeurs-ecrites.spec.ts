import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { z } from 'zod';
import { RACINE } from '../../../../../../test/helpers/depot/racine';
import { lireLInstantane } from '../../../../../../test/helpers/formations/cours/instantane-de-cours';
import { coursStocke } from '../../../domain/cours/stockage/CoursStocke';
import { presentationVisuelle } from '../../../domain/cours/structure/VisualPresentation';
import { CONTENUS } from '../index';

const FORMATIONS = join(RACINE, 'src/modules/formations');
const DEFINITIONS_DU_CONTRAT = [
  'domain/contrats',
  'domain/cours/banque',
  'domain/cours/stockage',
  'domain/cours/structure/VisualPresentation.ts',
];
const CLE = '(clé)';
const TOUT_CHAMP = '(tout champ)';
const CHAMP_ECRIT = /(?<!\w)(\w+)\??: '([^'\n]+)'/g;
const ECRITURES_DU_MOTEUR = [
  /^ *[?:] '([^'\n]+)'/gm,
  /\? '([^'\n]+)' :/g,
  /return '([^'\n]+)'/g,
  /(?<![=!<>])= '([^'\n]+)'/g,
];

const paire = (champ: string, valeur: string): string => `${champ} = ${valeur}`;
const parOrdreAlphabetique = (a: string, b: string): number =>
  a.localeCompare(b);

interface EnumerationPubliee {
  readonly champ: string;
  readonly valeurs: readonly string[];
}

const enumerationsPubliees = (
  schema: z.ZodType,
): readonly EnumerationPubliee[] => {
  const enumerations: EnumerationPubliee[] = [];
  const visiter = (noeud: unknown, champ: string): void => {
    if (Array.isArray(noeud)) {
      noeud.forEach((enfant) => visiter(enfant, champ));
      return;
    }
    if (noeud === null || typeof noeud !== 'object') return;
    const n = noeud as Record<string, unknown>;
    if (Array.isArray(n.enum)) {
      enumerations.push({
        champ,
        valeurs: n.enum.filter((v): v is string => typeof v === 'string'),
      });
    }
    if (typeof n.const === 'string') {
      enumerations.push({ champ, valeurs: [n.const] });
    }
    for (const [cle, enfant] of Object.entries(n)) {
      if (
        cle === 'properties' &&
        enfant !== null &&
        typeof enfant === 'object'
      ) {
        for (const [nom, sous] of Object.entries(enfant)) visiter(sous, nom);
      } else if (cle === 'propertyNames') {
        visiter(enfant, CLE);
      } else {
        visiter(enfant, champ);
      }
    }
  };
  visiter(z.toJSONSchema(schema, { unrepresentable: 'any', io: 'input' }), '');
  return enumerations;
};

const nonEcrites = (
  enumerations: readonly EnumerationPubliee[],
  ecrites: ReadonlySet<string>,
): readonly string[] => {
  const champsParEnumeration = new Map<string, Set<string>>();
  for (const { champ, valeurs } of enumerations) {
    const cle = JSON.stringify([...valeurs].sort(parOrdreAlphabetique));
    champsParEnumeration.set(
      cle,
      (champsParEnumeration.get(cle) ?? new Set()).add(champ),
    );
  }
  return [...champsParEnumeration].flatMap(([cle, champs]) =>
    (JSON.parse(cle) as string[])
      .filter(
        (valeur) =>
          !ecrites.has(paire(TOUT_CHAMP, valeur)) &&
          ![...champs].some((c) => ecrites.has(paire(c, valeur))),
      )
      .map(
        (valeur) =>
          `${valeur} (${[...champs].sort(parOrdreAlphabetique).join(', ')})`,
      ),
  );
};

const paresEcrites = (donnee: unknown): readonly string[] => {
  const paires: string[] = [];
  const visiter = (valeur: unknown, champ: string): void => {
    if (typeof valeur === 'string') {
      paires.push(paire(champ, valeur));
    } else if (Array.isArray(valeur)) {
      valeur.forEach((element) => visiter(element, champ));
    } else if (valeur !== null && typeof valeur === 'object') {
      for (const [cle, enfant] of Object.entries(valeur)) {
        paires.push(paire(CLE, cle));
        visiter(enfant, cle);
      }
    }
  };
  visiter(donnee, '');
  return paires;
};

const sourcesDuMoteur = (dossier: string): readonly string[] =>
  readdirSync(dossier, { withFileTypes: true }).flatMap((entree) => {
    const chemin = join(dossier, entree.name);
    if (
      DEFINITIONS_DU_CONTRAT.some((d) =>
        relative(FORMATIONS, chemin).startsWith(d),
      )
    ) {
      return [];
    }
    if (entree.isDirectory()) return sourcesDuMoteur(chemin);
    return entree.name.endsWith('.ts') && !entree.name.endsWith('.spec.ts')
      ? [readFileSync(chemin, 'utf8')]
      : [];
  });

const paresDuMoteur = (source: string): readonly string[] => [
  ...[...source.matchAll(CHAMP_ECRIT)].map(([, champ, valeur]) =>
    paire(champ, valeur),
  ),
  ...ECRITURES_DU_MOTEUR.flatMap((motif) =>
    [...source.matchAll(motif)].map(([, valeur]) => paire(TOUT_CHAMP, valeur)),
  ),
];

describe('Valeurs du contrat des cours', () => {
  it('ECR-01 chaque valeur qu’un cours peut écrire est écrite, sous son champ, par un cours servi, son instantané ou le moteur', () => {
    const ecrites = new Set([
      ...CONTENUS.flatMap(paresEcrites),
      ...CONTENUS.flatMap((contenu) => paresEcrites(lireLInstantane(contenu))),
      ...sourcesDuMoteur(FORMATIONS).flatMap(paresDuMoteur),
    ]);
    const publiees = [coursStocke, presentationVisuelle].flatMap((schema) =>
      enumerationsPubliees(schema),
    );

    expect(
      [...nonEcrites(publiees, ecrites)].sort(parOrdreAlphabetique),
    ).toEqual([]);
    expect(
      publiees.some(
        ({ champ, valeurs }) =>
          champ === 'renderer' && valeurs.includes('page'),
      ),
    ).toBe(true);
  });
});
