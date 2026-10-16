import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { SlugDeContenu } from '../../../../common/interfaces/dto/champs-de-contenu.decorator';
import {
  AuPlusCaracteres,
  Rogne,
  TexteSaisi,
} from '../../../../common/interfaces/dto/longueur-de-texte.decorator';

export class CourseRequestDto {
  @SlugDeContenu('ai-course')
  slug: string;

  @ApiProperty({ example: 'AI Course' })
  @TexteSaisi(2, 160)
  title: string;

  @ApiProperty({ example: 'A premium course for practical AI delivery.' })
  @TexteSaisi(10, 2000)
  summary: string;

  @ApiProperty({ example: '/images/ai-course.webp', required: false })
  @IsOptional()
  @Rogne()
  @IsString()
  @AuPlusCaracteres(500)
  coverImage?: string;
}
