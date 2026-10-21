import { Inject } from '@nestjs/common';
import type {
  CreateAnswerInput,
  IAnswersRepository,
} from '../domain/IAnswers.repository';
import type { IMasteryRepository } from '../domain/IMastery.repository';
import { ANSWERS_REPOSITORY, MASTERY_REPOSITORY } from '../domain/token';
import { ParticipationEnSeance } from './ParticipationEnSeance';

export abstract class EnregistrementDeReponse {
  constructor(
    protected readonly participation: ParticipationEnSeance,
    @Inject(ANSWERS_REPOSITORY)
    protected readonly answers: IAnswersRepository,
    @Inject(MASTERY_REPOSITORY)
    protected readonly mastery: IMasteryRepository,
  ) {}

  protected async enregistrerPremiereReponse(
    reponse: CreateAnswerInput,
    studentKey: string,
  ): Promise<void> {
    await this.answers.create(reponse);
    await this.mastery.enregistrerTentative({
      studentKey,
      concept: reponse.concept,
      reussi: reponse.correcte,
      vueLe: new Date(),
    });
  }
}
