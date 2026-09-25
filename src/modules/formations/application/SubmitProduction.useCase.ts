import { Injectable } from '@nestjs/common';
import type { ValeurProduction } from '../domain/contrats/resultats';
import {
  detailsLisibles,
  libelleLisible,
} from '../domain/cours/banque/confusions';
import type {
  ConfusionId,
  DetailLisible,
} from '../domain/cours/banque/confusions';
import {
  confusionDominante,
  corrigerProduction,
  ecranDeProduction,
  normaliserProduction,
} from '../domain/cours/ProductionSoumise';
import {
  AnswerAlreadySubmittedError,
  ReprisesEpuiseesError,
  TypeDeQuestionError,
} from '../domain/errors/FormationErrors';
import { assertEcranOuvertAuxProductions } from './CoursDeLaSeance';
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
    const { session, cours } = await this.participation.seanceEtCours(
      command.sessionId,
    );
    const cible = ecranDeProduction(cours, command.questionId);
    if (cible === null) {
      throw new TypeDeQuestionError(
        command.questionId,
        'n’est pas une production de ce cours',
      );
    }
    assertEcranOuvertAuxProductions(session, cours, cible);

    const valeur = normaliserProduction(cible, command.valeur);

    const reprise = await this.answers.existsFor(
      command.participantId,
      command.questionId,
    );
    if (reprise && !PRODUCTIONS_REPRENABLES.includes(cible.ecran.brique)) {
      throw new AnswerAlreadySubmittedError(command.questionId);
    }
    const participant = await this.participation.participantActif(command);

    const verdict = corrigerProduction(cible.question.corrige, valeur, cible);
    const confusion = confusionDominante(verdict.details);
    await this.enregistrer(
      command,
      { sessionId: session.id, seed: participant.seed, reprise },
      {
        concept: cible.question.concept,
        correcte: verdict.correcte,
        score: verdict.score,
        confusion,
        details: verdict.details,
        valeur,
      },
    );
    this.participation.signalerActivite(command.sessionId);
    if (!reprise) {
      await this.mastery.enregistrerTentative({
        studentKey: participant.studentKey,
        concept: cible.question.concept,
        reussi: verdict.correcte,
        vueLe: new Date(),
      });
    }

    return {
      correcte: verdict.correcte,
      score: verdict.score,
      details: detailsLisibles(verdict.details),
      libelleConfusion: libelleLisible(confusion),
    };
  }

  private async enregistrer(
    command: SubmitProductionCommand,
    { sessionId, seed, reprise }: EnregistrementDeProduction,
    verdict: {
      concept: string;
      correcte: boolean;
      score: number;
      confusion: ConfusionId | null;
      details: readonly {
        cle: string;
        juste: boolean;
        confusion: ConfusionId | null;
      }[];
      valeur: ValeurProduction;
    },
  ): Promise<void> {
    const reponse = {
      sessionId,
      participantId: command.participantId,
      questionId: command.questionId,
      concept: verdict.concept,
      valeur: verdict.valeur,
      seed,
      correcte: verdict.correcte,
      misconception: verdict.confusion,
      score: verdict.score,
      details: verdict.details,
      dureeMs: command.dureeMs,
    };
    if (!reprise) {
      await this.answers.create(reponse);
      return;
    }
    const remplacee = await this.answers.remplacer(
      reponse,
      SOUMISSIONS_MAX_PAR_PRODUCTION,
    );
    if (!remplacee) {
      throw new ReprisesEpuiseesError(
        command.questionId,
        SOUMISSIONS_MAX_PAR_PRODUCTION,
      );
    }
  }
}

interface EnregistrementDeProduction {
  readonly sessionId: string;
  readonly seed: number;
  readonly reprise: boolean;
}

export const SOUMISSIONS_MAX_PAR_PRODUCTION = 3;

const PRODUCTIONS_REPRENABLES: readonly string[] = [
  'fp-sheet',
  'fp-table-build',
];
