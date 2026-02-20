import { BadRequestException } from '@nestjs/common';
import { DomainValidationError } from '../../../../common/domain/errors/DomainValidationError';
import { CookieConsent } from '../../domain/CookieConsent';
import { CreateCookieConsentCommand } from '../dto/CreateCookieConsent.command';

export class CookieConsentMapper {
  static fromCreateCommand(command: CreateCookieConsentCommand): CookieConsent {
    try {
      return CookieConsent.create(command);
    } catch (error) {
      if (error instanceof DomainValidationError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }
}
