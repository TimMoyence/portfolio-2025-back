import type { CallHandler, ExecutionContext } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { firstValueFrom, lastValueFrom } from 'rxjs';
import { InMemorySecurityEventsStore } from './in-memory-security-events-store';
import type { SecurityConfig } from './security.config';
import { SuspiciousRequestInterceptor } from './suspicious-request.interceptor';

const LOOPBACK_IPV4 = '127.0.0.1';

const HEADLESS_CHROME_HEADERS = {
  'user-agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) HeadlessChrome/145 Safari/537.36',
  'accept-language': 'en-US,en;q=0.9',
};

const COOKIE_CONSENT_POST = {
  method: 'POST',
  url: '/api/v1/portfolio25/cookie-consents',
};

function mappedIpv6(ipv4: string): string {
  return `::ffff:${ipv4}`;
}

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

  function intercept(
    req: FakeRequest,
    statusCode: number,
    handler: CallHandler = { handle: () => of({}) },
    target: SuspiciousRequestInterceptor = interceptor,
  ): Promise<unknown> {
    const res: FakeResponse = { statusCode, writableEnded: true };
    return firstValueFrom(target.intercept(buildContext(req, res), handler));
  }

  function topIPs() {
    return store.getTopIPs(10, 60_000);
  }

  async function attendreRienDePersiste(req: FakeRequest): Promise<void> {
    await intercept(req, 200, { handle: () => of({ ok: true }) });

    expect(await topIPs()).toHaveLength(0);
  }

  function postHeadless(
    identite: Pick<FakeRequest, 'ip' | 'socket'>,
    xForwardedFor?: string,
  ): FakeRequest {
    return {
      ...COOKIE_CONSENT_POST,
      headers: {
        ...HEADLESS_CHROME_HEADERS,
        ...(xForwardedFor === undefined
          ? {}
          : { 'x-forwarded-for': xForwardedFor }),
      },
      ...identite,
    };
  }

  async function ipsTraceesApresCreation(req: FakeRequest) {
    await intercept(req, 201);
    return topIPs();
  }

  it('ignore les contextes non-HTTP', async () => {
    const handler: CallHandler = { handle: () => of('rpc-result') };
    const ctx = buildContext({} as FakeRequest, {} as FakeResponse, 'rpc');
    const result = await firstValueFrom(interceptor.intercept(ctx, handler));
    expect(result).toBe('rpc-result');
    expect(await topIPs()).toHaveLength(0);
  });

  it('ne persiste rien pour une requete Safari legitime', async () => {
    await attendreRienDePersiste({
      method: 'GET',
      url: '/api/v1/portfolio25/auth/me',
      headers: {
        'user-agent': 'Mozilla/5.0 (Macintosh) Safari/605.1.15',
        'accept-language': 'fr-FR,fr;q=0.9',
      },
      ip: '203.0.113.10',
    });
  });

  it('persiste une requete HeadlessChrome suspecte', async () => {
    const top = await ipsTraceesApresCreation(
      // Valeur qu'Express calcule sous `trust proxy` quand le
      // reverse-proxy renseigne `X-Forwarded-For`.
      postHeadless({ ip: '203.0.113.41' }, '203.0.113.41'),
    );

    expect(top).toHaveLength(1);
    expect(top[0].ip).toBe('203.0.113.41');
    expect(top[0].lastReasons).toContain('ua:headless-chrome');
  });

  it('ignore une chaine x-forwarded-for forgee au profit de req.ip', async () => {
    // `X-Forwarded-For` est fourni en entier par le client : seul le
    // `req.ip` calcule par Express sous `trust proxy` est valide.
    const req: FakeRequest = {
      method: 'GET',
      url: '/wp-login.php',
      headers: {
        'user-agent': 'curl/7.88',
        'accept-language': '',
        'x-forwarded-for': '198.51.100.99, 198.51.100.8, 203.0.113.18',
      },
      ip: '203.0.113.18',
    };

    await intercept(req, 404);

    const top = await topIPs();
    expect(top[0].ip).toBe('203.0.113.18');
    expect(top[0].ip).not.toBe('198.51.100.99');
  });

  it('enregistre aussi quand le handler emet une erreur', async () => {
    const req: FakeRequest = {
      method: 'POST',
      url: '/api/v1/portfolio25/auth/login',
      headers: {
        'user-agent': 'python-requests/2.32',
        'accept-language': '',
      },
      ip: '198.51.100.7',
    };
    const res: FakeResponse = { statusCode: 401, writableEnded: true };
    const handler: CallHandler = {
      handle: () => throwError(() => new Error('unauthorized')),
    };

    await lastValueFrom(
      interceptor.intercept(buildContext(req, res), handler),
    ).catch(() => undefined);

    const top = await topIPs();
    expect(top).toHaveLength(1);
    expect(top[0].ip).toBe('198.51.100.7');
    expect(top[0].lastReasons).toContain('ua:python-requests');
  });

  it.each([LOOPBACK_IPV4, mappedIpv6(LOOPBACK_IPV4), '::1'])(
    'bypass le scoring pour les IPs loopback via req.ip (%s)',
    async (loopbackIp) => {
      await attendreRienDePersiste({
        method: 'GET',
        url: '/api/v1/portfolio25',
        headers: { 'user-agent': undefined, 'accept-language': undefined },
        ip: loopbackIp,
      });
    },
  );

  it('bypass le scoring via socket.remoteAddress si req.ip est absent', async () => {
    await attendreRienDePersiste({
      method: 'GET',
      url: '/api/v1/portfolio25/health',
      headers: { 'user-agent': undefined, 'accept-language': undefined },
      ip: undefined,
      socket: { remoteAddress: LOOPBACK_IPV4 },
    });
  });

  it('ne bypasse pas le scoring sur un X-Forwarded-For loopback forge', async () => {
    // Sous `trust proxy`, le `req.ip` calcule par Express derive de
    // `X-Forwarded-For` : seule l'adresse du socket fait foi ici.
    const top = await ipsTraceesApresCreation(
      postHeadless(
        { ip: LOOPBACK_IPV4, socket: { remoteAddress: '203.0.113.41' } },
        LOOPBACK_IPV4,
      ),
    );

    expect(top).toHaveLength(1);
  });

  it('attribue l’evenement a l’IP resolue par Express, pas au X-Forwarded-For brut', async () => {
    // `trust proxy` etant actif (src/main.ts), Express a deja calcule
    // `req.ip` en ne faisant confiance qu'au dernier bond. Reparser
    // `X-Forwarded-For` a la main contournerait ce calcul et laisserait
    // un attaquant choisir l'IP sous laquelle son activite est tracee.
    const top = await ipsTraceesApresCreation(
      postHeadless(
        {
          ip: '203.0.113.7',
          socket: { remoteAddress: mappedIpv6('192.0.2.18') },
        },
        '192.0.2.4, 203.0.113.7',
      ),
    );

    expect(top).toHaveLength(1);
    expect(top[0].ip).toBe('203.0.113.7');
  });

  it('retombe sur l’adresse du socket quand req.ip est absent', async () => {
    const top = await ipsTraceesApresCreation(
      postHeadless(
        { ip: undefined, socket: { remoteAddress: '198.51.100.9' } },
        '192.0.2.4',
      ),
    );

    expect(top[0].ip).toBe('198.51.100.9');
  });

  it('normalise l’IP IPv4-mappee-IPv6 avant de l’enregistrer', async () => {
    // Forme IPv4-mappee-IPv6 de la RFC 4291 section 2.5.5.2 : sans
    // normalisation, elle compte comme un client distinct dans les
    // agregats.
    const clientIp = '203.0.113.7';
    const top = await ipsTraceesApresCreation(
      postHeadless({ ip: mappedIpv6(clientIp) }),
    );

    expect(top[0].ip).toBe(clientIp);
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
      ip: '203.0.113.11',
    };

    await expect(
      intercept(req, 404, undefined, brokenInterceptor),
    ).resolves.toEqual({});
  });
});
