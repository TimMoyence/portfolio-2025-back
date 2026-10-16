import { ApiProperty } from '@nestjs/swagger';
import type { AuditLocale } from '../../domain/audit-locale.util';
import { IsIn } from 'class-validator';
import { LocaleSupportee } from '../../../../common/interfaces/dto/locale-supportee.decorator';
import { TexteSaisi } from '../../../../common/interfaces/dto/longueur-de-texte.decorator';
import { ChampsAntiRobotDto } from '../../../../common/interfaces/security/champs-anti-robot.dto';

export class AuditRequestRequestDto extends ChampsAntiRobotDto {
  @ApiProperty({ example: 'Example Studio' })
  @TexteSaisi(2, 200)
  websiteName: string;

  @ApiProperty({ example: 'EMAIL', enum: ['EMAIL', 'PHONE'] })
  @IsIn(['EMAIL', 'PHONE'])
  contactMethod: 'EMAIL' | 'PHONE';

  @ApiProperty({ example: 'hello@example.com' })
  @TexteSaisi(6, 200)
  contactValue: string;

  @LocaleSupportee({ facultative: true })
  locale?: AuditLocale;
}
