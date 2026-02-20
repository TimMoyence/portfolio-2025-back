import { BadRequestException } from '@nestjs/common';
import { DomainValidationError } from '../../../../common/domain/errors/DomainValidationError';
import { AuditRequest } from '../../domain/AuditRequest';
import { CreateAuditRequestCommand } from '../dto/CreateAuditRequest.command';

export class AuditRequestMapper {
  static fromCreateCommand(command: CreateAuditRequestCommand): AuditRequest {
    try {
      return AuditRequest.create(command);
    } catch (error) {
      if (error instanceof DomainValidationError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }
}
