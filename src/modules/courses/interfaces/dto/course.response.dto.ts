import { ApiProperty } from '@nestjs/swagger';
import { Courses } from '../../domain/Courses';

export class CourseResponseDto {
  @ApiProperty({ example: 'f71914f4-f68d-4be9-90cb-d6ce6b5fcd89' })
  id: string;

  @ApiProperty({ example: 'ai-course' })
  slug: string;

  @ApiProperty({ example: 'AI Course' })
  title: string;

  @ApiProperty({ example: 'A premium course for practical AI delivery.' })
  summary: string;

  @ApiProperty({ example: '/images/ai-course.webp', required: false })
  coverImage?: string;

  static fromDomain(domain: Courses): CourseResponseDto {
    const dto = new CourseResponseDto();
    dto.id = domain.id ?? '';
    dto.slug = domain.slug;
    dto.title = domain.title;
    dto.summary = domain.summary;
    dto.coverImage = domain.coverImage;
    return dto;
  }
}
