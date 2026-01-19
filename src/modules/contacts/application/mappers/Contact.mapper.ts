import { Contacts } from '../../domain/Contacts';
import { ContactDto } from '../dto/Contact.dto';

export class ContactMapper {
  static fromCreateDto(dto: ContactDto): Contacts {
    return {
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone ?? null,
      subject: dto.subject,
      message: dto.message,
      role: dto.role,
      terms: dto.terms,
    };
  }
}
