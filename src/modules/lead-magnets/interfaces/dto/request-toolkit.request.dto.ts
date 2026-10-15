import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import {
  AcceptationDesConditions,
  VersionDesConditions,
} from '../../../../common/interfaces/dto/conditions-acceptees.decorator';
import type { SupportedLocale } from '../../../../common/domain/value-objects/LocaleCode';
import { LocaleSupportee } from '../../../../common/interfaces/dto/locale-supportee.decorator';
import { ChampsAntiRobotDto } from '../../../../common/interfaces/security/champs-anti-robot.dto';
import { InteractionProfileDto } from './interaction-profile.dto';

export class RequestToolkitRequestDto extends ChampsAntiRobotDto {
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

  @VersionDesConditions()
  termsVersion: string;

  @LocaleSupportee()
  termsLocale: SupportedLocale;

  @AcceptationDesConditions()
  termsAcceptedAt: Date;

  @ApiPropertyOptional({ type: InteractionProfileDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => InteractionProfileDto)
  profile?: InteractionProfileDto;
}
