import { Injectable } from '@nestjs/common';
import type { TableauEvalue } from '../domain/contrats/donnees-publiques';
import {
  evaluerLeTableauDuPlan,
  planDeTableauDuCours,
} from '../domain/cours/TableauEvalue';
import type { SaisieBruteDeTableau } from '../domain/cours/TableauEvalue';
import { TypeDeQuestionError } from '../domain/errors/FormationErrors';
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
    const { cours } = await this.participation.ouverte(command);
    const plan = planDeTableauDuCours(cours, command.planId);
    if (plan === null) {
      throw new TypeDeQuestionError(
        command.planId,
        'n’est pas un tableau de ce cours',
      );
    }
    return evaluerLeTableauDuPlan(plan, command.saisies);
  }
}
