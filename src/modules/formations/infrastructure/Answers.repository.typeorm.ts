import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository, type FindOptionsOrder } from 'typeorm';
import {
  AnswerAlreadySubmittedError,
  ReponseIntrouvableError,
} from '../domain/errors/FormationErrors';
import type {
  AnswerRecord,
  CreateAnswerInput,
  IAnswersRepository,
} from '../domain/IAnswers.repository';
import { DepotEnDomaine } from '../../../common/infrastructure/typeorm/DepotEnDomaine';
import { aAffecte } from '../../../common/infrastructure/typeorm/lignes-affectees';
import { FormationAnswerEntity } from './entities/FormationAnswer.entity';

const ORDRE_DE_SOUMISSION: FindOptionsOrder<FormationAnswerEntity> = {
  soumisLe: 'ASC',
  id: 'ASC',
};

function correctionDe(input: CreateAnswerInput) {
  return {
    valeur: input.valeur,
    correcte: input.correcte,
    misconception: input.misconception,
    score: input.score ?? null,
    details: input.details ?? null,
    dureeMs: input.dureeMs,
  };
}

@Injectable()
export class AnswersRepositoryTypeORM
  extends DepotEnDomaine<FormationAnswerEntity, AnswerRecord>
  implements IAnswersRepository
{
  constructor(
    @InjectRepository(FormationAnswerEntity)
    repo: Repository<FormationAnswerEntity>,
  ) {
    super(repo);
  }

  create(input: CreateAnswerInput): Promise<AnswerRecord> {
    return this.enregistrer(
      {
        sessionId: input.sessionId,
        participantId: input.participantId,
        questionId: input.questionId,
        concept: input.concept,
        seed: input.seed,
        ...correctionDe(input),
      },
      () => new AnswerAlreadySubmittedError(input.questionId),
    );
  }

  async remplacer(
    input: CreateAnswerInput,
    soumissionsMax: number,
  ): Promise<boolean> {
    const resultat = await this.repo.update(
      {
        participantId: input.participantId,
        questionId: input.questionId,
        soumissions: LessThan(soumissionsMax),
      },
      { ...correctionDe(input), soumissions: () => 'soumissions + 1' },
    );
    if (aAffecte(resultat)) {
      return true;
    }
    if (await this.existsFor(input.participantId, input.questionId)) {
      return false;
    }
    throw new ReponseIntrouvableError(input.questionId);
  }

  async existsFor(participantId: string, questionId: string): Promise<boolean> {
    const total = await this.repo.count({
      where: { participantId, questionId },
    });
    return total > 0;
  }

  listBySession(sessionId: string): Promise<readonly AnswerRecord[]> {
    return this.lister({ where: { sessionId }, order: ORDRE_DE_SOUMISSION });
  }

  listerDuParticipant(
    sessionId: string,
    participantId: string,
  ): Promise<readonly AnswerRecord[]> {
    return this.lister({
      where: { sessionId, participantId },
      order: ORDRE_DE_SOUMISSION,
    });
  }

  protected toDomain(entity: FormationAnswerEntity): AnswerRecord {
    return {
      id: entity.id,
      sessionId: entity.sessionId,
      participantId: entity.participantId,
      questionId: entity.questionId,
      concept: entity.concept,
      valeur: entity.valeur,
      seed: entity.seed,
      correcte: entity.correcte,
      misconception: entity.misconception,
      score: entity.score,
      details: entity.details,
      dureeMs: entity.dureeMs,
      soumisLe: entity.soumisLe,
    };
  }
}
