import { Inject } from '@nestjs/common';
import type { IAnswersRepository } from '../domain/IAnswers.repository';
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
}
