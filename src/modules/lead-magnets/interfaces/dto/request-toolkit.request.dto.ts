import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { InteractionProfileDto } from './interaction-profile.dto';

export class RequestToolkitRequestDto {
  @ApiProperty({ example: 'Marie' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  firstName: string;

  @ApiProperty({ example: 'marie@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'ia-solopreneurs' })
  @IsString()
  @IsIn(['ia-solopreneurs'])
  formationSlug: string;

  @ApiProperty({ example: '2026-04-10' })
  @IsString()
  @MaxLength(50)
  termsVersion: string;

  @ApiProperty({ example: 'fr' })
  @IsString()
  @MaxLength(10)
  termsLocale: string;

  @ApiProperty({ example: '2026-04-10T10:00:00.000Z' })
  @Type(() => Date)
  @IsDate()
  termsAcceptedAt: Date;

  @ApiPropertyOptional({ type: InteractionProfileDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => InteractionProfileDto)
  profile?: InteractionProfileDto;
}
