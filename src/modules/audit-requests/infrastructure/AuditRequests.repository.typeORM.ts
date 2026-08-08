import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';
import {
  AuditSnapshot,
  AuditSummarySnapshot,
  UpdateAuditStateInput,
} from '../domain/AuditProcessing';
import { AuditRequest } from '../domain/AuditRequest';
import { AuditRequestResponse } from '../domain/AuditRequestResponse';
import type { IAuditRequestsRepository } from '../domain/IAuditRequests.repository';
import { resolveAuditLocale } from '../domain/audit-locale.util';
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
export class AuditRequestsRepositoryTypeORM implements IAuditRequestsRepository {
  constructor(
    @InjectRepository(AuditRequestEntity)
    private readonly repo: Repository<AuditRequestEntity>,
  ) {}

  async create(data: AuditRequest): Promise<AuditRequestResponse> {
    const entity = this.repo.create({
      websiteName: data.websiteName,
      contactMethod: data.contactMethod,
      contactValue: data.contactValue,
      done: false,
      processingStatus: 'PENDING',
      progress: 0,
      step: 'Queued',
      locale: resolveAuditLocale(data.locale),
      ip: data.ip ?? undefined,
      userAgent: data.userAgent ?? undefined,
      referer: data.referer ?? undefined,
      requestId: randomUUID(),
      redirectChain: [],
      keyChecks: {},
      quickWins: [],
      pillarScores: {},
    });

    await this.repo.save(entity);

    return {
      message: 'Audit request created successfully.',
      auditId: entity.id,
      status: entity.processingStatus,
    };
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
      contactMethod: entity.contactMethod as 'EMAIL' | 'PHONE',
      contactValue: entity.contactValue,
      locale: resolveAuditLocale(entity.locale),
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
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    return value as Record<string, unknown>;
  }

  private safeNullableObject(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== 'object' || Array.isArray(value))
      return null;
    return value as Record<string, unknown>;
  }

  private safeNumberObject(value: unknown): Record<string, number> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    const output: Record<string, number> = {};
    for (const [key, entry] of Object.entries(
      value as Record<string, unknown>,
    )) {
      if (typeof entry === 'number' && Number.isFinite(entry)) {
        output[key] = entry;
      }
    }
    return output;
  }
}
