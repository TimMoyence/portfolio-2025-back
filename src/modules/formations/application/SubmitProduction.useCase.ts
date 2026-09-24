import { Inject, Injectable } from '@nestjs/common';
import type { ValeurProduction } from '../domain/contrats/resultats';
import { libelleDeConfusion } from '../domain/cours/banque/confusions';
import type { ConfusionId } from '../domain/cours/banque/confusions';
import {
  assertCorrectionNonProjetee,
  assertEcranServi,
} from '../domain/cours/EcranServi';
import type { ICatalogueCours } from '../domain/cours/ICatalogueCours.port';
import { assertPhaseOuverte } from '../domain/cours/PilotageEcrans';
import {
  confusionDominante,
  corrigerProduction,
  ecranDeProduction,
  normaliserProduction,
} from '../domain/cours/ProductionSoumise';
import {
  AnswerAlreadySubmittedError,
  CoursInconnuError,
  ParticipantNotFoundError,
  ReprisesEpuiseesError,
  SessionNotFoundError,
  TypeDeQuestionError,
} from '../domain/errors/FormationErrors';
import type { IAnswersRepository } from '../domain/IAnswers.repository';
import type { IMasteryRepository } from '../domain/IMastery.repository';
import type { IParticipantsRepository } from '../domain/IParticipants.repository';
import type { ISessionStateCache } from '../domain/ISessionStateCache.port';
import type { ISessionsRepository } from '../domain/ISessions.repository';
import { assertReponsesOuvertes } from '../domain/SessionState';
import {
  ANSWERS_REPOSITORY,
  CATALOGUE_COURS,
  MASTERY_REPOSITORY,
  PARTICIPANTS_REPOSITORY,
  SESSION_STATE_CACHE,
  SESSIONS_REPOSITORY,
} from '../domain/token';

export interface SubmitProductionCommand {
  readonly sessionId: string;
  readonly participantId: string;
  readonly questionId: string;
  readonly valeur: ValeurProduction;
  readonly dureeMs: number;
}

interface DetailVerdict {
  cle: string;
  juste: boolean;
  libelleConfusion: string | null;
}

export interface SubmitProductionResult {
  correcte: boolean;
  score: number;
  details: DetailVerdict[];
  libelleConfusion: string | null;
}

@Injectable()
export class SubmitProductionUseCase {
  constructor(
    @Inject(SESSIONS_REPOSITORY)
    private readonly sessions: ISessionsRepository,
    @Inject(PARTICIPANTS_REPOSITORY)
    private readonly participants: IParticipantsRepository,
    @Inject(ANSWERS_REPOSITORY)
    private readonly answers: IAnswersRepository,
    @Inject(MASTERY_REPOSITORY)
    private readonly mastery: IMasteryRepository,
    @Inject(SESSION_STATE_CACHE)
    private readonly cache: ISessionStateCache,
    @Inject(CATALOGUE_COURS)
    private readonly catalogue: ICatalogueCours,
  ) {}

  async execute(
    command: SubmitProductionCommand,
  ): Promise<SubmitProductionResult> {
    const session = await this.sessions.findById(command.sessionId);
    if (!session) {
      throw new SessionNotFoundError(command.sessionId);
    }
    assertReponsesOuvertes(session.etat);

    const cours = await this.catalogue.trouver(
      session.courseSlug,
      session.courseVersion,
    );
    if (!cours) {
      throw new CoursInconnuError(session.courseSlug);
    }
    const cible = ecranDeProduction(cours, command.questionId);
    if (cible === null) {
      throw new TypeDeQuestionError(
        command.questionId,
        'n’est pas une production de ce cours',
      );
    }
    assertEcranServi(session, cible.rang, cible.ecran.id, cours.ecrans.length);
    assertPhaseOuverte(session.pilotageEcrans, { ecranId: cible.ecran.id });
    assertCorrectionNonProjetee(session, cours, cible.ecran.id);

    const valeur = normaliserProduction(cible, command.valeur);

    const reprise = await this.answers.existsFor(
      command.participantId,
      command.questionId,
    );
    if (reprise && !PRODUCTIONS_REPRENABLES.includes(cible.ecran.brique)) {
      throw new AnswerAlreadySubmittedError(command.questionId);
    }
    const participant = await this.participants.findById(command.participantId);
    if (
      !participant ||
      participant.sessionId !== command.sessionId ||
      participant.evinceLe !== null
    ) {
      throw new ParticipantNotFoundError(command.participantId);
    }

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
    this.cache.signalerActivite(command.sessionId);
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
      details: verdict.details.map((detail) => ({
        cle: detail.cle,
        juste: detail.juste,
        libelleConfusion: libelleDuDetail(detail.confusion),
      })),
      libelleConfusion: libelleDuDetail(confusion),
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

function libelleDuDetail(confusion: ConfusionId | null): string | null {
  return confusion === null
    ? null
    : (libelleDeConfusion(confusion) ?? confusion);
}
