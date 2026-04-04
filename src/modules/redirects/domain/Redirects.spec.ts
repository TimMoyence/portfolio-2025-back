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

  // --- requireUrl branches ---

  it('devrait refuser une targetUrl non-string', () => {
    expect(() =>
      Redirects.create({
        slug: 'test',
        targetUrl: 42 as unknown as string,
      }),
    ).toThrow(DomainValidationError);
  });

  it('devrait refuser une targetUrl vide', () => {
    expect(() => Redirects.create({ slug: 'test', targetUrl: '' })).toThrow(
      DomainValidationError,
    );
  });

  it('devrait refuser une targetUrl trop longue', () => {
    expect(() =>
      Redirects.create({
        slug: 'test',
        targetUrl: 'https://example.com/' + 'a'.repeat(1000),
      }),
    ).toThrow(DomainValidationError);
  });

  it('devrait refuser une URL invalide', () => {
    expect(() =>
      Redirects.create({ slug: 'test', targetUrl: 'not-a-url' }),
    ).toThrow(DomainValidationError);
  });

  it('devrait refuser un protocole non http/https', () => {
    expect(() =>
      Redirects.create({ slug: 'test', targetUrl: 'ftp://example.com/file' }),
    ).toThrow(DomainValidationError);
  });

  // --- resolveEnabled branches ---

  it('devrait defaulter enabled a true', () => {
    const redirect = Redirects.create({
      slug: 'test',
      targetUrl: 'https://example.com',
    });
    expect(redirect.enabled).toBe(true);
  });

  it('devrait accepter enabled = false', () => {
    const redirect = Redirects.create({
      slug: 'test',
      targetUrl: 'https://example.com',
      enabled: false,
    });
    expect(redirect.enabled).toBe(false);
  });

  it('devrait refuser enabled non-boolean', () => {
    expect(() =>
      Redirects.create({
        slug: 'test',
        targetUrl: 'https://example.com',
        enabled: 'oui' as unknown as boolean,
      }),
    ).toThrow(DomainValidationError);
  });

  // --- resolveClicks branches ---

  it('devrait defaulter clicks a 0', () => {
    const redirect = Redirects.create({
      slug: 'test',
      targetUrl: 'https://example.com',
    });
    expect(redirect.clicks).toBe(0);
  });

  it('devrait refuser des clicks non entiers', () => {
    expect(() =>
      Redirects.create({
        slug: 'test',
        targetUrl: 'https://example.com',
        clicks: 1.5,
      }),
    ).toThrow(DomainValidationError);
  });

  it('devrait refuser des clicks au dessus du max', () => {
    expect(() =>
      Redirects.create({
        slug: 'test',
        targetUrl: 'https://example.com',
        clicks: 1000000001,
      }),
    ).toThrow(DomainValidationError);
  });
});
