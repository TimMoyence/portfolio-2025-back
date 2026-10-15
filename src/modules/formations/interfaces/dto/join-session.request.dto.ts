import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { AdresseEmail } from '../../../../common/interfaces/dto/adresse-email.decorator';
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
  @AdresseEmail()
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
