import { BadRequestException } from '@nestjs/common';
import { CreateServiceCommand } from '../dto/CreateService.command';
import { ServiceMapper } from './Service.mapper';

describe('ServiceMapper', () => {
  const baseCommand: CreateServiceCommand = {
    slug: 'technical-seo',
    name: 'Technical SEO',
    status: 'PUBLISHED',
    order: 2,
  };

  it('normalizes slug and trims text fields', () => {
    const mapped = ServiceMapper.fromCreateCommand({
      ...baseCommand,
      slug: '  TECHNICAL-SEO  ',
      name: ' Technical SEO ',
    });

    expect(mapped.slug).toBe('technical-seo');
    expect(mapped.name).toBe('Technical SEO');
  });

  it('throws bad request when slug is invalid', () => {
    expect(() =>
      ServiceMapper.fromCreateCommand({
        ...baseCommand,
        slug: 'invalid slug',
      }),
    ).toThrow(BadRequestException);
  });
});
