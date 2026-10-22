import type { CallHandler } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { firstValueFrom, lastValueFrom } from 'rxjs';
import {
  createFakeHttpResponse,
  createHttpExecutionContext,
  createRpcExecutionContext,
} from '../../../../test/factories/execution-context.factory';
import { espionnerLesAvertissements } from '../../../../test/helpers/avertissements';
import { sousUneDureeDe } from '../../../../test/helpers/horloge';
import { LONGUEUR_MAX_DU_NAVIGATEUR } from '../../domain/provenance';
import { CENSURE } from '../http/url-journalisable';
import type { SecurityConfig } from './security.config';
import { SuspiciousRequestInterceptor } from './suspicious-request.interceptor';

const LOOPBACK_IPV4 = '127.0.0.1';
const JETON_DE_LIEN = '550e8400-e29b-41d4-a716-446655440000';

const HEADLESS_CHROME_HEADERS = {
  'user-agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) HeadlessChrome/145 Safari/537.36',
  'accept-language': 'en-US,en;q=0.9',
};

const CONTACT_POST = {
  method: 'POST',
  url: '/api/v1/portfolio25/contacts',
};

const NAVIGATEUR_DEMESURE = `HeadlessChrome/145 ${'B'.repeat(15_000)}`;

const CONTACT_AU_NAVIGATEUR_DEMESURE: FakeRequest = {
  ...CONTACT_POST,
  headers: { ...HEADLESS_CHROME_HEADERS, 'user-agent': NAVIGATEUR_DEMESURE },
  ip: '203.0.113.42',
};

const LIGNE_SUSPECTE =
  /^\[SECURITY\] suspicious ip=(?<ip>\S+) method=\S+ path=(?<path>\S+) status=\d+ score=\d+ reasons=(?<reasons>\S*) ua="(?<ua>.*)" rtMs=\S+ aborted=(?<aborted>true|false)$/;

interface TraceJournalisee {
  ip: string;
  path: string;
  reasons: string[];
  ua: string;
  aborted: boolean;
}

function mappedIpv6(ipv4: string): string {
  return `::ffff:${ipv4}`;
}

interface FakeRequest {
  method: string;
  url: string;
  originalUrl?: string;
  params?: Record<string, string>;
  headers: Record<string, string | undefined>;
  ip?: string;
  socket?: { remoteAddress?: string };
  destroyed?: boolean;
}

const CONFIG: SecurityConfig = { suspiciousScoreThreshold: 25 };

describe('SuspiciousRequestInterceptor', () => {
  const avertissements = espionnerLesAvertissements();
  const interceptor = new SuspiciousRequestInterceptor(CONFIG);

  async function intercept(
    req: FakeRequest,
    statusCode: number,
    handler: CallHandler = { handle: () => of({}) },
  ): Promise<unknown> {
    const res = createFakeHttpResponse({ statusCode });
    try {
      return await firstValueFrom(
        interceptor.intercept(createHttpExecutionContext(req, res), handler),
      );
    } finally {
      res.emit('close');
    }
  }

  function tracesJournalisees(): TraceJournalisee[] {
    return avertissements().mock.calls.flatMap(([message]) => {
      const groupes = LIGNE_SUSPECTE.exec(String(message))?.groups;
      if (groupes === undefined) return [];
      return [
        {
          ip: groupes.ip,
          path: groupes.path,
          reasons: groupes.reasons.split(','),
          ua: groupes.ua,
          aborted: groupes.aborted === 'true',
        },
      ];
    });
  }

  async function attendreRienDeJournalise(req: FakeRequest): Promise<void> {
    await intercept(req, 200, { handle: () => of({ ok: true }) });

    expect(tracesJournalisees()).toHaveLength(0);
  }

  function postHeadless(
    identite: Pick<FakeRequest, 'ip' | 'socket'>,
    xForwardedFor?: string,
  ): FakeRequest {
    return {
      ...CONTACT_POST,
      headers: {
        ...HEADLESS_CHROME_HEADERS,
        ...(xForwardedFor === undefined
          ? {}
          : { 'x-forwarded-for': xForwardedFor }),
      },
      ...identite,
    };
  }

  async function tracesApresCreation(req: FakeRequest) {
    await intercept(req, 201);
    return tracesJournalisees();
  }

  it('ignore les contextes non-HTTP', async () => {
    const handler: CallHandler = { handle: () => of('rpc-result') };
    const result = await firstValueFrom(
      interceptor.intercept(createRpcExecutionContext(), handler),
    );
    expect(result).toBe('rpc-result');
    expect(tracesJournalisees()).toHaveLength(0);
  });

  it('ne journalise rien pour une requete Safari legitime', async () => {
    await attendreRienDeJournalise({
      method: 'GET',
      url: '/api/v1/portfolio25/auth/me',
      headers: {
        'user-agent': 'Mozilla/5.0 (Macintosh) Safari/605.1.15',
        'accept-language': 'fr-FR,fr;q=0.9',
      },
      ip: '203.0.113.10',
    });
  });

  it('journalise une requete HeadlessChrome suspecte', async () => {
    const traces = await tracesApresCreation(
      // Valeur qu'Express calcule sous `trust proxy` quand le
      // reverse-proxy renseigne `X-Forwarded-For`.
      postHeadless({ ip: '203.0.113.41' }, '203.0.113.41'),
    );

    expect(traces).toHaveLength(1);
    expect(traces[0].ip).toBe('203.0.113.41');
    expect(traces[0].reasons).toContain('ua:headless-chrome');
  });

  it('journalise un navigateur borne pour une requete suspecte', async () => {
    const [trace] = await tracesApresCreation(CONTACT_AU_NAVIGATEUR_DEMESURE);

    expect(trace.reasons).toContain('ua:headless-chrome');
    expect(trace.ua).toHaveLength(LONGUEUR_MAX_DU_NAVIGATEUR);
    expect(NAVIGATEUR_DEMESURE.startsWith(trace.ua.slice(0, -1))).toBe(true);
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

    const [trace] = tracesJournalisees();
    expect(trace.ip).toBe('203.0.113.18');
    expect(trace.ip).not.toBe('198.51.100.99');
  });

  it('journalise aussi quand le handler emet une erreur', async () => {
    const req: FakeRequest = {
      method: 'POST',
      url: '/api/v1/portfolio25/auth/login',
      headers: {
        'user-agent': 'python-requests/2.32',
        'accept-language': '',
      },
      ip: '198.51.100.7',
    };
    const handler: CallHandler = {
      handle: () => throwError(() => new Error('unauthorized')),
    };

    await expect(intercept(req, 401, handler)).rejects.toThrow('unauthorized');

    const traces = tracesJournalisees();
    expect(traces).toHaveLength(1);
    expect(traces[0].ip).toBe('198.51.100.7');
    expect(traces[0].reasons).toEqual(
      expect.arrayContaining(['ua:python-requests', 'sensitive:write-4xx']),
    );
  });

  it.each([
    {
      cas: 'une reponse fermee avant d etre terminee',
      etat: { writableFinished: false },
      fermetures: ['close'],
      ip: '203.0.113.12',
    },
    {
      cas: 'une reponse deja fermee avant l intercepteur',
      etat: { destroyed: true, writableFinished: false },
      fermetures: [],
      ip: '203.0.113.13',
    },
  ])('marque abandonnee $cas', async ({ etat, fermetures, ip }) => {
    const res = createFakeHttpResponse(etat);

    await lastValueFrom(
      interceptor.intercept(
        createHttpExecutionContext(postHeadless({ ip }), res),
        { handle: () => of({}) },
      ),
    );
    fermetures.forEach((evenement) => res.emit(evenement));

    const [trace] = tracesJournalisees();
    expect(trace.reasons).toContain('http:aborted');
    expect(trace.aborted).toBe(true);
  });

  it.each([LOOPBACK_IPV4, mappedIpv6(LOOPBACK_IPV4), '::1'])(
    'bypass le scoring pour les IPs loopback via req.ip (%s)',
    async (loopbackIp) => {
      await attendreRienDeJournalise({
        method: 'GET',
        url: '/api/v1/portfolio25',
        headers: { 'user-agent': undefined, 'accept-language': undefined },
        ip: loopbackIp,
      });
    },
  );

  it('bypass le scoring via socket.remoteAddress si req.ip est absent', async () => {
    await attendreRienDeJournalise({
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
    const traces = await tracesApresCreation(
      postHeadless(
        { ip: LOOPBACK_IPV4, socket: { remoteAddress: '203.0.113.41' } },
        LOOPBACK_IPV4,
      ),
    );

    expect(traces).toHaveLength(1);
  });

  it('attribue l’evenement a l’IP resolue par Express, pas au X-Forwarded-For brut', async () => {
    // `trust proxy` etant actif (src/main.ts), Express a deja calcule
    // `req.ip` en ne faisant confiance qu'au dernier bond. Reparser
    // `X-Forwarded-For` a la main contournerait ce calcul et laisserait
    // un attaquant choisir l'IP sous laquelle son activite est tracee.
    const traces = await tracesApresCreation(
      postHeadless(
        {
          ip: '203.0.113.7',
          socket: { remoteAddress: mappedIpv6('192.0.2.18') },
        },
        '192.0.2.4, 203.0.113.7',
      ),
    );

    expect(traces).toHaveLength(1);
    expect(traces[0].ip).toBe('203.0.113.7');
  });

  it('retombe sur l’adresse du socket quand req.ip est absent', async () => {
    const [trace] = await tracesApresCreation(
      postHeadless(
        { ip: undefined, socket: { remoteAddress: '198.51.100.9' } },
        '192.0.2.4',
      ),
    );

    expect(trace.ip).toBe('198.51.100.9');
  });

  it('normalise l’IP IPv4-mappee-IPv6 avant de la journaliser', async () => {
    // Forme IPv4-mappee-IPv6 de la RFC 4291 section 2.5.5.2 : sans
    // normalisation, elle compte comme un client distinct dans les
    // agregats.
    const clientIp = '203.0.113.7';
    const [trace] = await tracesApresCreation(
      postHeadless({ ip: mappedIpv6(clientIp) }),
    );

    expect(trace.ip).toBe(clientIp);
  });

  it.each([
    [
      'en requete',
      `/api/v1/portfolio25/auth/verify-email?token=${JETON_DE_LIEN}`,
      {},
      `/api/v1/portfolio25/auth/verify-email?token=${CENSURE}`,
    ],
    [
      'en chemin',
      `/api/v1/portfolio25/lead-magnets/toolkit/${JETON_DE_LIEN}`,
      { token: JETON_DE_LIEN },
      `/api/v1/portfolio25/lead-magnets/toolkit/${CENSURE}`,
    ],
  ])(
    'n ecrit pas le jeton d un lien porte %s',
    async (_cas, url, params, cheminCensure) => {
      await intercept(
        {
          method: 'GET',
          url,
          originalUrl: url,
          params,
          headers: HEADLESS_CHROME_HEADERS,
          ip: '203.0.113.42',
        },
        404,
      );

      expect(tracesJournalisees()[0]?.path).toBe(cheminCensure);
      expect(JSON.stringify(avertissements().mock.calls)).not.toContain(
        JETON_DE_LIEN,
      );
    },
  );

  it('journalise la duree de la requete en millisecondes', async () => {
    await sousUneDureeDe(2.5, () =>
      intercept(
        {
          method: 'GET',
          url: '/api/v1/portfolio25/inconnu',
          headers: HEADLESS_CHROME_HEADERS,
          ip: '203.0.113.42',
        },
        404,
      ),
    );

    expect(avertissements()).toHaveBeenCalledWith(
      expect.stringContaining(' rtMs=2.5 '),
    );
  });
});
