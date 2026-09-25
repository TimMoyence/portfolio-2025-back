import { Inject, Injectable } from '@nestjs/common';
import type {
  SpacedQuestionPublique,
  VotePublic,
} from '../domain/contrats/donnees-publiques';
import { choisirRappels, ecranDeRappel } from '../domain/cours/ChoixDesRappels';
import { assertEcranServi } from '../domain/cours/EcranServi';
import { tirer } from '../domain/cours/Tirage';
import { RappelsIndisponiblesError } from '../domain/errors/FormationErrors';
import type { IAnswersRepository } from '../domain/IAnswers.repository';
import type { IMasteryRepository } from '../domain/IMastery.repository';
import type { IRappelsServisRepository } from '../domain/IRappelsServis.repository';
import type { Boite } from '../domain/LeitnerBox';
import {
  ANSWERS_REPOSITORY,
  MASTERY_REPOSITORY,
  RAPPELS_SERVIS_REPOSITORY,
} from '../domain/token';
import { ParticipationEnSeance } from './ParticipationEnSeance';
import type { CibleDuParticipant } from './ParticipationEnSeance';

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
    private readonly participation: ParticipationEnSeance,
    @Inject(ANSWERS_REPOSITORY)
    private readonly answers: IAnswersRepository,
    @Inject(MASTERY_REPOSITORY)
    private readonly mastery: IMasteryRepository,
    @Inject(RAPPELS_SERVIS_REPOSITORY)
    private readonly rappels: IRappelsServisRepository,
  ) {}

  async execute(
    demande: CibleDuParticipant,
  ): Promise<{ questions: readonly SpacedQuestionPublique[] }> {
    const { sessionId, participantId } = demande;
    const { session, participant, cours } =
      await this.participation.contexte(demande);
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
