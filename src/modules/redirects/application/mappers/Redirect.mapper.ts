import { mapDomainValidation } from '../../../../common/application/mappers/map-domain-validation';
import { Redirects } from '../../domain/Redirects';
import { CreateRedirectCommand } from '../dto/CreateRedirect.command';

export class RedirectMapper {
  static fromCreateCommand(command: CreateRedirectCommand): Redirects {
    return mapDomainValidation(() => Redirects.create(command));
  }
}
