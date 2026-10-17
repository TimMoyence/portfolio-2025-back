import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { boiteDeLivraison } from '../../../common/domain/value-objects/boite-de-livraison';
import { DepotEnDomaine } from '../../../common/infrastructure/typeorm/DepotEnDomaine';
import { poseeDepuisMoinsDe } from '../../../common/infrastructure/typeorm/horloge-de-la-base';
import { enTransactionSurLaCle } from '../../../common/infrastructure/typeorm/verrou-de-transaction';
import type { ILeadMagnetRequestRepository } from '../domain/ILeadMagnetRequestRepository';
import { LeadMagnetRequest } from '../domain/LeadMagnetRequest';
import { LeadMagnetRequestEntity } from './entities/LeadMagnetRequest.entity';

const VINGT_QUATRE_HEURES_MS = 24 * 60 * 60 * 1000;

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
      boite: boiteDeLivraison(data.email),
      formationSlug: data.formationSlug,
      termsVersion: data.termsVersion,
      termsLocale: data.termsLocale,
      termsAcceptedAt: data.termsAcceptedAt,
    });
  }

  sousVerrouDeLaBoite<T>(
    email: string,
    travail: (depot: ILeadMagnetRequestRepository) => Promise<T>,
  ): Promise<T> {
    return enTransactionSurLaCle(this.repo, boiteDeLivraison(email), (repo) =>
      travail(new LeadMagnetRequestRepositoryTypeORM(repo)),
    );
  }

  existeUneDemandeRecenteVersLaBoiteDe(
    email: string,
    formationSlug: string,
  ): Promise<boolean> {
    return this.repo.exists({
      where: {
        boite: boiteDeLivraison(email),
        formationSlug,
        createdAt: poseeDepuisMoinsDe(VINGT_QUATRE_HEURES_MS),
      },
    });
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
    request.createdAt = entity.createdAt;
    return request;
  }
}
