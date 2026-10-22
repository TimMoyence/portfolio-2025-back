import { BadRequestException } from '@nestjs/common';
import { lookup } from 'dns/promises';
import { DomainValidationError } from '../../../../common/domain/errors/DomainValidationError';
import { normalizeAuditUrl } from './url-normalizer.util';

jest.mock('dns/promises', () => ({
  lookup: jest.fn(),
}));

describe('normalizeAuditUrl', () => {
  const mockedLookup = lookup as unknown as jest.Mock;

  beforeEach(() => {
    mockedLookup.mockReset();
    // eslint-disable-next-line sonarjs/no-hardcoded-ip -- fixture : adresse publique renvoyee par le lookup DNS mocke
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

  it('rejects localhost and URLs with credentials, as AuditRequest.create does', async () => {
    await expect(normalizeAuditUrl('http://localhost:3000')).rejects.toThrow(
      DomainValidationError,
    );
    await expect(
      normalizeAuditUrl('https://user:pass@example.com'),
    ).rejects.toThrow(DomainValidationError);
  });

  it('rejects private hostnames that only the network can tell apart', async () => {
    await expect(normalizeAuditUrl('https://nas.local')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rejects blocked resolved IP ranges', async () => {
    mockedLookup.mockResolvedValue([{ address: '127.0.0.1', family: 4 }]);
    await expect(normalizeAuditUrl('https://example.com')).rejects.toThrow(
      BadRequestException,
    );
  });
});
