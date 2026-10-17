import { ApiProperty } from '@nestjs/swagger';
import { Motif } from '../../../../common/interfaces/dto/bornes-annoncees.decorator';
import { TexteBorne } from '../../../../common/interfaces/dto/longueur-de-texte.decorator';

export class OpenSessionRequestDto {
  @ApiProperty({ example: 'b2-01-traitement-information-chiffree' })
  @TexteBorne(1, 120)
  @Motif(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  courseSlug: string;
}
