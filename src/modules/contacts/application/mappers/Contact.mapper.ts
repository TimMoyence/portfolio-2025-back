import { mapDomainValidation } from '../../../../common/application/mappers/map-domain-validation';
import { Contacts } from '../../domain/Contacts';
import { CreateContactCommand } from '../dto/CreateContact.command';

export class ContactMapper {
  static fromCreateCommand(command: CreateContactCommand): Contacts {
    return mapDomainValidation(() => Contacts.create(command));
  }
}
