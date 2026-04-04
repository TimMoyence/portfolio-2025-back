import { DomainValidationError } from '../../../common/domain/errors/DomainValidationError';
import { Projects } from './Projects';

describe('Projects aggregate', () => {
  it('creates project with normalized values', () => {
    const project = Projects.create({
      slug: '  PORTFOLIO-SITE ',
      type: 'SIDE',
      repoUrl: 'https://github.com/acme/portfolio',
      liveUrl: 'https://example.com',
      coverImage: ' /images/portfolio.webp ',
      gallery: ['/images/1.webp', '/images/2.webp'],
      stack: [' nestjs ', 'postgres', 'postgres'],
      status: 'PUBLISHED',
      order: 4,
    });

    expect(project.slug).toBe('portfolio-site');
    expect(project.coverImage).toBe('/images/portfolio.webp');
    expect(project.stack).toEqual(['nestjs', 'postgres']);
    expect(project.order).toBe(4);
  });

  it('throws for invalid URL', () => {
    expect(() =>
      Projects.create({
        slug: 'portfolio-site',
        repoUrl: 'invalid-url',
      }),
    ).toThrow(DomainValidationError);
  });

  // --- Type resolution ---

  it('devrait defaulter le type a SIDE quand non fourni', () => {
    const project = Projects.create({ slug: 'test-project' });
    expect(project.type).toBe('SIDE');
  });

  it('devrait accepter CLIENT comme type', () => {
    const project = Projects.create({ slug: 'test-project', type: 'CLIENT' });
    expect(project.type).toBe('CLIENT');
  });

  it('devrait refuser un type invalide', () => {
    expect(() =>
      Projects.create({ slug: 'test-project', type: 'INVALID' as 'SIDE' }),
    ).toThrow(DomainValidationError);
  });

  // --- optionalUrl branches ---

  it('devrait accepter undefined pour repoUrl et liveUrl', () => {
    const project = Projects.create({ slug: 'test-project' });
    expect(project.repoUrl).toBeUndefined();
    expect(project.liveUrl).toBeUndefined();
  });

  it('devrait accepter null pour repoUrl', () => {
    const project = Projects.create({
      slug: 'test-project',
      repoUrl: null as unknown as string,
    });
    expect(project.repoUrl).toBeUndefined();
  });

  it('devrait retourner undefined pour une URL vide', () => {
    const project = Projects.create({ slug: 'test-project', repoUrl: '  ' });
    expect(project.repoUrl).toBeUndefined();
  });

  it('devrait refuser une URL non-string', () => {
    expect(() =>
      Projects.create({
        slug: 'test-project',
        repoUrl: 42 as unknown as string,
      }),
    ).toThrow(DomainValidationError);
  });

  it('devrait refuser une URL trop longue', () => {
    expect(() =>
      Projects.create({
        slug: 'test-project',
        repoUrl: 'https://example.com/' + 'a'.repeat(1000),
      }),
    ).toThrow(DomainValidationError);
  });

  it('devrait refuser une URL avec un protocole non http/https', () => {
    expect(() =>
      Projects.create({ slug: 'test-project', repoUrl: 'ftp://example.com' }),
    ).toThrow(DomainValidationError);
  });

  // --- optionalStringArray branches ---

  it('devrait retourner un tableau vide pour gallery null/undefined', () => {
    const project = Projects.create({ slug: 'test-project' });
    expect(project.gallery).toEqual([]);
  });

  it('devrait refuser un gallery non-array', () => {
    expect(() =>
      Projects.create({
        slug: 'test-project',
        gallery: 'not-array' as unknown as string[],
      }),
    ).toThrow(DomainValidationError);
  });

  it('devrait refuser un gallery avec trop d elements', () => {
    const tooMany = Array.from({ length: 21 }, (_, i) => `/img/${i}.webp`);
    expect(() =>
      Projects.create({ slug: 'test-project', gallery: tooMany }),
    ).toThrow(DomainValidationError);
  });

  it('devrait refuser un element non-string dans le gallery', () => {
    expect(() =>
      Projects.create({
        slug: 'test-project',
        gallery: [42 as unknown as string],
      }),
    ).toThrow(DomainValidationError);
  });

  it('devrait refuser un element vide dans le gallery', () => {
    expect(() =>
      Projects.create({ slug: 'test-project', gallery: [''] }),
    ).toThrow(DomainValidationError);
  });

  it('devrait refuser un element trop long dans le gallery', () => {
    expect(() =>
      Projects.create({
        slug: 'test-project',
        gallery: ['a'.repeat(501)],
      }),
    ).toThrow(DomainValidationError);
  });

  it('devrait dedupliquer les elements du stack', () => {
    const project = Projects.create({
      slug: 'test-project',
      stack: ['angular', 'angular', 'nestjs'],
    });
    expect(project.stack).toEqual(['angular', 'nestjs']);
  });

  // --- Defaults ---

  it('devrait defaulter le status a PUBLISHED et order a 0', () => {
    const project = Projects.create({ slug: 'test-project' });
    expect(project.status).toBe('PUBLISHED');
    expect(project.order).toBe(0);
  });
});
