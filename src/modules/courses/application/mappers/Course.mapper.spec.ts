import { BadRequestException } from '@nestjs/common';
import { CreateCourseCommand } from '../dto/CreateCourse.command';
import { CourseMapper } from './Course.mapper';

describe('CourseMapper', () => {
  const baseCommand: CreateCourseCommand = {
    slug: 'ai-course',
    title: 'AI Course',
    summary: 'A premium course designed for growth and automation.',
    coverImage: '/images/ai-course.webp',
  };

  it('normalizes slug and trims fields', () => {
    const mapped = CourseMapper.fromCreateCommand({
      ...baseCommand,
      slug: '  AI-COURSE ',
      title: ' AI Course ',
    });

    expect(mapped.slug).toBe('ai-course');
    expect(mapped.title).toBe('AI Course');
  });

  it('throws bad request on invalid summary', () => {
    expect(() =>
      CourseMapper.fromCreateCommand({
        ...baseCommand,
        summary: 'short',
      }),
    ).toThrow(BadRequestException);
  });
});
