import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnswerAlreadySubmittedError } from '../domain/errors/FormationErrors';
import type {
  AnswerRecord,
  CreateAnswerInput,
  IAnswersRepository,
  QuestionTally,
} from '../domain/IAnswers.repository';
import { PostgresErrorClassifier } from './PostgresErrorClassifier';
import { FormationAnswerEntity } from './entities/FormationAnswer.entity';

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
  extends PostgresErrorClassifier
  implements IAnswersRepository
{
  constructor(
    @InjectRepository(FormationAnswerEntity)
    private readonly repo: Repository<FormationAnswerEntity>,
  ) {
    super();
  }

  async create(input: CreateAnswerInput): Promise<AnswerRecord> {
    const entity = this.repo.create({
      sessionId: input.sessionId,
      participantId: input.participantId,
      questionId: input.questionId,
      concept: input.concept,
      valeur: input.valeur,
      seed: input.seed,
      correcte: input.correcte,
      misconception: input.misconception,
      dureeMs: input.dureeMs,
    });
    try {
      const saved = await this.repo.save(entity);
      return this.toDomain(saved);
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new AnswerAlreadySubmittedError(input.questionId);
      }
      throw error;
    }
  }

  async existsFor(participantId: string, questionId: string): Promise<boolean> {
    const total = await this.repo.count({
      where: { participantId, questionId },
    });
    return total > 0;
  }

  async listBySession(sessionId: string): Promise<readonly AnswerRecord[]> {
    const entities = await this.repo.find({
      where: { sessionId },
      order: { soumisLe: 'ASC', id: 'ASC' },
    });
    return entities.map((entity) => this.toDomain(entity));
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

  private toDomain(entity: FormationAnswerEntity): AnswerRecord {
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
      dureeMs: entity.dureeMs,
      soumisLe: entity.soumisLe,
    };
  }
}
