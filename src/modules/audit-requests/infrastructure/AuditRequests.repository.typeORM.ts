import type { MethodeDeContact } from '../domain/AuditRequest';
import { Injectable } from '@nestjs/common';
import { estObjet } from '../../../common/domain/est-objet';
import { boiteDeLivraison } from '../../../common/domain/value-objects/boite-de-livraison';
import { DepotDeRequetes } from '../../../common/infrastructure/typeorm/DepotDeRequetes';
import {
  poseeDepuisMoinsDe,
  secondesAvantDeSortirDeLaFenetre,
} from '../../../common/infrastructure/typeorm/horloge-de-la-base';
import { enTransactionSurLaBoite } from '../../../common/infrastructure/typeorm/verrou-de-transaction';
import {
  AuditSnapshot,
  AuditSummarySnapshot,
  UpdateAuditStateInput,
} from '../domain/AuditProcessing';
import {
  AuditRequest,
  HEURES_DE_VALIDITE_D_UNE_CONFIRMATION,
  VALIDITE_D_UNE_CONFIRMATION_MS,
} from '../domain/AuditRequest';
import { AuditRequestResponse } from '../domain/AuditRequestResponse';
import type { IAuditRequestsRepository } from '../domain/IAuditRequests.repository';
import { LocaleCode } from '../../../common/domain/value-objects/LocaleCode';
import { AuditRequestEntity } from './entities/AuditRequest.entity';

const UPDATABLE_STATE_KEYS = [
  'processingStatus',
  'progress',
  'step',
  'error',
  'normalizedUrl',
  'finalUrl',
  'redirectChain',
  'keyChecks',
  'quickWins',
  'pillarScores',
  'summaryText',
  'fullReport',
  'clientReport',
  'expertReport',
  'engineCoverage',
  'done',
  'startedAt',
  'finishedAt',
] as const satisfies ReadonlyArray<keyof UpdateAuditStateInput>;

@Injectable()
export class AuditRequestsRepositoryTypeORM
  extends DepotDeRequetes(AuditRequestEntity)
  implements IAuditRequestsRepository
{
  async create(
    data: AuditRequest,
    empreinteDeConfirmation: string | null,
  ): Promise<AuditRequestResponse> {
    const aConfirmer = empreinteDeConfirmation !== null;
    const entity = await this.consigner(
      {
        websiteName: data.websiteName,
        contactMethod: data.contactMethod,
        contactValue: data.contactValue,
        boite: boiteDeLivraison(data.contactValue),
        done: false,
        processingStatus: aConfirmer ? 'UNCONFIRMED' : 'PENDING',
        confirmationHash: empreinteDeConfirmation,
        progress: 0,
        step: aConfirmer ? 'Awaiting confirmation' : 'Queued',
        locale: LocaleCode.resolve(data.locale).value,
        redirectChain: [],
        keyChecks: {},
        quickWins: [],
        pillarScores: {},
      },
      data,
    );

    return {
      message: 'Audit request created successfully.',
      auditId: entity.id,
      status: entity.processingStatus,
      heuresDeValiditeDeLaConfirmation: aConfirmer
        ? HEURES_DE_VALIDITE_D_UNE_CONFIRMATION
        : null,
    };
  }

  async confirmer(empreinteDeConfirmation: string): Promise<string | null> {
    const resultat = await this.repo
      .createQueryBuilder()
      .update()
      .set({
        processingStatus: 'PENDING',
        step: 'Queued',
        confirmationHash: null,
        confirmeeLe: () => 'LOCALTIMESTAMP',
      })
      .where({
        confirmationHash: empreinteDeConfirmation,
        processingStatus: 'UNCONFIRMED',
        createdAt: poseeDepuisMoinsDe(VALIDITE_D_UNE_CONFIRMATION_MS),
      })
      .returning(['id'])
      .execute();
    const [ligne] = resultat.raw as readonly { id: string }[];
    return ligne?.id ?? null;
  }

  sousVerrouDeLaBoite<T>(
    contactValue: string,
    travail: (depot: IAuditRequestsRepository) => Promise<T>,
  ): Promise<T> {
    return enTransactionSurLaBoite(
      this.repo,
      contactValue,
      (repo) => new AuditRequestsRepositoryTypeORM(repo),
      travail,
    );
  }

  async secondesAvantLaSortieDesDemandesVers(
    contactValue: string,
    fenetreMs: number,
  ): Promise<readonly number[]> {
    const { selection, parametres } = secondesAvantDeSortirDeLaFenetre(
      'demande.createdAt',
      fenetreMs,
    );
    const lignes = await this.repo
      .createQueryBuilder('demande')
      .select(selection, 'secondes')
      .where({
        boite: boiteDeLivraison(contactValue),
        createdAt: poseeDepuisMoinsDe(fenetreMs),
      })
      .setParameters(parametres)
      .orderBy('demande.createdAt', 'ASC')
      .getRawMany<{ secondes: string }>();
    return lignes.map(({ secondes }) => Number(secondes));
  }

  async findById(id: string): Promise<AuditSnapshot | null> {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) return null;
    return this.toSnapshot(entity);
  }

  async findSummaryById(id: string): Promise<AuditSummarySnapshot | null> {
    const entity = await this.repo.findOne({
      where: { id },
      select: {
        id: true,
        processingStatus: true,
        progress: true,
        summaryText: true,
        keyChecks: true,
        quickWins: true,
        pillarScores: true,
      },
    });

    if (!entity) return null;

    return {
      auditId: entity.id,
      ready: entity.processingStatus === 'COMPLETED',
      status: entity.processingStatus,
      progress: entity.progress,
      summaryText: entity.summaryText ?? null,
      keyChecks: this.safeObject(entity.keyChecks),
      quickWins: this.safeStringArray(entity.quickWins),
      pillarScores: this.safeNumberObject(entity.pillarScores),
    };
  }

  async updateState(id: string, state: UpdateAuditStateInput): Promise<void> {
    const payload: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    for (const key of UPDATABLE_STATE_KEYS) {
      const value = state[key];
      if (value !== undefined) payload[key] = value;
    }

    await this.repo
      .createQueryBuilder()
      .update(AuditRequestEntity)
      .set(payload)
      .where('id = :id', { id })
      .execute();
  }

  private toSnapshot(entity: AuditRequestEntity): AuditSnapshot {
    return {
      id: entity.id,
      requestId: entity.requestId,
      websiteName: entity.websiteName,
      contactMethod: entity.contactMethod as MethodeDeContact,
      contactValue: entity.contactValue,
      locale: LocaleCode.resolve(entity.locale).value,
      done: entity.done,
      processingStatus: entity.processingStatus ?? 'PENDING',
      progress: entity.progress ?? 0,
      step: entity.step ?? null,
      error: entity.error ?? null,
      normalizedUrl: entity.normalizedUrl ?? null,
      finalUrl: entity.finalUrl ?? null,
      redirectChain: this.safeStringArray(entity.redirectChain),
      keyChecks: this.safeObject(entity.keyChecks),
      quickWins: this.safeStringArray(entity.quickWins),
      pillarScores: this.safeNumberObject(entity.pillarScores),
      summaryText: entity.summaryText ?? null,
      fullReport: this.safeNullableObject(entity.fullReport),
      clientReport: entity.clientReport ?? null,
      expertReport: entity.expertReport ?? null,
      engineCoverage: entity.engineCoverage ?? null,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      startedAt: entity.startedAt ?? null,
      finishedAt: entity.finishedAt ?? null,
    };
  }

  private safeStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is string => typeof item === 'string');
  }

  private safeObject(value: unknown): Record<string, unknown> {
    return this.safeNullableObject(value) ?? {};
  }

  private safeNullableObject(value: unknown): Record<string, unknown> | null {
    return estObjet(value) ? value : null;
  }

  private safeNumberObject(value: unknown): Record<string, number> {
    const output: Record<string, number> = {};
    for (const [key, entry] of Object.entries(this.safeObject(value))) {
      if (typeof entry === 'number' && Number.isFinite(entry)) {
        output[key] = entry;
      }
    }
    return output;
  }
}
