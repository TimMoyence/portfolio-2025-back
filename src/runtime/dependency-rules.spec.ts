import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

/**
 * Collecte récursivement tous les fichiers d'un répertoire.
 * Utilisé pour scanner les couches DDD et vérifier les règles de dépendances.
 */
function collectFiles(root: string): string[] {
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

/**
 * Extrait les chemins d'import d'un fichier TypeScript.
 * Retourne un tableau de chaînes correspondant aux valeurs `from '...'` ou `from "..."`.
 */
function extractImports(filePath: string): string[] {
  const content = readFileSync(filePath, 'utf8');
  const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
  const imports: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }

  return imports;
}

/**
 * Filtre les fichiers TypeScript éligibles au scan (exclut .spec.ts et .module.ts).
 */
function eligibleTsFiles(files: string[]): string[] {
  return files.filter(
    (f) =>
      f.endsWith('.ts') && !f.endsWith('.spec.ts') && !f.endsWith('.module.ts'),
  );
}

/**
 * Collecte tous les fichiers TypeScript d'une couche DDD donnée dans tous les modules.
 */
function collectLayerFiles(modulesRoot: string, layer: string): string[] {
  const modules = readdirSync(modulesRoot);
  const allFiles: string[] = [];

  for (const mod of modules) {
    const layerDir = join(modulesRoot, mod, layer);
    try {
      statSync(layerDir);
    } catch {
      continue;
    }
    allFiles.push(...collectFiles(layerDir));
  }

  return eligibleTsFiles(allFiles);
}

describe('Règles de dépendances inter-couches', () => {
  const modulesRoot = join(process.cwd(), 'src/modules');

  const domainFiles = collectLayerFiles(modulesRoot, 'domain');
  const applicationFiles = collectLayerFiles(modulesRoot, 'application');

  it('les fichiers domain/ ne doivent pas importer depuis infrastructure/', () => {
    const violations: string[] = [];

    for (const file of domainFiles) {
      const imports = extractImports(file);
      const forbidden = imports.filter((imp) =>
        imp.includes('infrastructure/'),
      );
      if (forbidden.length > 0) {
        violations.push(`${file} importe : ${forbidden.join(', ')}`);
      }
    }

    expect(violations).toEqual([]);
  });

  it('les fichiers domain/ ne doivent pas importer depuis interfaces/', () => {
    const violations: string[] = [];

    for (const file of domainFiles) {
      const imports = extractImports(file);
      const forbidden = imports.filter((imp) => imp.includes('interfaces/'));
      if (forbidden.length > 0) {
        violations.push(`${file} importe : ${forbidden.join(', ')}`);
      }
    }

    expect(violations).toEqual([]);
  });

  it('les fichiers domain/ ne doivent pas importer de dépendances framework (@nestjs, typeorm, bullmq)', () => {
    const forbiddenPackages = ['@nestjs', 'typeorm', 'bullmq'];
    const violations: string[] = [];

    for (const file of domainFiles) {
      const imports = extractImports(file);
      const forbidden = imports.filter((imp) =>
        forbiddenPackages.some(
          (pkg) => imp === pkg || imp.startsWith(`${pkg}/`),
        ),
      );
      if (forbidden.length > 0) {
        violations.push(`${file} importe : ${forbidden.join(', ')}`);
      }
    }

    expect(violations).toEqual([]);
  });

  it('les fichiers application/ ne doivent pas importer depuis infrastructure/', () => {
    const violations: string[] = [];

    for (const file of applicationFiles) {
      const imports = extractImports(file);
      const forbidden = imports.filter((imp) =>
        imp.includes('infrastructure/'),
      );
      if (forbidden.length > 0) {
        violations.push(`${file} importe : ${forbidden.join(', ')}`);
      }
    }

    expect(violations).toEqual([]);
  });
});
