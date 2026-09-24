import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ChampsAntiRobotDto } from '../../../../common/interfaces/security/champs-anti-robot.dto';

export class JoinSessionRequestDto extends ChampsAntiRobotDto {
  @ApiProperty({ example: 'Theo' })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  prenom: string;

  @ApiProperty({ example: 'Martin' })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  nom: string;

  @ApiProperty({ example: 'theo.martin@example.com' })
  @IsEmail()
  @MaxLength(180)
  email: string;

  @ApiPropertyOptional({
    description:
      'Secret remis par la jonction precedente de ce poste ; exige pour reprendre une place deja prise',
  })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  secretDeReprise?: string;
}
