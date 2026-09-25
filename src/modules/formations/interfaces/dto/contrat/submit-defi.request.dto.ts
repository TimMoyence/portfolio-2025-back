import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { DureeDeReponse } from '../duree-de-reponse.decorator';

export class SubmitDefiRequestDto {
  @ApiProperty({
    description: 'Tentative du participant, la premiere envoyee est figee',
    example: 'Multiplier les coefficients de chaque revision.',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  texte: string;

  @DureeDeReponse(180000)
  dureeMs: number;
}
