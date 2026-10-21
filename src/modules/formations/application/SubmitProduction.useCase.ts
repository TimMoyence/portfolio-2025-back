import { Injectable } from '@nestjs/common';
import type { ValeurProduction } from '../domain/contrats/resultats';
import {
  detailsLisibles,
  libelleLisible,
} from '../domain/cours/banque/confusions';
import type { DetailLisible } from '../domain/cours/banque/confusions';
import {
  confusionDominante,
  corrigerProduction,
  ecranDeProduction,
  normaliserProduction,
} from '../domain/cours/ProductionSoumise';
import { absenteDuCours } from '../domain/cours/EcranServi';
import {
  AnswerAlreadySubmittedError,
  ReprisesEpuiseesError,
} from '../domain/errors/FormationErrors';
import type { CreateAnswerInput } from '../domain/IAnswers.repository';
import { EnregistrementDeReponse } from './EnregistrementDeReponse';

export interface SubmitProductionCommand {
  readonly sessionId: string;
  readonly participantId: string;
  readonly questionId: string;
  readonly valeur: ValeurProduction;
  readonly dureeMs: number;
}

export interface SubmitProductionResult {
  correcte: boolean;
  score: number;
  details: DetailLisible[];
  libelleConfusion: string | null;
}

@Injectable()
export class SubmitProductionUseCase extends EnregistrementDeReponse {
  async execute(
    command: SubmitProductionCommand,
  ): Promise<SubmitProductionResult> {
    const { session, cible } =
      await this.participation.cibleOuverteAuxProductions(
        command.sessionId,
        { id: command.questionId, trouver: ecranDeProduction },
        absenteDuCours('une production'),
      );

    const valeur = normaliserProduction(cible, command.valeur);

    const reprise = await this.answers.existsFor(
      command.participantId,
      command.questionId,
    );
    if (reprise && !PRODUCTIONS_REPRENABLES.includes(cible.ecran.brique)) {
      throw new AnswerAlreadySubmittedError(command.questionId);
    }
    const participant = await this.participation.participant(command);

    const verdict = corrigerProduction(cible.question.corrige, valeur, cible);
    const confusion = confusionDominante(verdict.details);
    const reponse: CreateAnswerInput = {
      sessionId: session.id,
      participantId: command.participantId,
      questionId: command.questionId,
      concept: cible.question.concept,
      valeur,
      seed: participant.seed,
      correcte: verdict.correcte,
      misconception: confusion,
      score: verdict.score,
      details: verdict.details,
      dureeMs: command.dureeMs,
    };
    await (reprise
      ? this.remplacer(reponse)
      : this.enregistrerPremiereReponse(reponse, participant.studentKey));
    this.participation.signalerActivite(command.sessionId);

    return {
      correcte: verdict.correcte,
      score: verdict.score,
      details: detailsLisibles(verdict.details),
      libelleConfusion: libelleLisible(confusion),
    };
  }

  private async remplacer(reponse: CreateAnswerInput): Promise<void> {
    const remplacee = await this.answers.remplacer(
      reponse,
      SOUMISSIONS_MAX_PAR_PRODUCTION,
    );
    if (!remplacee) {
      throw new ReprisesEpuiseesError(
        reponse.questionId,
        SOUMISSIONS_MAX_PAR_PRODUCTION,
      );
    }
  }
}

export const SOUMISSIONS_MAX_PAR_PRODUCTION = 3;

const PRODUCTIONS_REPRENABLES: readonly string[] = [
  'fp-sheet',
  'fp-table-build',
];
