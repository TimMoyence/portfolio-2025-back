import { Injectable } from '@nestjs/common';
import type { FeuilleEvaluee } from '../domain/contrats/donnees-publiques';
import {
  evaluerLaFeuilleDuPlan,
  planDeFeuilleDuCours,
} from '../domain/cours/FeuilleEvaluee';
import type { RecopieDeCellule } from '../domain/cours/FeuilleEvaluee';
import { TypeDeQuestionError } from '../domain/errors/FormationErrors';
import { ParticipationEnSeance } from './ParticipationEnSeance';

export interface EvaluerFeuilleCommand {
  readonly sessionId: string;
  readonly participantId: string;
  readonly planId: string;
  readonly cellules: Readonly<Record<string, string>>;
  readonly recopie?: RecopieDeCellule;
}

@Injectable()
export class EvaluerFeuilleUseCase {
  constructor(private readonly participation: ParticipationEnSeance) {}

  async execute(command: EvaluerFeuilleCommand): Promise<FeuilleEvaluee> {
    const { cours } = await this.participation.ouverte(command);
    const plan = planDeFeuilleDuCours(cours, command.planId);
    if (plan === null) {
      throw new TypeDeQuestionError(
        command.planId,
        'n’est pas une feuille de ce cours',
      );
    }
    return evaluerLaFeuilleDuPlan(plan, command.cellules, command.recopie);
  }
}
