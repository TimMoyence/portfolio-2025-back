import { ApiProperty } from '@nestjs/swagger';
import { EstReglageNumerique } from './control-session.request.dto';

export class EvaluerMachineRequestDto {
  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'number' },
    description:
      'Reglages des curseurs de l eleve, par cle de parametre ; les autres gardent leur defaut',
    example: { tauxUn: 50, tauxDeux: -50 },
  })
  @EstReglageNumerique()
  reglages: Record<string, number>;
}
