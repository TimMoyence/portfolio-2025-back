import { readFileSync } from 'fs';
import { join } from 'path';

describe('Automation folder guardrails', () => {
  const automationRoot = join(
    process.cwd(),
    'src/modules/audit-requests/infrastructure/automation',
  );

  const read = (relativePath: string): string =>
    readFileSync(join(automationRoot, relativePath), 'utf8');

  it('keeps HTML signals extraction centralized in shared util', () => {
    const homepage = read('homepage-analyzer.service.ts');
    const indexability = read('url-indexability.service.ts');

    for (const content of [homepage, indexability]) {
      expect(content).not.toContain('private detectCmsHints(');
      expect(content).not.toContain('private extractInternalLinks(');
      expect(content).not.toContain('private pickHeaders(');
      expect(content).not.toContain('private extractSetCookiePatterns(');
      expect(content).toContain("from './shared/html-signals.util'");
    }
  });

  it('keeps locale and timeout helpers centralized in shared utils', () => {
    const files = [
      'langchain-audit-report.service.ts',
      'page-ai-recap.service.ts',
      'report-quality-gate.service.ts',
      'deep-url-analysis.service.ts',
    ];

    for (const file of files) {
      const content = read(file);
      expect(content).not.toContain('private text(');
      expect(content).not.toContain('private message(');
    }

    const langchain = read('langchain-audit-report.service.ts');
    const recap = read('page-ai-recap.service.ts');
    expect(langchain).toContain("from './shared/error.util'");
    expect(langchain).toContain("from './shared/locale-text.util'");
    expect(recap).toContain("from './shared/error.util'");
    expect(recap).toContain("from './shared/locale-text.util'");
  });

  it('keeps critical automation services under maintainable size budgets', () => {
    const budgets = [
      { file: 'langchain-audit-report.service.ts', maxLines: 1700 },
      { file: 'deep-url-analysis.service.ts', maxLines: 1200 },
      { file: 'report-quality-gate.service.ts', maxLines: 850 },
      { file: 'audit-pipeline.service.ts', maxLines: 780 },
    ];

    for (const budget of budgets) {
      const lines = read(budget.file).split('\n').length;
      expect(lines).toBeLessThanOrEqual(budget.maxLines);
    }
  });
});
