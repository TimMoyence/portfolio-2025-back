import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsIn, IsOptional, IsString } from 'class-validator';
import type { PublishableStatus } from '../../../../common/domain/types/publishable-status';
import {
  AuPlusElements,
  UrlAbsolue,
} from '../../../../common/interfaces/dto/bornes-annoncees.decorator';
import {
  RangDAffichage,
  SlugDeContenu,
  StatutDePublication,
} from '../../../../common/interfaces/dto/champs-de-contenu.decorator';
import {
  AuMoinsCaracteres,
  AuPlusCaracteres,
  Rogne,
} from '../../../../common/interfaces/dto/longueur-de-texte.decorator';

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
  @UrlAbsolue()
  repoUrl?: string;

  @ApiProperty({ example: 'https://example.com', required: false })
  @IsOptional()
  @UrlAbsolue()
  liveUrl?: string;

  @ApiProperty({ example: '/images/portfolio.webp', required: false })
  @IsOptional()
  @Rogne()
  @IsString()
  @AuPlusCaracteres(500)
  coverImage?: string;

  @ApiProperty({
    example: ['/images/portfolio-1.webp', '/images/portfolio-2.webp'],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @AuPlusElements(20)
  @Rogne()
  @IsString({ each: true })
  @AuMoinsCaracteres(1, { each: true })
  @AuPlusCaracteres(500, { each: true })
  gallery?: string[];

  @ApiProperty({
    example: ['nestjs', 'postgres'],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @AuPlusElements(30)
  @Rogne()
  @IsString({ each: true })
  @AuMoinsCaracteres(1, { each: true })
  @AuPlusCaracteres(50, { each: true })
  stack?: string[];

  @StatutDePublication()
  status?: PublishableStatus;

  @RangDAffichage()
  order?: number;
}
