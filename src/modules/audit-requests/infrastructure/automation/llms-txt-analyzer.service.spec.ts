import { LlmsTxtAnalyzerService } from './llms-txt-analyzer.service';
import type { SafeFetchResult, SafeFetchService } from './safe-fetch.service';

describe('LlmsTxtAnalyzerService', () => {
  const buildResult = (
    url: string,
    status: number,
    body: string,
  ): SafeFetchResult => ({
    requestedUrl: url,
    finalUrl: url,
    redirectChain: [],
    statusCode: status,
    headers: {},
    body,
    ttfbMs: 1,
    totalMs: 1,
    contentLength: body.length,
  });

  const buildSafeFetch = (
    responses: Record<string, { status: number; body: string } | Error>,
  ): SafeFetchService =>
    ({
      fetchText: jest.fn((url: string) => {
        const r = responses[url];
        if (!r) {
          return Promise.resolve(buildResult(url, 404, ''));
        }
        if (r instanceof Error) {
          return Promise.reject(r);
        }
        return Promise.resolve(buildResult(url, r.status, r.body));
      }),
    }) as unknown as SafeFetchService;

  it('retourne present=false quand llms.txt absent (404)', async () => {
    const svc = new LlmsTxtAnalyzerService(
      buildSafeFetch({
        'https://example.com/llms.txt': { status: 404, body: '' },
      }),
    );
    const result = await svc.analyze('https://example.com');
    expect(result.present).toBe(false);
    expect(result.complianceScore).toBe(0);
    expect(result.issues).toContain('Fichier llms.txt absent');
  });

  it('parse un llms.txt minimal valide et score > 0', async () => {
    const body =
      '# Example\n\n> Short description\n\n## Docs\n\n- [Home](https://example.com): main\n';
    const svc = new LlmsTxtAnalyzerService(
      buildSafeFetch({
        'https://example.com/llms.txt': { status: 200, body },
        'https://example.com/llms-full.txt': { status: 404, body: '' },
      }),
    );
    const result = await svc.analyze('https://example.com');
    expect(result.present).toBe(true);
    expect(result.sections.length).toBeGreaterThan(0);
    expect(result.sections[0]).toEqual({ title: 'Docs', links: 1 });
    expect(result.complianceScore).toBeGreaterThan(0);
    expect(result.hasFullVariant).toBe(false);
  });

  it('détecte la présence de llms-full.txt', async () => {
    const svc = new LlmsTxtAnalyzerService(
      buildSafeFetch({
        'https://example.com/llms.txt': {
          status: 200,
          body: '# X\n> desc\n## Docs\n- [x](https://x)',
        },
        'https://example.com/llms-full.txt': {
          status: 200,
          body: 'full content',
        },
      }),
    );
    const result = await svc.analyze('https://example.com');
    expect(result.hasFullVariant).toBe(true);
  });

  it('signale les problèmes quand aucune section H2 ou blockquote', async () => {
    const svc = new LlmsTxtAnalyzerService(
      buildSafeFetch({
        'https://example.com/llms.txt': {
          status: 200,
          body: '# Titre uniquement\n',
        },
        'https://example.com/llms-full.txt': { status: 404, body: '' },
      }),
    );
    const result = await svc.analyze('https://example.com');
    expect(result.present).toBe(true);
    expect(result.issues).toContain('Aucune section H2 détectée');
    expect(result.issues).toContain('Pas de blockquote de description');
  });

  it('traite correctement une origine avec slash de fin', async () => {
    const svc = new LlmsTxtAnalyzerService(
      buildSafeFetch({
        'https://example.com/llms.txt': { status: 404, body: '' },
      }),
    );
    const result = await svc.analyze('https://example.com/');
    expect(result.url).toBe('https://example.com/llms.txt');
  });

  it('retourne absent quand le fetch échoue', async () => {
    const svc = new LlmsTxtAnalyzerService(
      buildSafeFetch({
        'https://example.com/llms.txt': new Error('network down'),
      }),
    );
    const result = await svc.analyze('https://example.com');
    expect(result.present).toBe(false);
    expect(result.complianceScore).toBe(0);
  });

  it('retourne absent quand le body est vide même avec status 200', async () => {
    const svc = new LlmsTxtAnalyzerService(
      buildSafeFetch({
        'https://example.com/llms.txt': { status: 200, body: '' },
      }),
    );
    const result = await svc.analyze('https://example.com');
    expect(result.present).toBe(false);
  });

  it('gère plusieurs sections H2 avec plusieurs liens et atteint un score élevé', async () => {
    const body = [
      '# Example Corp',
      '',
      '> Une plateforme SaaS complète avec beaucoup de documentation.',
      '',
      '## Docs',
      '- [Guide](https://example.com/guide): guide complet',
      '- [API](https://example.com/api): reference',
      '',
      '## Examples',
      '- [Quickstart](https://example.com/qs): start',
      'Some filler text to grow size above threshold '.repeat(10),
    ].join('\n');
    const svc = new LlmsTxtAnalyzerService(
      buildSafeFetch({
        'https://example.com/llms.txt': { status: 200, body },
        'https://example.com/llms-full.txt': {
          status: 200,
          body: 'full',
        },
      }),
    );
    const result = await svc.analyze('https://example.com');
    expect(result.sections).toHaveLength(2);
    expect(result.sections[0].links).toBe(2);
    expect(result.sections[1].links).toBe(1);
    expect(result.complianceScore).toBe(100);
    expect(result.issues).toHaveLength(0);
  });

  it('gère l échec du check llms-full.txt en silence', async () => {
    const svc = new LlmsTxtAnalyzerService(
      buildSafeFetch({
        'https://example.com/llms.txt': {
          status: 200,
          body: '# X\n> desc\n## Docs\n- [x](https://x)',
        },
        'https://example.com/llms-full.txt': new Error('boom'),
      }),
    );
    const result = await svc.analyze('https://example.com');
    expect(result.present).toBe(true);
    expect(result.hasFullVariant).toBe(false);
  });
});
