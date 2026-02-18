import { ApiProperty } from '@nestjs/swagger';
import type { AuditLocale } from '../../domain/audit-locale.util';
import {
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class AuditRequestDto {
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
