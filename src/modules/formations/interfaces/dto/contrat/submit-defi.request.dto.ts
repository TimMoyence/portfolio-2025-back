import { ApiProperty } from '@nestjs/swagger';
import { TexteBorne } from '../../../../../common/interfaces/dto/longueur-de-texte.decorator';
import { DureeDeReponse } from '../duree-de-reponse.decorator';

export class SubmitDefiRequestDto {
  @ApiProperty({
    description: 'Tentative du participant, la premiere envoyee est figee',
    example: 'Multiplier les coefficients de chaque revision.',
  })
  @TexteBorne(1, 2000)
  texte: string;

  @DureeDeReponse(180000)
  dureeMs: number;
}
