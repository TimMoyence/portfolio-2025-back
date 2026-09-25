import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import type { PublishableStatus } from '../../../../common/domain/types/publishable-status';
import {
  RangDAffichage,
  SlugDeContenu,
  StatutDePublication,
} from '../../../../common/interfaces/dto/champs-de-contenu.decorator';

export class ServiceRequestDto {
  @SlugDeContenu('technical-seo')
  slug: string;

  @ApiProperty({ example: 'Technical SEO' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name: string;

  @ApiProperty({ example: '/icons/seo.svg', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  icon?: string;

  @StatutDePublication()
  status?: PublishableStatus;

  @RangDAffichage()
  order?: number;
}
