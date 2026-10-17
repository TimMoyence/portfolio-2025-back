import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';
import type { SupportedLocale } from '../../../../common/domain/value-objects/LocaleCode';
import { EntierBorne } from '../../../../common/interfaces/dto/bornes-annoncees.decorator';
import { LocaleSupportee } from '../../../../common/interfaces/dto/locale-supportee.decorator';

export class ArticleListQueryDto {
  @LocaleSupportee({ facultative: true, parDefaut: 'fr' })
  locale: SupportedLocale = 'fr';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tag?: string;

  @ApiPropertyOptional({ description: 'Curseur opaque' })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({ default: 12 })
  @IsOptional()
  @Type(() => Number)
  @EntierBorne(1, 24)
  limit = 12;
}
