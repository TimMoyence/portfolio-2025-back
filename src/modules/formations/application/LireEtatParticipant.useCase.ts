import { Inject, Injectable } from '@nestjs/common';
import {
  detailsLisibles,
  libelleLisible,
} from '../domain/cours/banque/confusions';
import type { Cours } from '../domain/contrats/cours';
import type { EtatParticipant } from '../domain/contrats/pilotage';
import { cleDeJalon } from '../domain/cours/CleDeJalon';
import { ecranDeDefi } from '../domain/cours/Defis';
import type {
  AnswerRecord,
  IAnswersRepository,
} from '../domain/IAnswers.repository';
import type {
  IEscapeRepository,
  ProgressionEnigmeRecord,
} from '../domain/IEscape.repository';
import type { IFreeResponsesRepository } from '../domain/IFreeResponses.repository';
import type { IPulsesRepository } from '../domain/IPulses.repository';
import type { IRappelsServisRepository } from '../domain/IRappelsServis.repository';
import {
  ANSWERS_REPOSITORY,
  ESCAPE_REPOSITORY,
  FREE_RESPONSES_REPOSITORY,
  PULSES_REPOSITORY,
  RAPPELS_SERVIS_REPOSITORY,
} from '../domain/token';
import { ParticipationEnSeance } from './ParticipationEnSeance';
import type { CibleDuParticipant } from './ParticipationEnSeance';

const TENTATIVES_MAX = 10;

@Injectable()
export class LireEtatParticipantUseCase {
  constructor(
    private readonly participation: ParticipationEnSeance,
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
  ) {}

  async execute(demande: CibleDuParticipant): Promise<EtatParticipant> {
    const { sessionId, participantId } = demande;
    const { session, cours } = await this.participation.contexte(demande);

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
        reponse.details === null ? null : detailsLisibles(reponse.details),
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
