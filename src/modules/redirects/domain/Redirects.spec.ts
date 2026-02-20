import { DomainValidationError } from '../../../common/domain/errors/DomainValidationError';
import { Redirects } from './Redirects';

describe('Redirects aggregate', () => {
  it('creates redirect with normalized values', () => {
    const redirect = Redirects.create({
      slug: '  PROMO-OFFER ',
      targetUrl: 'https://example.com/promo',
      enabled: true,
      clicks: 5,
    });

    expect(redirect.slug).toBe('promo-offer');
    expect(redirect.enabled).toBe(true);
    expect(redirect.clicks).toBe(5);
  });

  it('throws for invalid clicks', () => {
    expect(() =>
      Redirects.create({
        slug: 'promo-offer',
        targetUrl: 'https://example.com/promo',
        clicks: -1,
      }),
    ).toThrow(DomainValidationError);
  });
});
