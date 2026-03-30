import { mapDomainValidation } from '../../../../common/application/mappers/map-domain-validation';
import { Services } from '../../domain/Services';
import { CreateServiceCommand } from '../dto/CreateService.command';

export class ServiceMapper {
  static fromCreateCommand(command: CreateServiceCommand): Services {
    return mapDomainValidation(() => Services.create(command));
  }
}
