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
});
