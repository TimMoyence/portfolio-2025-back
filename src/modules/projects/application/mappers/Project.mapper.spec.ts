import { BadRequestException } from '@nestjs/common';
import { CreateProjectCommand } from '../dto/CreateProject.command';
import { ProjectMapper } from './Project.mapper';

describe('ProjectMapper', () => {
  const baseCommand: CreateProjectCommand = {
    slug: 'portfolio-site',
    type: 'SIDE',
    repoUrl: 'https://github.com/acme/portfolio',
    liveUrl: 'https://example.com',
    coverImage: '/images/portfolio.webp',
    gallery: ['/images/1.webp', '/images/2.webp'],
    stack: ['nestjs', 'postgres'],
    status: 'PUBLISHED',
    order: 1,
  };

  it('maps and normalizes project payload', () => {
    const mapped = ProjectMapper.fromCreateCommand({
      ...baseCommand,
      slug: '  PORTFOLIO-SITE ',
      stack: [' nestjs ', 'postgres', 'postgres'],
    });

    expect(mapped.slug).toBe('portfolio-site');
    expect(mapped.stack).toEqual(['nestjs', 'postgres']);
  });

  it('throws bad request for invalid repo URL', () => {
    expect(() =>
      ProjectMapper.fromCreateCommand({
        ...baseCommand,
        repoUrl: 'invalid-url',
      }),
    ).toThrow(BadRequestException);
  });
});
