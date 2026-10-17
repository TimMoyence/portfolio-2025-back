import { ApiProperty } from '@nestjs/swagger';
import { TexteBorne } from '../../../../../common/interfaces/dto/longueur-de-texte.decorator';
import { DureeDeReponse } from '../duree-de-reponse.decorator';

export class TenterEnigmeRequestDto {
  @ApiProperty({ example: 'enigme-1' })
  @TexteBorne(1, 60)
  enigmeId: string;

  @ApiProperty({
    description:
      'Saisie brute, lue par lireNombreSaisiAvecUnite pour une solution chiffree',
    example: '142 920',
  })
  @TexteBorne(1, 40)
  reponse: string;

  @DureeDeReponse(42000)
  dureeMs: number;
}
