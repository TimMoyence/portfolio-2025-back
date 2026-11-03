import { readFileSync } from 'fs';
import { dirname, join, relative, resolve } from 'path';
import { RACINE } from '../../../../../test/helpers/depot/racine';

const AUTOMATION = join(
  RACINE,
  'src/modules/audit-requests/infrastructure/automation',
);
const HOMEPAGE = 'collecte/page/homepage-analyzer.service.ts';
const INDEXABILITE = 'collecte/ia/url-indexability.service.ts';
const ANALYSE_PROFONDE = 'collecte/page/deep-url-analysis.service.ts';
const RECAP = 'collecte/page/page-ai-recap.service.ts';
const RAPPORT = 'redaction/rapport/langchain-audit-report.service.ts';
const PORTE_QUALITE = 'redaction/rapport/report-quality-gate.service.ts';
const PIPELINE = 'pipeline/audit-pipeline.service.ts';

const read = (fichier: string): string =>
  readFileSync(join(AUTOMATION, fichier), 'utf8');

const modulesImportes = (fichier: string): string[] =>
  [...read(fichier).matchAll(/from '(\.{1,2}\/[^']+)'/g)].map(([, module]) =>
    relative(AUTOMATION, resolve(dirname(join(AUTOMATION, fichier)), module)),
  );

describe('Automation folder guardrails', () => {
  it('keeps HTML signals extraction centralized in shared util', () => {
    for (const fichier of [HOMEPAGE, INDEXABILITE]) {
      const content = read(fichier);
      expect(content).not.toContain('private detectCmsHints(');
      expect(content).not.toContain('private extractInternalLinks(');
      expect(content).not.toContain('private pickHeaders(');
      expect(content).not.toContain('private extractSetCookiePatterns(');
      expect(modulesImportes(fichier)).toContain(
        'shared/page/html-signals.util',
      );
    }
  });

  it('keeps locale and timeout helpers centralized in shared utils', () => {
    for (const fichier of [RAPPORT, RECAP, PORTE_QUALITE, ANALYSE_PROFONDE]) {
      const content = read(fichier);
      expect(content).not.toContain('private text(');
      expect(content).not.toContain('private message(');
    }

    for (const fichier of [RAPPORT, RECAP]) {
      expect(modulesImportes(fichier)).toEqual(
        expect.arrayContaining([
          'shared/texte/error.util',
          'shared/texte/locale-text.util',
        ]),
      );
    }
  });

  it('keeps critical automation services under maintainable size budgets', () => {
    const budgets = [
      { fichier: RAPPORT, maxLines: 1900 },
      { fichier: ANALYSE_PROFONDE, maxLines: 1200 },
      { fichier: PORTE_QUALITE, maxLines: 1050 },
      { fichier: PIPELINE, maxLines: 900 },
    ];

    for (const budget of budgets) {
      const lines = read(budget.fichier).split('\n').length;
      expect(lines).toBeLessThanOrEqual(budget.maxLines);
    }
  });
});
