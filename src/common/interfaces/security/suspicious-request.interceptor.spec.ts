import type { CallHandler, ExecutionContext } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { firstValueFrom, lastValueFrom } from 'rxjs';
import { InMemorySecurityEventsStore } from './in-memory-security-events-store';
import type { SecurityConfig } from './security.config';
import { SuspiciousRequestInterceptor } from './suspicious-request.interceptor';

interface FakeRequest {
  method: string;
  url: string;
  originalUrl?: string;
  headers: Record<string, string | undefined>;
  ip?: string;
  socket?: { remoteAddress?: string };
  destroyed?: boolean;
}

interface FakeResponse {
  statusCode: number;
  writableEnded: boolean;
}

function buildContext(
  req: FakeRequest,
  res: FakeResponse,
  type: 'http' | 'rpc' = 'http',
): ExecutionContext {
  return {
    getType: () => type,
    switchToHttp: () => ({
      getRequest: () => req,
      getResponse: () => res,
      getNext: () => ({}),
    }),
  } as unknown as ExecutionContext;
}

function buildConfig(overrides: Partial<SecurityConfig> = {}): SecurityConfig {
  return {
    suspiciousScoreThreshold: 25,
    reportWindowMs: 60_000,
    topEventsLimit: 10,
    ...overrides,
  };
}

describe('SuspiciousRequestInterceptor', () => {
  let store: InMemorySecurityEventsStore;
  let interceptor: SuspiciousRequestInterceptor;

  beforeEach(() => {
    store = new InMemorySecurityEventsStore();
    interceptor = new SuspiciousRequestInterceptor(buildConfig(), store);
  });

  it('ignore les contextes non-HTTP', async () => {
    const handler: CallHandler = { handle: () => of('rpc-result') };
    const ctx = buildContext({} as FakeRequest, {} as FakeResponse, 'rpc');
    const result = await firstValueFrom(interceptor.intercept(ctx, handler));
    expect(result).toBe('rpc-result');
    expect(await store.getTopIPs(10, 60_000)).toHaveLength(0);
  });

  it('ne persiste rien pour une requete Safari legitime', async () => {
    const req: FakeRequest = {
      method: 'GET',
      url: '/api/v1/portfolio25/auth/me',
      headers: {
        'user-agent': 'Mozilla/5.0 (Macintosh) Safari/605.1.15',
        'accept-language': 'fr-FR,fr;q=0.9',
      },
      ip: '10.0.0.1',
    };
    const res: FakeResponse = { statusCode: 200, writableEnded: true };
    const handler: CallHandler = { handle: () => of({ ok: true }) };

    await firstValueFrom(
      interceptor.intercept(buildContext(req, res), handler),
    );

    expect(await store.getTopIPs(10, 60_000)).toHaveLength(0);
  });

  it('persiste une requete HeadlessChrome suspecte', async () => {
    const req: FakeRequest = {
      method: 'POST',
      url: '/api/v1/portfolio25/cookie-consents',
      headers: {
        'user-agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) HeadlessChrome/145 Safari/537.36',
        'accept-language': 'en-US,en;q=0.9',
        'x-forwarded-for': '135.125.11.41',
      },
      // Valeur qu'Express calcule sous `trust proxy` quand le
      // reverse-proxy renseigne `X-Forwarded-For`.
      ip: '135.125.11.41',
    };
    const res: FakeResponse = { statusCode: 201, writableEnded: true };
    const handler: CallHandler = { handle: () => of({}) };

    await firstValueFrom(
      interceptor.intercept(buildContext(req, res), handler),
    );

    const top = await store.getTopIPs(10, 60_000);
    expect(top).toHaveLength(1);
    expect(top[0].ip).toBe('135.125.11.41');
    expect(top[0].lastReasons).toContain('ua:headless-chrome');
  });

  it('ignore une chaine x-forwarded-for forgee au profit de req.ip', async () => {
    // Ce test verifiait auparavant que la PREMIERE entree de
    // `X-Forwarded-For` etait retenue. Cette entree est integralement
    // fournie par le client : un attaquant choisissait donc l'IP sous
    // laquelle ses requetes etaient tracees, et pouvait attribuer son
    // activite a un tiers. `trust proxy` etant actif, `req.ip` est la
    // seule valeur validee — c'est elle qui doit faire foi.
    const req: FakeRequest = {
      method: 'GET',
      url: '/wp-login.php',
      headers: {
        'user-agent': 'curl/7.88',
        'accept-language': '',
        'x-forwarded-for': '9.9.9.9, 8.8.8.8, 172.18.0.1',
      },
      ip: '172.18.0.1',
    };
    const res: FakeResponse = { statusCode: 404, writableEnded: true };
    const handler: CallHandler = { handle: () => of({}) };

    await firstValueFrom(
      interceptor.intercept(buildContext(req, res), handler),
    );

    const top = await store.getTopIPs(10, 60_000);
    expect(top[0].ip).toBe('172.18.0.1');
    expect(top[0].ip).not.toBe('9.9.9.9');
  });

  it('enregistre aussi quand le handler emet une erreur', async () => {
    const req: FakeRequest = {
      method: 'POST',
      url: '/api/v1/portfolio25/auth/login',
      headers: {
        'user-agent': 'python-requests/2.32',
        'accept-language': '',
      },
      ip: '7.7.7.7',
    };
    const res: FakeResponse = { statusCode: 401, writableEnded: true };
    const handler: CallHandler = {
      handle: () => throwError(() => new Error('unauthorized')),
    };

    await lastValueFrom(
      interceptor.intercept(buildContext(req, res), handler),
    ).catch(() => undefined);

    const top = await store.getTopIPs(10, 60_000);
    expect(top).toHaveLength(1);
    expect(top[0].ip).toBe('7.7.7.7');
    expect(top[0].lastReasons).toContain('ua:python-requests');
  });

  it.each(['127.0.0.1', '::ffff:127.0.0.1', '::1'])(
    'bypass le scoring pour les IPs loopback via req.ip (%s)',
    async (loopbackIp) => {
      const req: FakeRequest = {
        method: 'GET',
        url: '/api/v1/portfolio25',
        headers: { 'user-agent': undefined, 'accept-language': undefined },
        ip: loopbackIp,
      };
      const res: FakeResponse = { statusCode: 200, writableEnded: true };
      const handler: CallHandler = { handle: () => of({ ok: true }) };

      await firstValueFrom(
        interceptor.intercept(buildContext(req, res), handler),
      );

      expect(await store.getTopIPs(10, 60_000)).toHaveLength(0);
    },
  );

  it('bypass le scoring via socket.remoteAddress si req.ip est absent', async () => {
    const req: FakeRequest = {
      method: 'GET',
      url: '/api/v1/portfolio25/health',
      headers: { 'user-agent': undefined, 'accept-language': undefined },
      ip: undefined,
      socket: { remoteAddress: '127.0.0.1' },
    };
    const res: FakeResponse = { statusCode: 200, writableEnded: true };
    const handler: CallHandler = { handle: () => of({ ok: true }) };

    await firstValueFrom(
      interceptor.intercept(buildContext(req, res), handler),
    );

    expect(await store.getTopIPs(10, 60_000)).toHaveLength(0);
  });

  it('ne bypasse pas le scoring sur un X-Forwarded-For loopback forge', async () => {
    // Depuis l'activation de `trust proxy`, `req.ip` derive de
    // `X-Forwarded-For`. Un client qui annonce `127.0.0.1` obtiendrait
    // donc un `req.ip` loopback et court-circuiterait tout le scoring
    // s'il servait de critere. Seule l'adresse du socket fait foi.
    const req: FakeRequest = {
      method: 'POST',
      url: '/api/v1/portfolio25/cookie-consents',
      headers: {
        'user-agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) HeadlessChrome/145 Safari/537.36',
        'accept-language': 'en-US,en;q=0.9',
        'x-forwarded-for': '127.0.0.1',
      },
      ip: '127.0.0.1',
      socket: { remoteAddress: '135.125.11.41' },
    };
    const res: FakeResponse = { statusCode: 201, writableEnded: true };
    const handler: CallHandler = { handle: () => of({}) };

    await firstValueFrom(
      interceptor.intercept(buildContext(req, res), handler),
    );

    expect(await store.getTopIPs(10, 60_000)).toHaveLength(1);
  });

  it('attribue l’evenement a l’IP resolue par Express, pas au X-Forwarded-For brut', async () => {
    // `trust proxy` etant actif (src/main.ts), Express a deja calcule
    // `req.ip` en ne faisant confiance qu'au dernier bond. Reparser
    // `X-Forwarded-For` a la main contournerait ce calcul et laisserait
    // un attaquant choisir l'IP sous laquelle son activite est tracee.
    const req: FakeRequest = {
      method: 'POST',
      url: '/api/v1/portfolio25/cookie-consents',
      headers: {
        'user-agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) HeadlessChrome/145 Safari/537.36',
        'accept-language': 'en-US,en;q=0.9',
        'x-forwarded-for': '1.2.3.4, 203.0.113.7',
      },
      ip: '203.0.113.7',
      socket: { remoteAddress: '::ffff:172.18.0.1' },
    };
    const res: FakeResponse = { statusCode: 201, writableEnded: true };
    const handler: CallHandler = { handle: () => of({}) };

    await firstValueFrom(
      interceptor.intercept(buildContext(req, res), handler),
    );

    const top = await store.getTopIPs(10, 60_000);
    expect(top).toHaveLength(1);
    expect(top[0].ip).toBe('203.0.113.7');
  });

  it('retombe sur l’adresse du socket quand req.ip est absent', async () => {
    const req: FakeRequest = {
      method: 'POST',
      url: '/api/v1/portfolio25/cookie-consents',
      headers: {
        'user-agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) HeadlessChrome/145 Safari/537.36',
        'accept-language': 'en-US,en;q=0.9',
        'x-forwarded-for': '1.2.3.4',
      },
      ip: undefined,
      socket: { remoteAddress: '198.51.100.9' },
    };
    const res: FakeResponse = { statusCode: 201, writableEnded: true };
    const handler: CallHandler = { handle: () => of({}) };

    await firstValueFrom(
      interceptor.intercept(buildContext(req, res), handler),
    );

    const top = await store.getTopIPs(10, 60_000);
    expect(top[0].ip).toBe('198.51.100.9');
  });

  it('ne leve jamais meme si le store casse', async () => {
    const broken: InMemorySecurityEventsStore = Object.assign(
      new InMemorySecurityEventsStore(),
      {
        recordEvent: (): Promise<number> =>
          Promise.reject(new Error('store down')),
      },
    );
    const brokenInterceptor = new SuspiciousRequestInterceptor(
      buildConfig(),
      broken,
    );

    const req: FakeRequest = {
      method: 'GET',
      url: '/.env',
      headers: {
        'user-agent': 'curl/7',
        'accept-language': '',
      },
      ip: '1.1.1.1',
    };
    const res: FakeResponse = { statusCode: 404, writableEnded: true };
    const handler: CallHandler = { handle: () => of({}) };

    await expect(
      firstValueFrom(
        brokenInterceptor.intercept(buildContext(req, res), handler),
      ),
    ).resolves.toEqual({});
  });
});
