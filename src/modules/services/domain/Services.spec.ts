import { DomainValidationError } from '../../../common/domain/errors/DomainValidationError';
import { Services } from './Services';

describe('Services aggregate', () => {
  it('creates a service with normalized values', () => {
    const service = Services.create({
      slug: '  TECHNICAL-SEO ',
      name: ' Technical SEO ',
      icon: '  /icons/seo.svg ',
      status: 'PUBLISHED',
      order: 3,
    });

    expect(service.slug).toBe('technical-seo');
    expect(service.name).toBe('Technical SEO');
    expect(service.icon).toBe('/icons/seo.svg');
    expect(service.status).toBe('PUBLISHED');
    expect(service.order).toBe(3);
  });

  it('throws for invalid status', () => {
    expect(() =>
      Services.create({
        slug: 'technical-seo',
        name: 'Technical SEO',
        status: 'UNKNOWN' as never,
      }),
    ).toThrow(DomainValidationError);
  });
});
