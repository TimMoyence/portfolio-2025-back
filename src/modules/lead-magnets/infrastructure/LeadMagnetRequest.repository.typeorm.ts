import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import type { ILeadMagnetRequestRepository } from '../domain/ILeadMagnetRequestRepository';
import { LeadMagnetRequest } from '../domain/LeadMagnetRequest';
import { LeadMagnetRequestEntity } from './entities/LeadMagnetRequest.entity';

/** Implementation TypeORM du repository de demandes de lead magnet. */
@Injectable()
export class LeadMagnetRequestRepositoryTypeORM implements ILeadMagnetRequestRepository {
  constructor(
    @InjectRepository(LeadMagnetRequestEntity)
    private readonly repo: Repository<LeadMagnetRequestEntity>,
  ) {}

  async create(data: LeadMagnetRequest): Promise<LeadMagnetRequest> {
    const entity = this.repo.create({
      firstName: data.firstName,
      email: data.email,
      formationSlug: data.formationSlug,
      termsVersion: data.termsVersion,
      termsLocale: data.termsLocale,
      termsAcceptedAt: data.termsAcceptedAt,
      profile: data.profile ?? ({} as LeadMagnetRequestEntity['profile']),
    });
    const saved = await this.repo.save(entity);
    return this.toDomain(saved);
  }

  async existsRecentByEmail(
    email: string,
    formationSlug: string,
  ): Promise<boolean> {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const count = await this.repo.count({
      where: {
        email,
        formationSlug,
        createdAt: MoreThan(twentyFourHoursAgo),
      },
    });
    return count > 0;
  }

  async findByToken(accessToken: string): Promise<LeadMagnetRequest | null> {
    const entity = await this.repo.findOne({ where: { accessToken } });
    if (!entity) return null;
    return this.toDomain(entity);
  }

  /** Mappe une entite TypeORM vers le modele domaine. */
  private toDomain(entity: LeadMagnetRequestEntity): LeadMagnetRequest {
    const request = new LeadMagnetRequest();
    request.id = entity.id;
    request.firstName = entity.firstName;
    request.email = entity.email;
    request.formationSlug = entity.formationSlug;
    request.termsVersion = entity.termsVersion;
    request.termsLocale = entity.termsLocale;
    request.termsAcceptedAt = entity.termsAcceptedAt;
    request.accessToken = entity.accessToken;
    request.profile = entity.profile;
    request.createdAt = entity.createdAt;
    return request;
  }
}
