import { Inject } from '@nestjs/common';
import type { ICatalogueCours } from '../domain/cours/ICatalogueCours.port';
import type { IAnswersRepository } from '../domain/IAnswers.repository';
import type { IMasteryRepository } from '../domain/IMastery.repository';
import type { IParticipantsRepository } from '../domain/IParticipants.repository';
import type { ISessionStateCache } from '../domain/ISessionStateCache.port';
import type { ISessionsRepository } from '../domain/ISessions.repository';
import {
  ANSWERS_REPOSITORY,
  CATALOGUE_COURS,
  MASTERY_REPOSITORY,
  PARTICIPANTS_REPOSITORY,
  SESSION_STATE_CACHE,
  SESSIONS_REPOSITORY,
} from '../domain/token';

export abstract class EnregistrementDeReponse {
  constructor(
    @Inject(SESSIONS_REPOSITORY)
    protected readonly sessions: ISessionsRepository,
    @Inject(PARTICIPANTS_REPOSITORY)
    protected readonly participants: IParticipantsRepository,
    @Inject(ANSWERS_REPOSITORY)
    protected readonly answers: IAnswersRepository,
    @Inject(MASTERY_REPOSITORY)
    protected readonly mastery: IMasteryRepository,
    @Inject(SESSION_STATE_CACHE)
    protected readonly cache: ISessionStateCache,
    @Inject(CATALOGUE_COURS)
    protected readonly catalogue: ICatalogueCours,
  ) {}
}
