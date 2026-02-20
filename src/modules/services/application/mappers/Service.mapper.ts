import { BadRequestException } from '@nestjs/common';
import { DomainValidationError } from '../../../../common/domain/errors/DomainValidationError';
import { Services } from '../../domain/Services';
import { CreateServiceCommand } from '../dto/CreateService.command';

export class ServiceMapper {
  static fromCreateCommand(command: CreateServiceCommand): Services {
    try {
      return Services.create(command);
    } catch (error) {
      if (error instanceof DomainValidationError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }
}
