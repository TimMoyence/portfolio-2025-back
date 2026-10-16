import { Injectable } from '@nestjs/common';
import type { TableauEvalue } from '../domain/contrats/donnees-publiques';
import {
  evaluerLeTableauDuPlan,
  planDeTableauDuCours,
} from '../domain/cours/TableauEvalue';
import type { SaisieBruteDeTableau } from '../domain/cours/TableauEvalue';
import { ParticipationEnSeance } from './ParticipationEnSeance';

export interface EvaluerTableauCommand {
  readonly sessionId: string;
  readonly participantId: string;
  readonly planId: string;
  readonly saisies: readonly SaisieBruteDeTableau[];
}

@Injectable()
export class EvaluerTableauUseCase {
  constructor(private readonly participation: ParticipationEnSeance) {}

  async execute(command: EvaluerTableauCommand): Promise<TableauEvalue> {
    const plan = await this.participation.planDeLaSeance(
      command,
      planDeTableauDuCours,
      'un tableau',
    );
    return evaluerLeTableauDuPlan(plan, command.saisies);
  }
}
