import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';
import { CookieConsent } from '../domain/CookieConsent';
import { CookieConsentResponse } from '../domain/CookieConsentResponse';
import { ICookieConsentsRepository } from '../domain/ICookieConsents.repository';
import { CookieConsentEntity } from './entities/CookieConsent.entity';

@Injectable()
export class CookieConsentsRepositoryTypeORM
  implements ICookieConsentsRepository
{
  constructor(
    @InjectRepository(CookieConsentEntity)
    private readonly repo: Repository<CookieConsentEntity>,
  ) {}

  async create(data: CookieConsent): Promise<CookieConsentResponse> {
    const entity = this.repo.create({
      policyVersion: data.policyVersion,
      locale: data.locale,
      region: data.region,
      source: data.source,
      action: data.action,
      preferences: data.preferences,
      ip: data.ip ?? undefined,
      userAgent: data.userAgent ?? undefined,
      referer: data.referer ?? undefined,
      requestId: randomUUID(),
    });

    await this.repo.save(entity);

    return {
      message: 'Cookie consent recorded successfully.',
      httpCode: 201,
    };
  }
}
