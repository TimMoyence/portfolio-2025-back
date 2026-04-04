import { buildAuditAutomationConfig } from '../../../../../test/factories/audit-config.factory';
import type { AuditAutomationConfig } from './audit.config';
import { SafeFetchService } from './safe-fetch.service';
import * as ssrfGuard from './ssrf-guard.util';

jest.mock('./ssrf-guard.util');

const mockedAssertSafeHttpUrl =
  ssrfGuard.assertSafeHttpUrl as jest.MockedFunction<
    typeof ssrfGuard.assertSafeHttpUrl
  >;

/**
 * Crée un ReadableStream à partir d'une chaîne de caractères.
 * Utilisé pour simuler le body d'une Response.
 */
function streamFromString(text: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const encoded = encoder.encode(text);
  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoded);
      controller.close();
    },
  });
}

/**
 * Crée un ReadableStream qui émet les données en chunks de la taille spécifiée.
 */
function streamFromChunks(chunks: Uint8Array[]): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(chunk);
      }
      controller.close();
    },
  });
}

/**
 * Crée un objet Response simulé avec les propriétés nécessaires.
 */
function buildResponse(
  status: number,
  headers: Record<string, string>,
  body?: string,
): Response {
  const headersObj = new Headers(headers);
  return new Response(body !== undefined ? streamFromString(body) : null, {
    status,
    headers: headersObj,
  });
}

describe('SafeFetchService', () => {
  const config: AuditAutomationConfig = buildAuditAutomationConfig({
    maxRedirects: 3,
    textMaxBytes: 1024,
  });

  let service: SafeFetchService;
  let fetchSpy: jest.SpiedFunction<typeof global.fetch>;

  beforeEach(() => {
    jest.restoreAllMocks();
    mockedAssertSafeHttpUrl.mockReset();
    mockedAssertSafeHttpUrl.mockResolvedValue(undefined);
    fetchSpy = jest.spyOn(global, 'fetch');
    service = new SafeFetchService(config);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('fetchText retourne le body pour une réponse 200', async () => {
    const html = '<html><body>Bonjour</body></html>';
    fetchSpy.mockResolvedValueOnce(
      buildResponse(200, { 'content-type': 'text/html' }, html),
    );

    const result = await service.fetchText('https://example.com');

    expect(result.statusCode).toBe(200);
    expect(result.body).toBe(html);
    expect(result.requestedUrl).toBe('https://example.com');
    expect(result.finalUrl).toBe('https://example.com/');
    expect(result.redirectChain).toEqual([]);
    expect(result.contentLength).toBeNull();
    expect(typeof result.ttfbMs).toBe('number');
    expect(typeof result.totalMs).toBe('number');
  });

  it('fetchHeaders retourne null pour body', async () => {
    fetchSpy.mockResolvedValueOnce(
      buildResponse(200, { 'content-length': '42', 'x-custom': 'test' }),
    );

    const result = await service.fetchHeaders('https://example.com');

    expect(result.body).toBeNull();
    expect(result.statusCode).toBe(200);
    expect(result.contentLength).toBe(42);
    expect(result.headers['x-custom']).toBe('test');
  });

  it('suit les redirections (301, 302)', async () => {
    fetchSpy
      .mockResolvedValueOnce(
        buildResponse(301, { location: 'https://example.com/step2' }),
      )
      .mockResolvedValueOnce(
        buildResponse(302, { location: 'https://example.com/step3' }),
      )
      .mockResolvedValueOnce(
        buildResponse(200, { 'content-type': 'text/html' }, 'final'),
      );

    const result = await service.fetchText('https://example.com/start');

    expect(result.statusCode).toBe(200);
    expect(result.body).toBe('final');
    expect(result.finalUrl).toBe('https://example.com/step3');
    expect(result.redirectChain).toEqual([
      'https://example.com/start',
      'https://example.com/step2',
    ]);
    expect(fetchSpy).toHaveBeenCalledTimes(3);
  });

  it('lance une erreur si trop de redirections', async () => {
    // maxRedirects = 3, donc on autorise les hops 0, 1, 2, 3 (4 itérations)
    // Si chaque itération est une redirection, on n'atteint jamais une réponse finale
    fetchSpy.mockImplementation(() =>
      Promise.resolve(
        buildResponse(301, { location: 'https://example.com/next' }),
      ),
    );

    await expect(service.fetchText('https://example.com/loop')).rejects.toThrow(
      /Too many redirects/,
    );
  });

  it('appelle assertSafeHttpUrl pour chaque hop', async () => {
    fetchSpy
      .mockResolvedValueOnce(
        buildResponse(302, { location: 'https://other.com/page' }),
      )
      .mockResolvedValueOnce(
        buildResponse(200, { 'content-type': 'text/html' }, 'ok'),
      );

    await service.fetchText('https://example.com');

    expect(mockedAssertSafeHttpUrl).toHaveBeenCalledTimes(2);
    expect(mockedAssertSafeHttpUrl).toHaveBeenNthCalledWith(
      1,
      new URL('https://example.com'),
    );
    expect(mockedAssertSafeHttpUrl).toHaveBeenNthCalledWith(
      2,
      new URL('https://other.com/page'),
    );
  });

  it('respecte le timeout (abort controller)', async () => {
    fetchSpy.mockImplementation((_url, init) => {
      const signal = (init as RequestInit).signal;
      expect(signal).toBeDefined();
      expect(signal).toBeInstanceOf(AbortSignal);
      return Promise.resolve(buildResponse(200, {}, 'ok'));
    });

    await service.fetchText('https://example.com');

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://example.com/',
      expect.objectContaining({
        signal: expect.any(AbortSignal),
        redirect: 'manual',
      }),
    );
  });

  it('lance une erreur si le body dépasse maxBytes', async () => {
    // maxBytes par défaut = config.textMaxBytes = 1024
    const largeBody = 'x'.repeat(2048);
    const encoder = new TextEncoder();
    const encoded = encoder.encode(largeBody);
    const body = streamFromChunks([encoded]);

    fetchSpy.mockResolvedValueOnce(
      new Response(body, {
        status: 200,
        headers: new Headers({ 'content-type': 'text/html' }),
      }),
    );

    await expect(service.fetchText('https://example.com')).rejects.toThrow(
      /Response body exceeds max allowed size/,
    );
  });
});
