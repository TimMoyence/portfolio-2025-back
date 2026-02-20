import { BadRequestException } from '@nestjs/common';
import { DomainValidationError } from '../../../../common/domain/errors/DomainValidationError';
import { Contacts } from '../../domain/Contacts';
import { CreateContactCommand } from '../dto/CreateContact.command';

export class ContactMapper {
  static fromCreateCommand(command: CreateContactCommand): Contacts {
    try {
      return Contacts.create(command);
    } catch (error) {
      if (error instanceof DomainValidationError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }
}
