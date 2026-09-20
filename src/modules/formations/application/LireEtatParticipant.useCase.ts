import { Inject, Injectable } from '@nestjs/common';
import { libelleDeConfusion } from '../domain/cours/banque/confusions';
import type { Cours } from '../domain/contrats/cours';
import type { EtatParticipant } from '../domain/contrats/pilotage';
import { cleDeJalon } from '../domain/cours/CleDeJalon';
import { ecranDeDefi } from '../domain/cours/Defis';
import type { ICatalogueCours } from '../domain/cours/ICatalogueCours.port';
import {
  CoursInconnuError,
  ParticipantNotFoundError,
  SessionNotFoundError,
} from '../domain/errors/FormationErrors';
import type {
  AnswerRecord,
  IAnswersRepository,
} from '../domain/IAnswers.repository';
import type {
  IEscapeRepository,
  ProgressionEnigmeRecord,
} from '../domain/IEscape.repository';
import type { IFreeResponsesRepository } from '../domain/IFreeResponses.repository';
import type { IParticipantsRepository } from '../domain/IParticipants.repository';
import type { IPulsesRepository } from '../domain/IPulses.repository';
import type { IRappelsServisRepository } from '../domain/IRappelsServis.repository';
import type { ISessionsRepository } from '../domain/ISessions.repository';
import {
  ANSWERS_REPOSITORY,
  CATALOGUE_COURS,
  ESCAPE_REPOSITORY,
  FREE_RESPONSES_REPOSITORY,
  PARTICIPANTS_REPOSITORY,
  PULSES_REPOSITORY,
  RAPPELS_SERVIS_REPOSITORY,
  SESSIONS_REPOSITORY,
} from '../domain/token';

const TENTATIVES_MAX = 10;

@Injectable()
export class LireEtatParticipantUseCase {
  constructor(
    @Inject(SESSIONS_REPOSITORY)
    private readonly sessions: ISessionsRepository,
    @Inject(PARTICIPANTS_REPOSITORY)
    private readonly participants: IParticipantsRepository,
    @Inject(ANSWERS_REPOSITORY)
    private readonly answers: IAnswersRepository,
    @Inject(FREE_RESPONSES_REPOSITORY)
    private readonly freeResponses: IFreeResponsesRepository,
    @Inject(PULSES_REPOSITORY)
    private readonly pulses: IPulsesRepository,
    @Inject(ESCAPE_REPOSITORY)
    private readonly escape: IEscapeRepository,
    @Inject(RAPPELS_SERVIS_REPOSITORY)
    private readonly rappels: IRappelsServisRepository,
    @Inject(CATALOGUE_COURS)
    private readonly catalogue: ICatalogueCours,
  ) {}

  async execute(
    sessionId: string,
    participantId: string,
  ): Promise<EtatParticipant> {
    const session = await this.sessions.findById(sessionId);
    if (!session) {
      throw new SessionNotFoundError(sessionId);
    }
    const participant = await this.participants.findById(participantId);
    if (
      !participant ||
      participant.sessionId !== sessionId ||
      participant.evinceLe !== null
    ) {
      throw new ParticipantNotFoundError(participantId);
    }
    const cours = await this.catalogue.trouver(
      session.courseSlug,
      session.courseVersion,
    );
    if (!cours) {
      throw new CoursInconnuError(session.courseSlug);
    }

    const [reponses, libres, jalons, progressions, rappels] = await Promise.all(
      [
        this.answers.listerDuParticipant(sessionId, participantId),
        this.freeResponses.listerDuParticipant(sessionId, participantId),
        this.pulses.listerDuParticipant(
          sessionId,
          cleDeJalon(sessionId, participantId),
        ),
        this.escape.listerProgressionDuParticipant(participantId),
        this.rappels.lister(participantId),
      ],
    );

    return {
      sessionId,
      participantId,
      revision: session.revision,
      reponses: reponses.map((reponse) => this.reponseLue(reponse)),
      reponsesLibres: libres
        .filter((libre) => ecranDeDefi(cours, libre.activityId) === null)
        .map((libre) => ({
          activityId: libre.activityId,
          response: libre.response,
        })),
      jalons: [...jalons],
      enigmes: this.enigmesLues(cours, progressions),
      defis: libres
        .filter((libre) => ecranDeDefi(cours, libre.activityId) !== null)
        .map((libre) => ({
          defiId: libre.activityId,
          premiereTentative: libre.premiereReponse ?? libre.response,
        })),
      rappels: {
        questionIds: rappels.map((servi) => servi.questionId),
      },
    };
  }

  private reponseLue(
    reponse: AnswerRecord,
  ): EtatParticipant['reponses'][number] {
    return {
      questionId: reponse.questionId,
      valeur: reponse.valeur,
      correcte: reponse.correcte,
      score: reponse.score,
      details:
        reponse.details === null
          ? null
          : reponse.details.map((detail) => ({
              cle: detail.cle,
              juste: detail.juste,
              libelleConfusion: libelleLisible(detail.confusion),
            })),
      libelleConfusion: libelleLisible(reponse.misconception),
    };
  }

  private enigmesLues(
    cours: Cours,
    progressions: readonly ProgressionEnigmeRecord[],
  ): EtatParticipant['enigmes'] {
    const parParcours = new Map<string, ProgressionEnigmeRecord[]>();
    for (const ligne of progressions) {
      parParcours.set(ligne.parcoursId, [
        ...(parParcours.get(ligne.parcoursId) ?? []),
        ligne,
      ]);
    }
    return [...parParcours.entries()].map(([parcoursId, lignes]) => ({
      parcoursId,
      resolues: lignes
        .filter((ligne) => ligne.resolueLe !== null)
        .map((ligne) => ({
          enigmeId: ligne.enigmeId,
          fragment: fragmentDe(cours, ligne.enigmeId),
        })),
      tentativesRestantes: Object.fromEntries(
        lignes
          .filter((ligne) => ligne.resolueLe === null)
          .map((ligne) => [
            ligne.enigmeId,
            Math.max(0, TENTATIVES_MAX - ligne.tentatives),
          ]),
      ),
    }));
  }
}

function libelleLisible(confusion: string | null): string | null {
  return confusion === null
    ? null
    : (libelleDeConfusion(confusion) ?? confusion);
}

function fragmentDe(cours: Cours, enigmeId: string): string {
  for (const ecran of cours.ecrans) {
    if (ecran.brique !== 'fp-escape') {
      continue;
    }
    const question = ecran.enigmes.find(
      (candidate) => candidate.id === enigmeId,
    );
    if (question !== undefined && question.corrige.type === 'enigme') {
      return question.corrige.fragment;
    }
  }
  return '';
}
