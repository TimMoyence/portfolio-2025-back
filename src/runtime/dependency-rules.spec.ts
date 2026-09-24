import { readdirSync, readFileSync, statSync } from 'fs';
import { collectFiles } from '../../test/helpers/source-tree';
import { join } from 'path';

function parseImports(content: string): string[] {
  const importPattern = /\bimport\b[^'"\n]*\bfrom\s*['"]([^'"]+)['"]/g;
  return [...content.matchAll(importPattern)].map((match) => match[1]);
}

function extractImports(filePath: string): string[] {
  return parseImports(readFileSync(filePath, 'utf8'));
}

function eligibleTsFiles(files: string[]): string[] {
  return files.filter(
    (f) =>
      f.endsWith('.ts') && !f.endsWith('.spec.ts') && !f.endsWith('.module.ts'),
  );
}

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

function importViolations(
  files: string[],
  isForbidden: (importSpecifier: string) => boolean,
): string[] {
  const violations: string[] = [];

  for (const file of files) {
    const forbidden = extractImports(file).filter(isForbidden);
    if (forbidden.length > 0) {
      violations.push(`${file} importe : ${forbidden.join(', ')}`);
    }
  }

  return violations;
}

describe('parseImports', () => {
  const cases: ReadonlyArray<[string, string, string[]]> = [
    ['import par defaut', `import Foo from './foo';`, ['./foo']],
    ['import nomme', `import { Foo, Bar } from '../bar';`, ['../bar']],
    ['import namespace', `import * as fs from 'fs';`, ['fs']],
    ['import de type', `import type { Foo } from './foo';`, ['./foo']],
    [
      'guillemets doubles',
      `import Foo from "@nestjs/common";`,
      ['@nestjs/common'],
    ],
    [
      'deux imports sur la meme ligne',
      `import a from 'x'; import b from 'y';`,
      ['x', 'y'],
    ],
    [
      'imports sur des lignes successives',
      `import a from 'x';\nimport b from 'y';`,
      ['x', 'y'],
    ],
    ['import a effet de bord, non couvert', `import './polyfills';`, []],
    ['import multiligne, non couvert', `import {\n  Foo,\n} from './foo';`, []],
  ];

  it.each(cases)('%s', (_label, source, expected) => {
    expect(parseImports(source)).toEqual(expected);
  });

  it('reste lineaire sur une ligne `import` sans clause `from`', () => {
    const hostile = `import ${'a '.repeat(20_000)}`;
    const startedAt = Date.now();

    expect(parseImports(hostile)).toEqual([]);
    expect(Date.now() - startedAt).toBeLessThan(1000);
  });
});

describe('Règles de dépendances inter-couches', () => {
  const modulesRoot = join(process.cwd(), 'src/modules');

  const domainFiles = collectLayerFiles(modulesRoot, 'domain');
  const applicationFiles = collectLayerFiles(modulesRoot, 'application');

  const commonDomainFiles = eligibleTsFiles(
    collectFiles(join(process.cwd(), 'src/common/domain')),
  );

  it('les fichiers domain/ ne doivent pas importer depuis infrastructure/', () => {
    expect(
      importViolations(domainFiles, (imp) => imp.includes('infrastructure/')),
    ).toEqual([]);
  });

  it('les fichiers domain/ ne doivent pas importer depuis interfaces/', () => {
    expect(
      importViolations(domainFiles, (imp) => imp.includes('interfaces/')),
    ).toEqual([]);
  });

  it('les fichiers domain/ ne doivent pas importer de dépendances framework/infrastructure', () => {
    const forbiddenPackages = [
      '@nestjs',
      'typeorm',
      'bullmq',
      'argon2',
      'jose',
      'prom-client',
      'nestjs-pino',
      'pino',
      'nodemailer',
      '@anthropic-ai',
      '@langchain',
      'ioredis',
      'axios',
      'openai',
      'pdfkit',
      'puppeteer',
      'cheerio',
      'pg',
      'google-auth-library',
    ];
    expect(
      importViolations([...domainFiles, ...commonDomainFiles], (imp) =>
        forbiddenPackages.some(
          (pkg) => imp === pkg || imp.startsWith(`${pkg}/`),
        ),
      ),
    ).toEqual([]);
  });

  it('les fichiers application/ ne doivent pas importer depuis infrastructure/', () => {
    expect(
      importViolations(applicationFiles, (imp) =>
        imp.includes('infrastructure/'),
      ),
    ).toEqual([]);
  });

  const CROSS_MODULE_IMPORT_WHITELIST: ReadonlyArray<string> = [
    'modules/users/',
  ];

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
        if (allowed) continue;
        violations.push(`${file} importe : ${imp} (${target})`);
      }
    }

    expect(violations).toEqual([]);
  });
});
