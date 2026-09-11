import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { AuditLocale } from '../../domain/audit-locale.util';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MaxLength,
  MinLength,
} from 'class-validator';

export class AuditRequestRequestDto {
  @ApiPropertyOptional({
    description: 'Champ piège anti-robot, doit rester vide',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  website?: string;

  @ApiPropertyOptional({
    description: "Timestamp ms d'ouverture du formulaire",
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  formStartedAt?: number;

  @ApiProperty({ example: 'Example Studio' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  websiteName: string;

  @ApiProperty({ example: 'EMAIL', enum: ['EMAIL', 'PHONE'] })
  @IsIn(['EMAIL', 'PHONE'])
  contactMethod: 'EMAIL' | 'PHONE';

  @ApiProperty({ example: 'hello@example.com' })
  @IsString()
  @MinLength(6)
  @MaxLength(200)
  contactValue: string;

  @ApiProperty({ example: 'fr', required: false })
  @IsOptional()
  @IsIn(['fr', 'en'])
  locale?: AuditLocale;
}
