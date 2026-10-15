import { readdirSync, readFileSync, statSync } from 'fs';
import { collectFiles } from '../../test/helpers/source-tree';
import { join } from 'path';
import {
  createSourceFile,
  forEachChild,
  isCallExpression,
  isExportDeclaration,
  isExternalModuleReference,
  isIdentifier,
  isImportDeclaration,
  isImportEqualsDeclaration,
  isImportTypeNode,
  isLiteralTypeNode,
  isStringLiteralLike,
  type Node,
  ScriptTarget,
  SyntaxKind,
} from 'typescript';

function moduleNomme(noeud: Node): Node | undefined {
  if (isImportDeclaration(noeud) || isExportDeclaration(noeud)) {
    return noeud.moduleSpecifier;
  }
  if (
    isImportEqualsDeclaration(noeud) &&
    isExternalModuleReference(noeud.moduleReference)
  ) {
    return noeud.moduleReference.expression;
  }
  if (isImportTypeNode(noeud) && isLiteralTypeNode(noeud.argument)) {
    return noeud.argument.literal;
  }
  const appelDeModule =
    isCallExpression(noeud) &&
    (noeud.expression.kind === SyntaxKind.ImportKeyword ||
      (isIdentifier(noeud.expression) && noeud.expression.text === 'require'));
  return appelDeModule ? noeud.arguments[0] : undefined;
}

function parseImports(content: string): string[] {
  const modules: string[] = [];
  const visiter = (noeud: Node): void => {
    const nomme = moduleNomme(noeud);
    if (nomme && isStringLiteralLike(nomme)) modules.push(nomme.text);
    forEachChild(noeud, visiter);
  };
  visiter(createSourceFile('source.ts', content, ScriptTarget.Latest, true));
  return modules;
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
    ['import a effet de bord', `import './polyfills';`, ['./polyfills']],
    [
      'import multiligne',
      `import {\n  Foo,\n  Bar,\n} from './foo';`,
      ['./foo'],
    ],
    [
      'import de type multiligne',
      `import type {\n  Foo,\n} from '../infrastructure/foo';`,
      ['../infrastructure/foo'],
    ],
    [
      'reexport nomme',
      `export { Foo } from '../infrastructure/foo';`,
      ['../infrastructure/foo'],
    ],
    ['reexport de tout', `export * from './bar';`, ['./bar']],
    ['import dynamique', `const m = await import('./baz');`, ['./baz']],
    [
      'import dynamique dans une methode de classe exportee',
      `export class A {\n  async charger() {\n    return import('../infrastructure/x');\n  }\n}`,
      ['../infrastructure/x'],
    ],
    [
      'import dynamique dans une fonction exportee',
      `export function charger() {\n  return import('./y');\n}`,
      ['./y'],
    ],
    [
      'import a effet de bord apres une classe exportee',
      `export class A {}\nimport '../infrastructure/x';`,
      ['../infrastructure/x'],
    ],
    [
      'reexport sous un espace de noms',
      `export * as rendu from '../infrastructure/x';`,
      ['../infrastructure/x'],
    ],
    [
      'import dynamique apres une regex contenant un accent grave',
      "const motif = /`/;\nconst m = import('../infrastructure/x');",
      ['../infrastructure/x'],
    ],
    [
      'import require',
      `import x = require('../infrastructure/x');`,
      ['../infrastructure/x'],
    ],
    [
      'require',
      `const { X } = require('../infrastructure/x') as { X: unknown };`,
      ['../infrastructure/x'],
    ],
    [
      'declarations sans module',
      `export const from = 'x';\nexport class A {}\nconst b = Array.from('cd');`,
      [],
    ],
  ];

  it.each(cases)('%s', (_label, source, expected) => {
    expect(parseImports(source)).toEqual(expected);
  });

  it('reste lineaire sur une ligne `import` sans clause `from`', () => {
    const courte = `import ${'a '.repeat(1_250)}`;
    const longue = `import ${'a '.repeat(20_000)}`;
    const modulesLus: string[] = [];
    const duree = (hostile: string, fois: number): number => {
      const startedAt = performance.now();
      for (let rang = 0; rang < fois; rang += 1) {
        modulesLus.push(...parseImports(hostile));
      }
      return performance.now() - startedAt;
    };
    const rapports = [0, 1, 2].map(
      () => duree(longue, 1) / Math.max(duree(courte, 16), 1),
    );

    rapports.sort((a, b) => a - b);

    expect(modulesLus).toEqual([]);
    expect(rapports[1]).toBeLessThan(2);
  });
});

describe('Règles de dépendances inter-couches', () => {
  const modulesRoot = join(process.cwd(), 'src/modules');

  const coucheCommune = (couche: string): string[] =>
    eligibleTsFiles(collectFiles(join(process.cwd(), 'src/common', couche)));

  const domainFiles = [
    ...collectLayerFiles(modulesRoot, 'domain'),
    ...coucheCommune('domain'),
  ];
  const applicationFiles = [
    ...collectLayerFiles(modulesRoot, 'application'),
    ...coucheCommune('application'),
  ];

  it('couvre la couche commune comme celle des modules', () => {
    expect(
      [domainFiles, applicationFiles].map((fichiers) =>
        fichiers.some((fichier) => fichier.includes('/src/common/')),
      ),
    ).toEqual([true, true]);
  });

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
      importViolations(domainFiles, (imp) =>
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
