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
  QuestionTally,
} from '../domain/IAnswers.repository';
import { DepotEnDomaine } from '../../../common/infrastructure/typeorm/DepotEnDomaine';
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

export interface TallyRow {
  questionId: string;
  total: string;
  correctes: string;
  misconception: string | null;
}

export function regrouperParQuestion(
  lignes: readonly TallyRow[],
): readonly QuestionTally[] {
  const parQuestion = new Map<string, QuestionTally>();
  for (const ligne of lignes) {
    const existante = parQuestion.get(ligne.questionId) ?? {
      questionId: ligne.questionId,
      total: 0,
      correctes: 0,
      parMisconception: {},
    };
    const parMisconception = { ...existante.parMisconception };
    if (ligne.misconception) {
      parMisconception[ligne.misconception] =
        (parMisconception[ligne.misconception] ?? 0) + Number(ligne.total);
    }
    parQuestion.set(ligne.questionId, {
      questionId: ligne.questionId,
      total: existante.total + Number(ligne.total),
      correctes: existante.correctes + Number(ligne.correctes),
      parMisconception,
    });
  }
  return [...parQuestion.values()];
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

  async create(input: CreateAnswerInput): Promise<AnswerRecord> {
    const entity = this.repo.create({
      sessionId: input.sessionId,
      participantId: input.participantId,
      questionId: input.questionId,
      concept: input.concept,
      seed: input.seed,
      ...correctionDe(input),
    });
    const saved = await this.enregistrerSansDoublon(
      this.repo,
      entity,
      () => new AnswerAlreadySubmittedError(input.questionId),
    );
    return this.toDomain(saved);
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
    if (resultat.affected === 1) {
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

  async tallyBySession(sessionId: string): Promise<readonly QuestionTally[]> {
    const lignes = await this.repo
      .createQueryBuilder('reponse')
      .select('reponse.question_id', 'questionId')
      .addSelect('COUNT(*)', 'total')
      .addSelect(
        'SUM(CASE WHEN reponse.correcte THEN 1 ELSE 0 END)',
        'correctes',
      )
      .addSelect('reponse.misconception', 'misconception')
      .where('reponse.session_id = :sessionId', { sessionId })
      .groupBy('reponse.question_id')
      .addGroupBy('reponse.misconception')
      .getRawMany<TallyRow>();
    return regrouperParQuestion(lignes);
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
