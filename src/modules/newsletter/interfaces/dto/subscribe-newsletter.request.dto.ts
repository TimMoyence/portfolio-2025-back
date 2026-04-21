import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { SUPPORTED_FORMATION_SLUGS } from '../../domain/SupportedFormationSlugs';

/** DTO d'entree de l'endpoint `POST /newsletter/subscribe`. */
export class SubscribeNewsletterRequestDto {
  @ApiProperty({ example: 'marie@example.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: 'Marie' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  firstName?: string;

  @ApiProperty({ example: 'fr' })
  @IsString()
  @Matches(/^[a-z]{2,3}(-[A-Z]{2})?$/)
  @MaxLength(10)
  locale: string;

  @ApiProperty({
    example: 'ia-solopreneurs',
    enum: SUPPORTED_FORMATION_SLUGS,
  })
  @IsString()
  @IsIn(SUPPORTED_FORMATION_SLUGS as unknown as readonly string[])
  @MaxLength(100)
  sourceFormationSlug: string;

  @ApiProperty({ example: '2026-04-10' })
  @IsString()
  @MaxLength(50)
  termsVersion: string;

  @ApiProperty({ example: '2026-04-10T10:00:00.000Z' })
  @Type(() => Date)
  @IsDate()
  termsAcceptedAt: Date;
}
