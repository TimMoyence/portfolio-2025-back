import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import {
  RevisionDeSeanceObsoleteError,
  SessionCodeAlreadyActiveError,
} from '../domain/errors/FormationErrors';
import type {
  CreateSessionInput,
  EtatDeSeanceRecord,
  ISessionsRepository,
  SessionRecord,
  UpdateSessionInput,
} from '../domain/ISessions.repository';
import { DepotEnDomaine } from '../../../common/infrastructure/typeorm/DepotEnDomaine';
import { aAffecte } from '../../../common/infrastructure/typeorm/lignes-affectees';
import { FormationSessionEntity } from './entities/FormationSession.entity';

const CODE_ACTIF_CONSTRAINT = 'uq_formation_sessions_code_active';
const CAPACITE_PAR_DEFAUT = 40;

function etatDe(entity: FormationSessionEntity): EtatDeSeanceRecord {
  return {
    courseSlug: entity.courseSlug,
    courseVersion: entity.courseVersion,
    etat: entity.etat,
    modeRythme: entity.modeRythme,
    ecranCourant: entity.ecranCourant,
    intervalleLibre: entity.intervalleLibre,
    pilotageEcrans: entity.pilotageEcrans,
    revision: entity.revision,
    majLe: entity.majLe,
  };
}

@Injectable()
export class SessionsRepositoryTypeORM
  extends DepotEnDomaine<FormationSessionEntity, SessionRecord>
  implements ISessionsRepository
{
  constructor(
    @InjectRepository(FormationSessionEntity)
    repo: Repository<FormationSessionEntity>,
  ) {
    super(repo);
  }

  async create(input: CreateSessionInput): Promise<SessionRecord> {
    try {
      return await this.enregistrer({
        courseSlug: input.courseSlug,
        courseVersion: input.courseVersion,
        teacherId: input.teacherId,
        code: input.code,
        bareme: input.bareme,
        etat: 'attente',
        modeRythme: 'pilote',
        ecranCourant: 0,
        intervalleLibre: null,
        pilotageEcrans: {},
        revision: 0,
        capacite: input.capacite ?? CAPACITE_PAR_DEFAUT,
        fermeeLe: null,
        majLe: new Date(),
      });
    } catch (error) {
      if (this.uniqueViolationConstraint(error) === CODE_ACTIF_CONSTRAINT) {
        throw new SessionCodeAlreadyActiveError(input.code);
      }
      throw error;
    }
  }

  findById(id: string): Promise<SessionRecord | null> {
    return this.trouver({ id });
  }

  async lireEtat(id: string): Promise<EtatDeSeanceRecord | null> {
    const entity = await this.repo.findOne({
      where: { id },
      select: {
        courseSlug: true,
        courseVersion: true,
        etat: true,
        modeRythme: true,
        ecranCourant: true,
        intervalleLibre: true,
        pilotageEcrans: true,
        revision: true,
        majLe: true,
      },
    });
    return entity ? etatDe(entity) : null;
  }

  findActiveByCode(code: string): Promise<SessionRecord | null> {
    return this.trouver({ code, etat: Not('terminee') });
  }

  async isCodeTaken(code: string): Promise<boolean> {
    const total = await this.repo.count({
      where: { code, etat: Not('terminee') },
    });
    return total > 0;
  }

  async update(
    id: string,
    input: UpdateSessionInput,
    revisionAttendue?: number,
  ): Promise<SessionRecord> {
    const ecriture = this.repo
      .createQueryBuilder()
      .update(FormationSessionEntity)
      .set({ ...input, majLe: new Date(), revision: () => '"revision" + 1' })
      .where('id = :id', { id });
    if (revisionAttendue !== undefined) {
      ecriture.andWhere('revision = :revisionAttendue', { revisionAttendue });
    }
    const resultat = await ecriture.execute();
    if (revisionAttendue !== undefined && !aAffecte(resultat)) {
      throw new RevisionDeSeanceObsoleteError(id);
    }
    return this.relire({ id });
  }

  protected toDomain(entity: FormationSessionEntity): SessionRecord {
    return {
      id: entity.id,
      teacherId: entity.teacherId,
      code: entity.code,
      ...etatDe(entity),
      capacite: entity.capacite,
      bareme: entity.bareme,
      ouverteLe: entity.ouverteLe,
      fermeeLe: entity.fermeeLe,
    };
  }
}
