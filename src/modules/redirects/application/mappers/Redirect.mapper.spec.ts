import { BadRequestException } from '@nestjs/common';
import { CreateRedirectCommand } from '../dto/CreateRedirect.command';
import { RedirectMapper } from './Redirect.mapper';

describe('RedirectMapper', () => {
  const baseCommand: CreateRedirectCommand = {
    slug: 'promo-offer',
    targetUrl: 'https://example.com/promo',
    enabled: true,
    clicks: 2,
  };

  it('normalizes slug and validates URL', () => {
    const mapped = RedirectMapper.fromCreateCommand({
      ...baseCommand,
      slug: '  PROMO-OFFER ',
    });

    expect(mapped.slug).toBe('promo-offer');
    expect(mapped.targetUrl).toBe('https://example.com/promo');
  });

  it('throws bad request on invalid URL', () => {
    expect(() =>
      RedirectMapper.fromCreateCommand({
        ...baseCommand,
        targetUrl: 'invalid-url',
      }),
    ).toThrow(BadRequestException);
  });
});
