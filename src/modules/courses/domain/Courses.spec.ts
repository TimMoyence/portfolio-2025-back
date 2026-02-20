import { DomainValidationError } from '../../../common/domain/errors/DomainValidationError';
import { Courses } from './Courses';

describe('Courses aggregate', () => {
  it('creates a course with normalized values', () => {
    const course = Courses.create({
      slug: '  AI-COURSE ',
      title: ' AI Course ',
      summary: ' A complete course to ship enterprise-grade AI products. ',
      coverImage: ' /images/ai-course.webp ',
    });

    expect(course.slug).toBe('ai-course');
    expect(course.title).toBe('AI Course');
    expect(course.summary).toBe(
      'A complete course to ship enterprise-grade AI products.',
    );
    expect(course.coverImage).toBe('/images/ai-course.webp');
  });

  it('throws for invalid slug', () => {
    expect(() =>
      Courses.create({
        slug: 'invalid slug',
        title: 'AI Course',
        summary: 'A complete course to ship enterprise-grade AI products.',
      }),
    ).toThrow(DomainValidationError);
  });
});
