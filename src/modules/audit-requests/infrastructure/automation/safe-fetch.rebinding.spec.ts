import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { buildAuditAutomationConfig } from '../../../../../test/factories/audit-config.factory';
import { SafeFetchService } from './safe-fetch.service';

jest.mock('./ssrf-guard.util', () => ({
  ...jest.requireActual('./ssrf-guard.util'),
  assertSafeHttpUrl: jest.fn().mockResolvedValue(undefined),
}));

describe('SafeFetchService face au rebinding DNS', () => {
  let serveurInterne: Server;
  let port: number;
  let service: SafeFetchService;

  beforeAll(async () => {
    serveurInterne = createServer((_requete, reponse) => {
      reponse.end('SECRET-INTERNE');
    });
    await new Promise<void>((pret) =>
      serveurInterne.listen(0, '127.0.0.1', pret),
    );
    port = (serveurInterne.address() as AddressInfo).port;
    service = new SafeFetchService(
      buildAuditAutomationConfig({ maxRedirects: 0, fetchTimeoutMs: 5_000 }),
    );
  });

  afterAll(async () => {
    await service.onModuleDestroy();
    await new Promise((fin) => serveurInterne.close(fin));
  });

  it('refuse de se connecter quand le nom validé se résout ensuite vers une adresse interne', async () => {
    const erreur: unknown = await service
      .fetchText(`http://localhost:${port}/`)
      .catch((rejet: unknown) => rejet);

    expect(erreur).toBeInstanceOf(Error);
    expect((erreur as Error).cause).toEqual(
      new Error('Target resolves to a blocked IP range.'),
    );
  });
});
