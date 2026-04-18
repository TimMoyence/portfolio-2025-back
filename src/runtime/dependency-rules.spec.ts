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

  /**
   * Whitelist des modules auxquels un module metier peut accéder directement
   * via `../../../users/...`. Users est whitelisté car il porte la notion
   * transverse d'identité + rôles (ex : Budget et Sebastian scopent leurs
   * données par `userId` et s'appuient sur le role-guard Users).
   *
   * Extension ultérieure : étendre la whitelist si un nouveau module
   * transverse émerge (ex : Audit, Notifications), sinon rester strict
   * pour éviter le couplage implicite entre modules métiers.
   */
  const CROSS_MODULE_IMPORT_WHITELIST: ReadonlyArray<string> = [
    'modules/users/',
  ];

  /**
   * Resout les imports relatifs (`../../../users/...`) vers leur chemin
   * `modules/X/...` canonique pour les comparer à la whitelist.
   */
  function isCrossModuleImport(
    importSpecifier: string,
    filePath: string,
  ): string | null {
    if (
      !importSpecifier.startsWith('../') &&
      !importSpecifier.startsWith('./')
    ) {
      return null;
    }
    const absoluteImport = join(join(filePath, '..'), importSpecifier);
    const modulesIndex = absoluteImport.indexOf('/modules/');
    if (modulesIndex < 0) return null;
    const afterModules = absoluteImport.slice(
      modulesIndex + '/modules/'.length,
    );
    const [targetModule] = afterModules.split('/');
    const sourceModule = filePath
      .slice(filePath.indexOf('/modules/') + '/modules/'.length)
      .split('/')[0];
    if (!targetModule || !sourceModule) return null;
    if (targetModule === sourceModule) return null;
    return `modules/${targetModule}/`;
  }

  it("les modules metiers ne doivent pas importer depuis d'autres modules metiers (hors whitelist Users)", () => {
    const allModuleFiles = eligibleTsFiles(collectFiles(modulesRoot));
    const violations: string[] = [];

    for (const file of allModuleFiles) {
      const imports = extractImports(file);
      for (const imp of imports) {
        const target = isCrossModuleImport(imp, file);
        if (!target) continue;
        const allowed = CROSS_MODULE_IMPORT_WHITELIST.some((prefix) =>
          target.startsWith(prefix),
        );
        if (!allowed) {
          violations.push(`${file} importe : ${imp} (${target})`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
