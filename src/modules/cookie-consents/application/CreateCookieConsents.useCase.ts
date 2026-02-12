import { Inject, Injectable } from '@nestjs/common';
import { CookieConsent } from '../domain/CookieConsent';
import { CookieConsentResponse } from '../domain/CookieConsentResponse';
import type { ICookieConsentsRepository } from '../domain/ICookieConsents.repository';
import { COOKIE_CONSENTS_REPOSITORY } from '../domain/token';

@Injectable()
export class CreateCookieConsentsUseCase {
  constructor(
    @Inject(COOKIE_CONSENTS_REPOSITORY)
    private readonly repo: ICookieConsentsRepository,
  ) {}

  async execute(data: CookieConsent): Promise<CookieConsentResponse> {
    return this.repo.create(data);
  }
}
