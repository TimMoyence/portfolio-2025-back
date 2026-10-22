import {
  attendreUneProvenanceBornee,
  PROVENANCE_DEMESUREE,
} from '../../../../test/helpers/provenance';
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
      termsLocale: 'fr',
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
    ).toThrow(new DomainValidationError('Invalid contact email'));
  });

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

  it('refuse un contact dont les conditions ne sont pas acceptées', () => {
    expect(() =>
      Contacts.create({ ...VALID_CONTACT_PROPS, terms: false }),
    ).toThrow(DomainValidationError);
  });

  it('devrait refuser un terms non boolean', () => {
    expect(() =>
      Contacts.create({
        ...VALID_CONTACT_PROPS,
        terms: 'oui' as unknown as boolean,
      }),
    ).toThrow(DomainValidationError);
  });

  it('devrait accepter termsLocale undefined', () => {
    const contact = Contacts.create({ ...VALID_CONTACT_PROPS });
    expect(contact.termsLocale).toBeUndefined();
  });

  it.each([['xx-INVALID-TOO-LONG'], ['fr-FR']])(
    'devrait refuser la termsLocale %p',
    (termsLocale) => {
      expect(() =>
        Contacts.create({
          ...VALID_CONTACT_PROPS,
          termsLocale,
        }),
      ).toThrow(new DomainValidationError('Invalid terms locale'));
    },
  );

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

  it('devrait gerer termsVersion et termsMethod', () => {
    const contact = Contacts.create({
      ...VALID_CONTACT_PROPS,
      termsVersion: '1.0',
      termsMethod: 'checkbox',
    });
    expect(contact.termsVersion).toBe('1.0');
    expect(contact.termsMethod).toBe('checkbox');
  });

  it('porte la provenance de la requête, nettoyée', () => {
    const contact = Contacts.create({
      ...VALID_CONTACT_PROPS,
      ip: ' 203.0.113.7 ',
      userAgent: 'agent-de-test',
      referer: 'https://asilidesign.fr/fr/contact',
    });

    expect(contact.ip).toBe('203.0.113.7');
    expect(contact.userAgent).toBe('agent-de-test');
    expect(contact.referer).toBe('https://asilidesign.fr/fr/contact');
  });

  it('consigne une provenance absente comme nulle', () => {
    const contact = Contacts.create({
      ...VALID_CONTACT_PROPS,
      ip: null,
      userAgent: '   ',
    });

    expect(contact.ip).toBeNull();
    expect(contact.userAgent).toBeNull();
    expect(contact.referer).toBeNull();
  });

  it('borne la provenance consignée', () => {
    attendreUneProvenanceBornee(
      Contacts.create({ ...VALID_CONTACT_PROPS, ...PROVENANCE_DEMESUREE }),
    );
  });

  it('devrait refuser une termsVersion trop longue', () => {
    expect(() =>
      Contacts.create({
        ...VALID_CONTACT_PROPS,
        termsVersion: 'a'.repeat(51),
      }),
    ).toThrow(DomainValidationError);
  });

  it('normalise un telephone et nomme le champ d un telephone invalide', () => {
    expect(
      Contacts.create({ ...VALID_CONTACT_PROPS, phone: ' 06 12 34 56 78 ' })
        .phone,
    ).toBe('0612345678');
    expect(() =>
      Contacts.create({ ...VALID_CONTACT_PROPS, phone: 'abc' }),
    ).toThrow(new DomainValidationError('Invalid contact phone number'));
  });

  it('nomme le drapeau des conditions quand il n est pas booleen', () => {
    expect(() =>
      Contacts.create({
        ...VALID_CONTACT_PROPS,
        terms: 'true' as unknown as boolean,
      }),
    ).toThrow(new DomainValidationError('Invalid terms flag'));
  });

  it.each([
    ['termsVersion', 'Invalid contact terms version'],
    ['termsMethod', 'Invalid contact terms method'],
    ['termsLocale', 'Invalid terms locale'],
  ])('refuse un %s non textuel', (champ, message) => {
    expect(() =>
      Contacts.create({
        ...VALID_CONTACT_PROPS,
        [champ]: 42 as unknown as string,
      }),
    ).toThrow(new DomainValidationError(message));
  });
});
