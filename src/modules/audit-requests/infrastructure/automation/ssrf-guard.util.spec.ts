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

describe('isBlockedIpAddress', () => {
  it('devrait bloquer 127.0.0.1 (loopback)', () => {
    expect(isBlockedIpAddress('127.0.0.1')).toBe(true);
  });

  it('devrait bloquer 10.0.0.1 (prive)', () => {
    expect(isBlockedIpAddress('10.0.0.1')).toBe(true);
  });

  it('devrait bloquer 192.168.1.1 (prive)', () => {
    expect(isBlockedIpAddress('192.168.1.1')).toBe(true);
  });

  it('devrait bloquer 172.16.0.1 (prive)', () => {
    expect(isBlockedIpAddress('172.16.0.1')).toBe(true);
  });

  it('devrait bloquer 169.254.1.1 (link-local)', () => {
    expect(isBlockedIpAddress('169.254.1.1')).toBe(true);
  });

  it('devrait bloquer 224.0.0.1 (multicast)', () => {
    expect(isBlockedIpAddress('224.0.0.1')).toBe(true);
  });

  it('devrait bloquer 0.0.0.0', () => {
    expect(isBlockedIpAddress('0.0.0.0')).toBe(true);
  });

  it('devrait bloquer ::1 (IPv6 loopback)', () => {
    expect(isBlockedIpAddress('::1')).toBe(true);
  });

  it('devrait bloquer fe80::1 (IPv6 link-local)', () => {
    expect(isBlockedIpAddress('fe80::1')).toBe(true);
  });

  it('devrait autoriser 8.8.8.8 (public)', () => {
    expect(isBlockedIpAddress('8.8.8.8')).toBe(false);
  });

  it('devrait autoriser 1.1.1.1 (public)', () => {
    expect(isBlockedIpAddress('1.1.1.1')).toBe(false);
  });

  it('devrait bloquer une IP invalide', () => {
    expect(isBlockedIpAddress('not-an-ip')).toBe(true);
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
    mockedLookup.mockResolvedValue([{ address: '10.0.0.1', family: 4 }]);

    await expect(assertPublicHostname('evil.example.com')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('devrait accepter un hostname resolvant vers une IP publique', async () => {
    mockedLookup.mockResolvedValue([{ address: '93.184.216.34', family: 4 }]);

    await expect(assertPublicHostname('example.com')).resolves.toBeUndefined();
  });
});

describe('assertSafeHttpUrl', () => {
  beforeEach(() => {
    mockedLookup.mockReset();
    mockedLookup.mockResolvedValue([{ address: '93.184.216.34', family: 4 }]);
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
