import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';
import type { PublishableStatus } from '../../../../common/domain/types/publishable-status';
import {
  RangDAffichage,
  SlugDeContenu,
  StatutDePublication,
} from '../../../../common/interfaces/dto/champs-de-contenu.decorator';

const PROJECT_TYPES = ['CLIENT', 'SIDE'] as const;
type ProjectTypeValue = (typeof PROJECT_TYPES)[number];

export class ProjectRequestDto {
  @SlugDeContenu('portfolio-site')
  slug: string;

  @ApiProperty({ example: 'SIDE', required: false, enum: PROJECT_TYPES })
  @IsOptional()
  @IsString()
  @IsIn(PROJECT_TYPES)
  type?: ProjectTypeValue;

  @ApiProperty({
    example: 'https://github.com/acme/portfolio',
    required: false,
  })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  repoUrl?: string;

  @ApiProperty({ example: 'https://example.com', required: false })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  liveUrl?: string;

  @ApiProperty({ example: '/images/portfolio.webp', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  coverImage?: string;

  @ApiProperty({
    example: ['/images/portfolio-1.webp', '/images/portfolio-2.webp'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(500, { each: true })
  gallery?: string[];

  @ApiProperty({ example: ['nestjs', 'postgres'], required: false })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  stack?: string[];

  @StatutDePublication()
  status?: PublishableStatus;

  @RangDAffichage()
  order?: number;
}
