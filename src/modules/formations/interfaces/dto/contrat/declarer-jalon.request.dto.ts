import { ValeurDuContrat } from '../../../../../common/interfaces/dto/valeur-du-contrat.decorator';
import type { EtatPulse } from '../../../domain/contrats/pilotage';
import { ETATS_PULSE } from '../../../domain/contrats/pilotage';

export class DeclarerJalonRequestDto {
  @ValeurDuContrat(ETATS_PULSE, 'EtatPulse', {
    documentation: { example: 'ca-va' },
  })
  etat: EtatPulse;
}
