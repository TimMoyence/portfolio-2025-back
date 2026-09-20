import { Inject, Injectable } from '@nestjs/common';
import type {
  SpacedQuestionPublique,
  VotePublic,
} from '../domain/contrats/donnees-publiques';
import { choisirRappels, ecranDeRappel } from '../domain/cours/ChoixDesRappels';
import { assertEcranServi } from '../domain/cours/EcranServi';
import type { ICatalogueCours } from '../domain/cours/ICatalogueCours.port';
import { tirer } from '../domain/cours/Tirage';
import {
  CoursInconnuError,
  ParticipantNotFoundError,
  RappelsIndisponiblesError,
  SessionNotFoundError,
} from '../domain/errors/FormationErrors';
import type { IAnswersRepository } from '../domain/IAnswers.repository';
import type { IMasteryRepository } from '../domain/IMastery.repository';
import type { IParticipantsRepository } from '../domain/IParticipants.repository';
import type { IRappelsServisRepository } from '../domain/IRappelsServis.repository';
import type { ISessionsRepository } from '../domain/ISessions.repository';
import type { Boite } from '../domain/LeitnerBox';
import {
  ANSWERS_REPOSITORY,
  CATALOGUE_COURS,
  MASTERY_REPOSITORY,
  PARTICIPANTS_REPOSITORY,
  RAPPELS_SERVIS_REPOSITORY,
  SESSIONS_REPOSITORY,
} from '../domain/token';

const BOITE_PAR_DEFAUT: Boite = 1;

function projeterRappel(entree: {
  readonly questionId: string;
  readonly concept: string;
  readonly question: VotePublic | undefined;
  readonly titre: string;
  readonly boite: Boite | undefined;
}): readonly SpacedQuestionPublique[] {
  if (entree.question === undefined) {
    return [];
  }
  return [
    {
      questionId: entree.questionId,
      concept: entree.concept,
      boite: entree.boite ?? BOITE_PAR_DEFAUT,
      cours: entree.titre,
      enonce: entree.question.enonce,
      options: entree.question.options,
    },
  ];
}

@Injectable()
export class LireRappelsUseCase {
  constructor(
    @Inject(SESSIONS_REPOSITORY)
    private readonly sessions: ISessionsRepository,
    @Inject(PARTICIPANTS_REPOSITORY)
    private readonly participants: IParticipantsRepository,
    @Inject(ANSWERS_REPOSITORY)
    private readonly answers: IAnswersRepository,
    @Inject(MASTERY_REPOSITORY)
    private readonly mastery: IMasteryRepository,
    @Inject(RAPPELS_SERVIS_REPOSITORY)
    private readonly rappels: IRappelsServisRepository,
    @Inject(CATALOGUE_COURS)
    private readonly catalogue: ICatalogueCours,
  ) {}

  async execute(
    sessionId: string,
    participantId: string,
  ): Promise<{ questions: readonly SpacedQuestionPublique[] }> {
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
    const cible = ecranDeRappel(cours);
    if (cible === null) {
      throw new RappelsIndisponiblesError(session.courseSlug);
    }
    assertEcranServi(session, cible.rang, cible.screenId, cours.ecrans.length);

    const deja = await this.rappels.lister(participantId);
    const servis =
      deja.length > 0
        ? deja
        : await this.rappels.figer({
            sessionId,
            participantId,
            questionIds: choisirRappels({
              cible,
              reponses: await this.answers.listerDuParticipant(
                sessionId,
                participantId,
              ),
              maitrise: await this.mastery.findByStudentKey(
                participant.studentKey,
              ),
              maintenant: new Date(),
            }),
          });

    const banque = tirer(cours, participant.seed).banque;
    const maitrise = await this.mastery.findByStudentKey(
      participant.studentKey,
    );
    const servisConnus = servis.filter((servi) =>
      cible.banque.some((question) => question.id === servi.questionId),
    );
    return {
      questions: servisConnus.flatMap((servi) =>
        projeterRappel({
          questionId: servi.questionId,
          concept: cible.banque.find(
            (question) => question.id === servi.questionId,
          )!.concept,
          question: banque[servi.questionId],
          titre: cours.titre,
          boite: maitrise.find(
            (entree) =>
              entree.concept ===
              cible.banque.find((question) => question.id === servi.questionId)!
                .concept,
          )?.boite,
        }),
      ),
    };
  }
}
