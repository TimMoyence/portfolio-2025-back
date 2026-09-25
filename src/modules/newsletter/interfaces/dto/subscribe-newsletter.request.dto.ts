import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  AcceptationDesConditions,
  VersionDesConditions,
} from '../../../../common/interfaces/dto/conditions-acceptees.decorator';
import { ChampsAntiRobotDto } from '../../../../common/interfaces/security/champs-anti-robot.dto';
import { SUPPORTED_FORMATION_SLUGS } from '../../domain/SupportedFormationSlugs';

export class SubscribeNewsletterRequestDto extends ChampsAntiRobotDto {
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

  @VersionDesConditions()
  termsVersion: string;

  @AcceptationDesConditions()
  termsAcceptedAt: Date;
}
