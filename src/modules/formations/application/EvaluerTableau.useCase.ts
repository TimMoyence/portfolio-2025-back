import { Injectable } from '@nestjs/common';
import type { TableauEvalue } from '../domain/contrats/donnees-publiques';
import { cibleServie, rangDuPlan } from '../domain/cours/EcranServi';
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
    const { session, cours } = await this.participation.ouverte(command);
    const plan = cibleServie(session, cours, {
      valeur: planDeTableauDuCours(cours, command.planId),
      nature: 'un tableau',
      id: command.planId,
      rang: rangDuPlan(cours, command.planId),
    });
    return evaluerLeTableauDuPlan(plan, command.saisies);
  }
}
