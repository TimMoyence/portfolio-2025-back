import { DomainValidationError } from '../../../common/domain/errors/DomainValidationError';
import { Contacts } from './Contacts';

describe('Contacts aggregate', () => {
  it('creates a valid contact with normalized values', () => {
    const contact = Contacts.create({
      email: '  JOHN.DOE@Example.com ',
      firstName: ' John ',
      lastName: ' Doe ',
      phone: '00 33 6 12 34 56 78',
      subject: ' Need support ',
      message: ' I need support for a new enterprise feature rollout. ',
      role: ' CTO ',
      terms: true,
      termsLocale: 'fr-FR',
    });

    expect(contact.email).toBe('john.doe@example.com');
    expect(contact.phone).toBe('+33612345678');
    expect(contact.firstName).toBe('John');
    expect(contact.lastName).toBe('Doe');
    expect(contact.subject).toBe('Need support');
    expect(contact.role).toBe('CTO');
    expect(contact.termsLocale).toBe('fr');
  });

  it('throws for invalid email', () => {
    expect(() =>
      Contacts.create({
        email: 'invalid-email',
        firstName: 'John',
        lastName: 'Doe',
        phone: null,
        subject: 'Need support',
        message: 'I need support for a new enterprise feature rollout.',
        role: 'CTO',
        terms: true,
      }),
    ).toThrow(DomainValidationError);
  });
});
