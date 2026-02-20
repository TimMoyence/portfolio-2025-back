import { BadRequestException } from '@nestjs/common';
import { DomainValidationError } from '../../../../common/domain/errors/DomainValidationError';
import { Projects } from '../../domain/Projects';
import { CreateProjectCommand } from '../dto/CreateProject.command';

export class ProjectMapper {
  static fromCreateCommand(command: CreateProjectCommand): Projects {
    try {
      return Projects.create(command);
    } catch (error) {
      if (error instanceof DomainValidationError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }
}
