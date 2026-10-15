import { Injectable } from '@nestjs/common';
import type { SortiesMachine } from '../domain/contrats/donnees-publiques';
import {
  evaluerLaMachine,
  machineDuCours,
} from '../domain/cours/MachineServie';
import { TypeDeQuestionError } from '../domain/errors/FormationErrors';
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
    const { cours } = await this.participation.ouverte(command);
    const machine = machineDuCours(cours, command.ecranId);
    if (machine === null) {
      throw new TypeDeQuestionError(
        command.ecranId,
        'n’est pas une machine de ce cours',
      );
    }
    return evaluerLaMachine(machine, command.ecranId, command.reglages);
  }
}
