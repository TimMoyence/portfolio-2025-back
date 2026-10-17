import { ApiProperty } from '@nestjs/swagger';
import { TexteBorne } from '../../../../common/interfaces/dto/longueur-de-texte.decorator';

export class SaveTeacherAnnotationRequestDto {
  @ApiProperty({ example: 'B2-01-S11-REFLECTION' })
  @TexteBorne(1, 120)
  screenId: string;

  @ApiProperty({ example: 'Faire expliciter la base de comparaison.' })
  @TexteBorne(1, 10000)
  note: string;
}
