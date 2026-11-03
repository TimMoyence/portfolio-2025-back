import { Inject, Injectable } from '@nestjs/common';
import { DomainValidationError } from '../../../../common/domain/errors/DomainValidationError';
import type { EtatPulse } from '../../domain/contrats/pilotage';
import { cleDeJalon } from '../../domain/cours/diffusion/CleDeJalon';
import { cibleServie } from '../../domain/cours/diffusion/EcranServi';
import { ecranDeJalon } from '../../domain/cours/diffusion/Jalons';
import type { IPulsesRepository } from '../../domain/progression/IPulses.repository';
import { PULSES_REPOSITORY } from '../../domain/token';
import { ParticipationEnSeance } from '../participants/ParticipationEnSeance';

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
    cibleServie(
      session,
      cours,
      {
        valeur: ecranDeJalon(cours, command.sondageId),
        id: command.sondageId,
        rang: (jalon) => jalon.rang,
      },
      (sondageId) =>
        new DomainValidationError(
          `Sondage absent du cours de cette séance : ${sondageId}`,
        ),
    );

    await this.pulses.declarer({
      sessionId: command.sessionId,
      cleParticipant: cleDeJalon(command.sessionId, command.participantId),
      sondageId: command.sondageId,
      etat: command.etat,
    });
    this.participation.signalerActivite(command.sessionId);
  }
}
