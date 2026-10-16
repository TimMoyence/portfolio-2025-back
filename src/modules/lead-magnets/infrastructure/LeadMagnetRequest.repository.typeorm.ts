import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { DepotEnDomaine } from '../../../common/infrastructure/typeorm/DepotEnDomaine';
import type { ILeadMagnetRequestRepository } from '../domain/ILeadMagnetRequestRepository';
import { LeadMagnetRequest } from '../domain/LeadMagnetRequest';
import { LeadMagnetRequestEntity } from './entities/LeadMagnetRequest.entity';

@Injectable()
export class LeadMagnetRequestRepositoryTypeORM
  extends DepotEnDomaine<LeadMagnetRequestEntity, LeadMagnetRequest>
  implements ILeadMagnetRequestRepository
{
  constructor(
    @InjectRepository(LeadMagnetRequestEntity)
    repo: Repository<LeadMagnetRequestEntity>,
  ) {
    super(repo);
  }

  create(data: LeadMagnetRequest): Promise<LeadMagnetRequest> {
    return this.enregistrer({
      firstName: data.firstName,
      email: data.email,
      formationSlug: data.formationSlug,
      termsVersion: data.termsVersion,
      termsLocale: data.termsLocale,
      termsAcceptedAt: data.termsAcceptedAt,
      profile: data.profile ?? ({} as LeadMagnetRequestEntity['profile']),
    });
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

  findByToken(accessToken: string): Promise<LeadMagnetRequest | null> {
    return this.trouver({ accessToken });
  }

  protected toDomain(entity: LeadMagnetRequestEntity): LeadMagnetRequest {
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
