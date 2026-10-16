import { Injectable } from '@nestjs/common';
import type { FeuilleEvaluee } from '../domain/contrats/donnees-publiques';
import {
  evaluerLaFeuilleDuPlan,
  planDeFeuilleDuCours,
} from '../domain/cours/FeuilleEvaluee';
import type { RecopieDeCellule } from '../domain/cours/FeuilleEvaluee';
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
    const plan = await this.participation.planDeLaSeance(
      command,
      planDeFeuilleDuCours,
      'une feuille',
    );
    return evaluerLaFeuilleDuPlan(plan, command.cellules, command.recopie);
  }
}
