import { Injectable } from '@nestjs/common';
import type { SortiesMachine } from '../../domain/contrats/donnees-publiques';
import {
  absenteDuCours,
  cibleServie,
  rangDeLEcran,
} from '../../domain/cours/diffusion/EcranServi';
import {
  evaluerLaMachine,
  machineDuCours,
} from '../../domain/cours/evaluation/MachineServie';
import { ParticipationEnSeance } from '../participants/ParticipationEnSeance';

export interface EvaluerMachineCommand {
  readonly sessionId: string;
  readonly participantId: string;
  readonly ecranId: string;
  readonly reglages: Readonly<Record<string, number>>;
}

@Injectable()
export class EvaluerMachineUseCase {
  constructor(private readonly participation: ParticipationEnSeance) {}

  async execute(command: EvaluerMachineCommand): Promise<SortiesMachine> {
    const { session, cours } = await this.participation.ouverte(command);
    const machine = cibleServie(
      session,
      cours,
      {
        valeur: machineDuCours(cours, command.ecranId),
        id: command.ecranId,
        rang: () => rangDeLEcran(cours, command.ecranId),
      },
      absenteDuCours('une machine'),
    );
    return evaluerLaMachine(machine, command.ecranId, command.reglages);
  }
}
