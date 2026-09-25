import { Inject, Injectable } from '@nestjs/common';
import { DomainValidationError } from '../../../common/domain/errors/DomainValidationError';
import type { EtatPulse } from '../domain/contrats/pilotage';
import { cleDeJalon } from '../domain/cours/CleDeJalon';
import { assertEcranServi } from '../domain/cours/EcranServi';
import { ecranDeJalon } from '../domain/cours/Jalons';
import type { IPulsesRepository } from '../domain/IPulses.repository';
import { PULSES_REPOSITORY } from '../domain/token';
import { ParticipationEnSeance } from './ParticipationEnSeance';

export interface DeclarerJalonCommand {
  readonly sessionId: string;
  readonly participantId: string;
  readonly sondageId: string;
  readonly etat: EtatPulse;
}

@Injectable()
export class DeclarerJalonUseCase {
  constructor(
    private readonly participation: ParticipationEnSeance,
    @Inject(PULSES_REPOSITORY)
    private readonly pulses: IPulsesRepository,
  ) {}

  async execute(command: DeclarerJalonCommand): Promise<void> {
    const { session, cours } = await this.participation.ouverte(command);
    const cible = ecranDeJalon(cours, command.sondageId);
    if (cible === null) {
      throw new DomainValidationError(
        `Sondage absent du cours de cette séance : ${command.sondageId}`,
      );
    }
    assertEcranServi(session, cible.rang, cible.screenId, cours.ecrans.length);

    await this.pulses.declarer({
      sessionId: command.sessionId,
      cleParticipant: cleDeJalon(command.sessionId, command.participantId),
      sondageId: command.sondageId,
      etat: command.etat,
    });
    this.participation.signalerActivite(command.sessionId);
  }
}
