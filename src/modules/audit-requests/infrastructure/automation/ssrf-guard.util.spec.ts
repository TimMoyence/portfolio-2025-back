import { BadRequestException } from '@nestjs/common';
import { lookup } from 'dns/promises';
import {
  isBlockedIpAddress,
  assertPublicHostname,
  assertSafeHttpUrl,
} from './ssrf-guard.util';

jest.mock('dns/promises', () => ({
  lookup: jest.fn(),
}));

const mockedLookup = lookup as unknown as jest.Mock;

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
  ['not-an-ip', 'IP invalide'],
];

const PUBLIC_ADDRESSES: ReadonlyArray<[string, string]> = [
  ['8.8.8.8', 'resolveur public'],
  ['1.1.1.1', 'resolveur public'],
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

  it('devrait accepter un hostname resolvant vers une IP publique', async () => {
    mockedLookup.mockResolvedValue([
      { address: PUBLIC_LOOKUP_ADDRESS, family: 4 },
    ]);

    await expect(assertPublicHostname('example.com')).resolves.toBeUndefined();
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
