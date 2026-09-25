import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { SlugDeContenu } from '../../../../common/interfaces/dto/champs-de-contenu.decorator';

export class CourseRequestDto {
  @SlugDeContenu('ai-course')
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
