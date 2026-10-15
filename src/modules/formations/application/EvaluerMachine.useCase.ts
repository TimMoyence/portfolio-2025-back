import { Injectable } from '@nestjs/common';
import type { SortiesMachine } from '../domain/contrats/donnees-publiques';
import { cibleServie, rangDeLEcran } from '../domain/cours/EcranServi';
import {
  evaluerLaMachine,
  machineDuCours,
} from '../domain/cours/MachineServie';
import { ParticipationEnSeance } from './ParticipationEnSeance';

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
    const machine = cibleServie(session, cours, {
      valeur: machineDuCours(cours, command.ecranId),
      nature: 'une machine',
      id: command.ecranId,
      rang: rangDeLEcran(cours, command.ecranId),
    });
    return evaluerLaMachine(machine, command.ecranId, command.reglages);
  }
}
