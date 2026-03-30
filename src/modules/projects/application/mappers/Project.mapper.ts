import { mapDomainValidation } from '../../../../common/application/mappers/map-domain-validation';
import { Projects } from '../../domain/Projects';
import { CreateProjectCommand } from '../dto/CreateProject.command';

export class ProjectMapper {
  static fromCreateCommand(command: CreateProjectCommand): Projects {
    return mapDomainValidation(() => Projects.create(command));
  }
}
