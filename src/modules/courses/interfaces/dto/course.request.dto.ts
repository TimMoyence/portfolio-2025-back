import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CourseRequestDto {
  @ApiProperty({ example: 'ai-course' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  slug: string;

  @ApiProperty({ example: 'AI Course' })
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  title: string;

  @ApiProperty({ example: 'A premium course for practical AI delivery.' })
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  summary: string;

  @ApiProperty({ example: '/images/ai-course.webp', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  coverImage?: string;
}
