import { Injectable } from '@nestjs/common';
import { DepotDeRequetes } from '../../../common/infrastructure/typeorm/DepotDeRequetes';
import { CookieConsent } from '../domain/CookieConsent';
import { CookieConsentResponse } from '../domain/CookieConsentResponse';
import { ICookieConsentsRepository } from '../domain/ICookieConsents.repository';
import { CookieConsentEntity } from './entities/CookieConsent.entity';

@Injectable()
export class CookieConsentsRepositoryTypeORM
  extends DepotDeRequetes(CookieConsentEntity)
  implements ICookieConsentsRepository
{
  async create(data: CookieConsent): Promise<CookieConsentResponse> {
    await this.consigner(
      {
        policyVersion: data.policyVersion,
        locale: data.locale,
        region: data.region,
        source: data.source,
        action: data.action,
        preferences: data.preferences,
      },
      data,
    );

    return {
      message: 'Cookie consent recorded successfully.',
    };
  }
}
