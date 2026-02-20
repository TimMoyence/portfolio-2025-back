import { BadRequestException } from '@nestjs/common';
import { CreateContactCommand } from '../dto/CreateContact.command';
import { ContactMapper } from './Contact.mapper';

describe('ContactMapper', () => {
  const baseCommand: CreateContactCommand = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    message: 'Hello, I would like to contact you about my project.',
    phone: null,
    subject: 'Need a quote',
    role: 'Founder',
    terms: true,
  };

  it('normalizes email and phone', () => {
    const mapped = ContactMapper.fromCreateCommand({
      ...baseCommand,
      email: '  JOHN.DOE@Example.com ',
      phone: '00 33 1 23 45 67 89',
    });

    expect(mapped.email).toBe('john.doe@example.com');
    expect(mapped.phone).toBe('+33123456789');
  });

  it('throws when email is invalid', () => {
    expect(() =>
      ContactMapper.fromCreateCommand({
        ...baseCommand,
        email: 'invalid',
      }),
    ).toThrow(BadRequestException);
  });

  it('throws when phone is provided but invalid', () => {
    expect(() =>
      ContactMapper.fromCreateCommand({
        ...baseCommand,
        phone: 'invalid-phone',
      }),
    ).toThrow(BadRequestException);
  });
});
