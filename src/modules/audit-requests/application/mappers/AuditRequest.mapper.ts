import { mapDomainValidation } from '../../../../common/application/mappers/map-domain-validation';
import { AuditRequest } from '../../domain/AuditRequest';
import { CreateAuditRequestCommand } from '../dto/CreateAuditRequest.command';

export class AuditRequestMapper {
  static fromCreateCommand(command: CreateAuditRequestCommand): AuditRequest {
    return mapDomainValidation(() => AuditRequest.create(command));
  }
}
