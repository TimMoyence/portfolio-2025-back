import { BadRequestException } from '@nestjs/common';
import { lookup as resoudreParRappel } from 'dns';
import { lookup } from 'dns/promises';
import {
  isBlockedIpAddress,
  assertPublicHostname,
  assertSafeHttpUrl,
  resoudreVersUneAdressePublique,
} from './ssrf-guard.util';

jest.mock('dns/promises', () => ({
  lookup: jest.fn(),
}));

jest.mock('dns', () => ({
  lookup: jest.fn(),
}));

const mockedLookup = lookup as unknown as jest.Mock;
const mockedResoudreParRappel = resoudreParRappel as unknown as jest.Mock;

/* eslint-disable sonarjs/no-hardcoded-ip -- fixtures : les plages IP privees et publiques sont l'objet meme du guard SSRF */
const BLOCKED_ADDRESSES: ReadonlyArray<[string, string]> = [
  ['127.0.0.1', 'loopback'],
  ['10.0.0.1', 'prive'],
  ['192.168.1.1', 'prive'],
  ['172.16.0.1', 'prive'],
  ['169.254.1.1', 'link-local'],
  ['224.0.0.1', 'multicast'],
  ['0.0.0.0', 'adresse nulle'],
  ['::1', 'IPv6 loopback'],
  ['fe80::1', 'IPv6 link-local'],
  ['febf::1', 'IPv6 link-local, fin de plage'],
  ['fd00::1', 'IPv6 unique locale'],
  ['::ffff:127.0.0.1', 'IPv4 mappee en IPv6'],
  ['::ffff:a9fe:a9fe', 'metadonnees cloud mappees en IPv6'],
  ['64:ff9b::7f00:1', 'NAT64'],
  ['2002:7f00:1::1', '6to4'],
  ['100.64.0.1', 'NAT de l operateur'],
  ['100.100.100.200', 'metadonnees cloud dans le NAT de l operateur'],
  ['198.18.0.1', 'banc de mesure'],
  ['255.255.255.255', 'diffusion'],
  ['not-an-ip', 'IP invalide'],
];

const PUBLIC_ADDRESSES: ReadonlyArray<[string, string]> = [
  ['8.8.8.8', 'resolveur public'],
  ['1.1.1.1', 'resolveur public'],
  ['::ffff:8.8.8.8', 'IPv4 publique mappee en IPv6'],
  ['2a00:1450:4007::1', 'IPv6 publique'],
];

const PRIVATE_LOOKUP_ADDRESS = '10.0.0.1';
const PUBLIC_LOOKUP_ADDRESS = '93.184.216.34';
/* eslint-enable sonarjs/no-hardcoded-ip */

describe('isBlockedIpAddress', () => {
  it.each(BLOCKED_ADDRESSES)('devrait bloquer %s (%s)', (ip) => {
    expect(isBlockedIpAddress(ip)).toBe(true);
  });

  it.each(PUBLIC_ADDRESSES)('devrait autoriser %s (%s)', (ip) => {
    expect(isBlockedIpAddress(ip)).toBe(false);
  });
});

describe('assertPublicHostname', () => {
  beforeEach(() => {
    mockedLookup.mockReset();
  });

  it('devrait rejeter localhost', async () => {
    await expect(assertPublicHostname('localhost')).rejects.toThrow(
      BadRequestException,
    );
    expect(mockedLookup).not.toHaveBeenCalled();
  });

  it('devrait rejeter metadata.google.internal', async () => {
    await expect(
      assertPublicHostname('metadata.google.internal'),
    ).rejects.toThrow(BadRequestException);
    expect(mockedLookup).not.toHaveBeenCalled();
  });

  it('devrait rejeter un hostname se terminant par .local', async () => {
    await expect(assertPublicHostname('myhost.local')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('devrait rejeter un hostname se terminant par .internal', async () => {
    await expect(assertPublicHostname('service.internal')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('devrait rejeter un hostname dont le DNS resout vers une IP privee', async () => {
    mockedLookup.mockResolvedValue([
      { address: PRIVATE_LOOKUP_ADDRESS, family: 4 },
    ]);

    await expect(assertPublicHostname('evil.example.com')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('devrait rejeter une IPv6 litterale mappee sur le loopback sans resolution', async () => {
    await expect(assertPublicHostname('[::ffff:7f00:1]')).rejects.toThrow(
      BadRequestException,
    );
    expect(mockedLookup).not.toHaveBeenCalled();
  });

  it('devrait accepter un hostname resolvant vers une IP publique', async () => {
    mockedLookup.mockResolvedValue([
      { address: PUBLIC_LOOKUP_ADDRESS, family: 4 },
    ]);

    await expect(assertPublicHostname('example.com')).resolves.toBeUndefined();
  });
});

describe('resoudreVersUneAdressePublique', () => {
  function resoudre(
    adresses: ReadonlyArray<{ address: string; family: number }>,
    toutes: boolean,
  ): Promise<unknown[]> {
    mockedResoudreParRappel.mockImplementation(
      (
        _hote: string,
        _options: unknown,
        rappel: (...args: unknown[]) => void,
      ) => rappel(null, adresses),
    );
    return new Promise((fin) =>
      resoudreVersUneAdressePublique(
        'cible.example',
        { all: toutes },
        (...args) => fin(args),
      ),
    );
  }

  beforeEach(() => {
    mockedResoudreParRappel.mockReset();
  });

  it('rend toutes les adresses publiques quand la connexion les demande toutes', async () => {
    const adresses = [{ address: PUBLIC_LOOKUP_ADDRESS, family: 4 }];

    await expect(resoudre(adresses, true)).resolves.toEqual([null, adresses]);
  });

  it('rend la premiere adresse publique quand la connexion en demande une', async () => {
    await expect(
      resoudre([{ address: PUBLIC_LOOKUP_ADDRESS, family: 4 }], false),
    ).resolves.toEqual([null, PUBLIC_LOOKUP_ADDRESS, 4]);
  });

  it('refuse la connexion des qu une adresse resolue est interne', async () => {
    const [erreur] = await resoudre(
      [
        { address: PUBLIC_LOOKUP_ADDRESS, family: 4 },
        { address: PRIVATE_LOOKUP_ADDRESS, family: 4 },
      ],
      true,
    );

    expect(erreur).toEqual(new Error('Target resolves to a blocked IP range.'));
  });
});

describe('assertSafeHttpUrl', () => {
  beforeEach(() => {
    mockedLookup.mockReset();
    mockedLookup.mockResolvedValue([
      { address: PUBLIC_LOOKUP_ADDRESS, family: 4 },
    ]);
  });

  it('devrait rejeter les URLs ftp://', async () => {
    const url = new URL('ftp://example.com/file');

    await expect(assertSafeHttpUrl(url)).rejects.toThrow(BadRequestException);
  });

  it('devrait rejeter les URLs avec credentials (user:pass@host)', async () => {
    const url = new URL('https://user:pass@example.com');

    await expect(assertSafeHttpUrl(url)).rejects.toThrow(BadRequestException);
  });

  it('devrait accepter https://example.com', async () => {
    const url = new URL('https://example.com');

    await expect(assertSafeHttpUrl(url)).resolves.toBeUndefined();
  });

  it('devrait accepter http://example.com', async () => {
    const url = new URL('http://example.com');

    await expect(assertSafeHttpUrl(url)).resolves.toBeUndefined();
  });
});
