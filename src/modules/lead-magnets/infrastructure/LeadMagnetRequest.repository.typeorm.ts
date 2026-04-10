import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import type { ILeadMagnetRequestRepository } from '../domain/ILeadMagnetRequestRepository';
import type { LeadMagnetRequest } from '../domain/LeadMagnetRequest';
import { MessageLeadMagnetResponse } from '../domain/MessageLeadMagnetResponse';
import { LeadMagnetRequestEntity } from './entities/LeadMagnetRequest.entity';

/** Implementation TypeORM du repository de demandes de lead magnet. */
@Injectable()
export class LeadMagnetRequestRepositoryTypeORM implements ILeadMagnetRequestRepository {
  constructor(
    @InjectRepository(LeadMagnetRequestEntity)
    private readonly repo: Repository<LeadMagnetRequestEntity>,
  ) {}

  async create(data: LeadMagnetRequest): Promise<MessageLeadMagnetResponse> {
    const entity = this.repo.create({
      firstName: data.firstName,
      email: data.email,
      formationSlug: data.formationSlug,
      termsVersion: data.termsVersion,
      termsLocale: data.termsLocale,
      termsAcceptedAt: data.termsAcceptedAt,
    });
    await this.repo.save(entity);
    const response = new MessageLeadMagnetResponse();
    response.message = 'Lead magnet request created successfully.';
    return response;
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
}
