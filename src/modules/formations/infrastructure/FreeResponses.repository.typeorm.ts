import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type {
  FreeResponseRecord,
  IFreeResponsesRepository,
  SaveFreeResponseInput,
} from '../domain/IFreeResponses.repository';
import { DepotEnDomaine } from '../../../common/infrastructure/typeorm/DepotEnDomaine';
import { FormationFreeResponseEntity } from './entities/FormationFreeResponse.entity';

const CLE_REPONSE_LIBRE = ['sessionId', 'participantId', 'activityId'];

function ligneEnregistree(input: SaveFreeResponseInput) {
  return {
    sessionId: input.sessionId,
    participantId: input.participantId,
    screenId: input.screenId,
    activityId: input.activityId,
    response: input.response,
    dureeMs: input.dureeMs,
    status: 'enregistre' as const,
  };
}

@Injectable()
export class FreeResponsesRepositoryTypeORM
  extends DepotEnDomaine<FormationFreeResponseEntity, FreeResponseRecord>
  implements IFreeResponsesRepository
{
  constructor(
    @InjectRepository(FormationFreeResponseEntity)
    repo: Repository<FormationFreeResponseEntity>,
  ) {
    super(repo);
  }

  async save(input: SaveFreeResponseInput): Promise<void> {
    await this.repo.upsert(ligneEnregistree(input), CLE_REPONSE_LIBRE);
  }

  async enregistrerTentativeDeDefi(
    input: SaveFreeResponseInput,
  ): Promise<FreeResponseRecord> {
    await this.repo
      .createQueryBuilder()
      .insert()
      .into(FormationFreeResponseEntity)
      .values({ ...ligneEnregistree(input), premiereReponse: input.response })
      .orUpdate(
        ['response', 'duree_ms'],
        ['session_id', 'participant_id', 'activity_id'],
      )
      .execute();
    const ligne = await this.trouverParActivite(
      input.participantId,
      input.activityId,
    );
    if (!ligne) {
      throw new Error(
        `Tentative de défi introuvable apres ecriture: ${input.activityId}`,
      );
    }
    return ligne;
  }

  trouverParActivite(
    participantId: string,
    activityId: string,
  ): Promise<FreeResponseRecord | null> {
    return this.trouver({ participantId, activityId });
  }

  listerDuParticipant(
    sessionId: string,
    participantId: string,
  ): Promise<readonly FreeResponseRecord[]> {
    return this.lister({
      where: { sessionId, participantId },
      order: { submittedAt: 'ASC' },
    });
  }

  listBySession(sessionId: string): Promise<readonly FreeResponseRecord[]> {
    return this.lister({ where: { sessionId }, order: { submittedAt: 'ASC' } });
  }

  protected toDomain(row: FormationFreeResponseEntity): FreeResponseRecord {
    return {
      id: row.id,
      sessionId: row.sessionId,
      participantId: row.participantId,
      screenId: row.screenId,
      activityId: row.activityId,
      response: row.response,
      premiereReponse: row.premiereReponse,
      strategiesServiesLe: row.strategiesServiesLe,
      dureeMs: row.dureeMs,
      status: row.status,
      submittedAt: row.submittedAt,
    };
  }
}
