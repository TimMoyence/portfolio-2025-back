import { Inject, Injectable } from '@nestjs/common';
import { CookieConsentResponse } from '../domain/CookieConsentResponse';
import type { ICookieConsentsRepository } from '../domain/ICookieConsents.repository';
import { COOKIE_CONSENTS_REPOSITORY } from '../domain/token';
import { CreateCookieConsentCommand } from './dto/CreateCookieConsent.command';
import { CookieConsentMapper } from './mappers/CookieConsent.mapper';

@Injectable()
export class CreateCookieConsentsUseCase {
  constructor(
    @Inject(COOKIE_CONSENTS_REPOSITORY)
    private readonly repo: ICookieConsentsRepository,
  ) {}

  async execute(data: CreateCookieConsentCommand): Promise<CookieConsentResponse> {
    const consent = CookieConsentMapper.fromCreateCommand(data);
    return this.repo.create(consent);
  }
}
