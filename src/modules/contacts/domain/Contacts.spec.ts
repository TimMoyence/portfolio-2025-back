import { DomainValidationError } from '../../../common/domain/errors/DomainValidationError';
import { Contacts } from './Contacts';

const VALID_CONTACT_PROPS = {
  email: 'john@example.com',
  firstName: 'John',
  lastName: 'Doe',
  phone: null,
  subject: 'Need support',
  message: 'I need support for a new enterprise feature rollout.',
  role: 'CTO',
  terms: true,
};

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
      Contacts.create({ ...VALID_CONTACT_PROPS, email: 'invalid-email' }),
    ).toThrow(DomainValidationError);
  });

  // --- Phone validation ---

  it('devrait accepter un phone null', () => {
    const contact = Contacts.create({ ...VALID_CONTACT_PROPS, phone: null });
    expect(contact.phone).toBeNull();
  });

  it('devrait refuser un phone invalide', () => {
    expect(() =>
      Contacts.create({ ...VALID_CONTACT_PROPS, phone: 'not-a-phone' }),
    ).toThrow(DomainValidationError);
  });

  it('devrait ignorer un phone vide (string)', () => {
    const contact = Contacts.create({ ...VALID_CONTACT_PROPS, phone: '' });
    expect(contact.phone).toBeNull();
  });

  // --- Terms validation ---

  it('devrait refuser un terms non boolean', () => {
    expect(() =>
      Contacts.create({
        ...VALID_CONTACT_PROPS,
        terms: 'oui' as unknown as boolean,
      }),
    ).toThrow(DomainValidationError);
  });

  // --- TermsLocale validation ---

  it('devrait accepter termsLocale undefined', () => {
    const contact = Contacts.create({ ...VALID_CONTACT_PROPS });
    expect(contact.termsLocale).toBeUndefined();
  });

  it('devrait refuser une termsLocale invalide', () => {
    expect(() =>
      Contacts.create({
        ...VALID_CONTACT_PROPS,
        termsLocale: 'xx-INVALID-TOO-LONG',
      }),
    ).toThrow(DomainValidationError);
  });

  // --- TermsAcceptedAt validation ---

  it('devrait accepter termsAcceptedAt valide', () => {
    const now = new Date();
    const contact = Contacts.create({
      ...VALID_CONTACT_PROPS,
      termsAcceptedAt: now,
    });
    expect(contact.termsAcceptedAt).toBe(now);
  });

  it('devrait refuser termsAcceptedAt invalide', () => {
    expect(() =>
      Contacts.create({
        ...VALID_CONTACT_PROPS,
        termsAcceptedAt: 'not-a-date' as unknown as Date,
      }),
    ).toThrow(DomainValidationError);
  });

  it('devrait refuser un Date avec NaN', () => {
    expect(() =>
      Contacts.create({
        ...VALID_CONTACT_PROPS,
        termsAcceptedAt: new Date('invalid'),
      }),
    ).toThrow(DomainValidationError);
  });

  // --- Optional metadata ---

  it('devrait gerer termsVersion et termsMethod', () => {
    const contact = Contacts.create({
      ...VALID_CONTACT_PROPS,
      termsVersion: '1.0',
      termsMethod: 'checkbox',
    });
    expect(contact.termsVersion).toBe('1.0');
    expect(contact.termsMethod).toBe('checkbox');
  });

  it('devrait refuser une termsVersion trop longue', () => {
    expect(() =>
      Contacts.create({
        ...VALID_CONTACT_PROPS,
        termsVersion: 'a'.repeat(51),
      }),
    ).toThrow(DomainValidationError);
  });
});
