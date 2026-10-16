import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import {
  createSourceFile,
  forEachChild,
  isRegularExpressionLiteral,
  isStringLiteralLike,
  isTemplateHead,
  isTemplateMiddle,
  isTemplateTail,
  type Node,
  ScriptTarget,
} from 'typescript';

export function collectFiles(root: string): string[] {
  const output: string[] = [];

  let entries: string[];
  try {
    entries = readdirSync(root);
  } catch {
    return output;
  }

  for (const entry of entries) {
    const absolute = join(root, entry);
    const stats = statSync(absolute);

    if (stats.isDirectory()) {
      output.push(...collectFiles(absolute));
      continue;
    }

    output.push(absolute);
  }

  return output;
}

export function sourcesHorsProprietaire(
  racine: string,
  proprietaire: string,
): string[] {
  return collectFiles(racine).filter(
    (fichier) =>
      fichier.endsWith('.ts') &&
      !fichier.endsWith('.spec.ts') &&
      fichier !== proprietaire,
  );
}

export function sourcesQuiEcrivent(
  racine: string,
  sources: readonly string[],
  motif: RegExp,
): string[] {
  return sources
    .filter((fichier) => motif.test(readFileSync(fichier, 'utf8')))
    .map((fichier) => fichier.slice(racine.length + 1));
}

const arbreDe = (fichier: string) =>
  createSourceFile(
    fichier,
    readFileSync(fichier, 'utf8'),
    ScriptTarget.Latest,
    true,
  );

export function litterauxDe(fichier: string): string[] {
  const textes: string[] = [];
  const visiter = (noeud: Node): void => {
    if (
      isStringLiteralLike(noeud) ||
      isTemplateHead(noeud) ||
      isTemplateMiddle(noeud) ||
      isTemplateTail(noeud) ||
      isRegularExpressionLiteral(noeud)
    ) {
      textes.push(noeud.text);
    }
    forEachChild(noeud, visiter);
  };
  visiter(arbreDe(fichier));
  return textes;
}
