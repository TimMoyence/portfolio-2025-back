import { BadRequestException } from '@nestjs/common';
import { lookup } from 'dns/promises';
import { normalizeAuditUrl } from './url-normalizer.util';

jest.mock('dns/promises', () => ({
  lookup: jest.fn(),
}));

describe('normalizeAuditUrl', () => {
  const mockedLookup = lookup as unknown as jest.Mock;

  beforeEach(() => {
    mockedLookup.mockReset();
    mockedLookup.mockResolvedValue([{ address: '93.184.216.34', family: 4 }]);
  });

  it('adds https:// when missing', async () => {
    const result = await normalizeAuditUrl('example.com');

    expect(result.normalizedUrl).toBe('https://example.com/');
    expect(result.hostname).toBe('example.com');
  });

  it('keeps valid explicit protocol', async () => {
    const result = await normalizeAuditUrl('https://example.com/path?a=1#hash');
    expect(result.normalizedUrl).toBe('https://example.com/path?a=1');
  });

  it('rejects localhost and private hostnames', async () => {
    await expect(normalizeAuditUrl('http://localhost:3000')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rejects URLs with credentials', async () => {
    await expect(
      normalizeAuditUrl('https://user:pass@example.com'),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects blocked resolved IP ranges', async () => {
    mockedLookup.mockResolvedValue([{ address: '127.0.0.1', family: 4 }]);
    await expect(normalizeAuditUrl('https://example.com')).rejects.toThrow(
      BadRequestException,
    );
  });
});
