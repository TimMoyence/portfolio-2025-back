import { BadRequestException } from '@nestjs/common';
import { DomainValidationError } from '../../../../common/domain/errors/DomainValidationError';
import { Redirects } from '../../domain/Redirects';
import { CreateRedirectCommand } from '../dto/CreateRedirect.command';

export class RedirectMapper {
  static fromCreateCommand(command: CreateRedirectCommand): Redirects {
    try {
      return Redirects.create(command);
    } catch (error) {
      if (error instanceof DomainValidationError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }
}
