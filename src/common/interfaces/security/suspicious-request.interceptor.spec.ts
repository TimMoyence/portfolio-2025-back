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
      ip: '172.18.0.1',
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

  it('prend la premiere IP de x-forwarded-for', async () => {
    const req: FakeRequest = {
      method: 'GET',
      url: '/wp-login.php',
      headers: {
        'user-agent': 'curl/7.88',
        'accept-language': '',
        'x-forwarded-for': '9.9.9.9, 8.8.8.8, 172.18.0.1',
      },
    };
    const res: FakeResponse = { statusCode: 404, writableEnded: true };
    const handler: CallHandler = { handle: () => of({}) };

    await firstValueFrom(
      interceptor.intercept(buildContext(req, res), handler),
    );

    const top = await store.getTopIPs(10, 60_000);
    expect(top[0].ip).toBe('9.9.9.9');
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
