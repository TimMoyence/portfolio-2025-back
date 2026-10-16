import { ApiProperty } from '@nestjs/swagger';
import { VerdictDeReponse } from './verdict-de-reponse.decorator';

export class SubmitAnswerResponseDto {
  @VerdictDeReponse()
  correcte: boolean | null;

  @ApiProperty({
    type: String,
    description:
      'Etiquette de la confusion detectee, jamais la reponse attendue',
    example: 'interet-simple',
    nullable: true,
  })
  misconception: string | null;

  @ApiProperty({
    type: String,
    description: 'Libelle humain de la confusion detectee',
    example: 'Confondre le taux et la valeur en pourcentage',
    nullable: true,
  })
  libelleConfusion: string | null;
}
