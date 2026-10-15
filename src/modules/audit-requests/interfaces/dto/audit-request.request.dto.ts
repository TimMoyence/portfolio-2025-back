import { ApiProperty } from '@nestjs/swagger';
import type { AuditLocale } from '../../domain/audit-locale.util';
import { IsIn, IsString, MaxLength, MinLength } from 'class-validator';
import { LocaleSupportee } from '../../../../common/interfaces/dto/locale-supportee.decorator';
import { ChampsAntiRobotDto } from '../../../../common/interfaces/security/champs-anti-robot.dto';

export class AuditRequestRequestDto extends ChampsAntiRobotDto {
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

  @LocaleSupportee({ facultative: true })
  locale?: AuditLocale;
}
