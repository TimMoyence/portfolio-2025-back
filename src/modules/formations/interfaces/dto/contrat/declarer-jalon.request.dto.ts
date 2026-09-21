import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import type { EtatPulse } from '../../../domain/contrats/pilotage';
import { ETATS_PULSE } from '../../../domain/contrats/pilotage';

export class DeclarerJalonRequestDto {
  @ApiProperty({ enum: ETATS_PULSE, example: 'ca-va' })
  @IsIn(ETATS_PULSE)
  etat: EtatPulse;
}
