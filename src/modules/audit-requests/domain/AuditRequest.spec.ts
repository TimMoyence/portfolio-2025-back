import { DomainValidationError } from '../../../common/domain/errors/DomainValidationError';
import { AuditRequest } from './AuditRequest';

describe('AuditRequest aggregate', () => {
  it('creates request with normalized email and locale', () => {
    const request = AuditRequest.create({
      websiteName: '  Example Studio ',
      contactMethod: 'EMAIL',
      contactValue: '  HELLO@Example.com ',
      locale: 'en',
    });

    expect(request.websiteName).toBe('Example Studio');
    expect(request.contactValue).toBe('hello@example.com');
    expect(request.locale).toBe('en');
  });

  it('normalizes phone contact value', () => {
    const request = AuditRequest.create({
      websiteName: 'Example Studio',
      contactMethod: 'PHONE',
      contactValue: '00 33 6 12 34 56 78',
      locale: 'fr',
    });

    expect(request.contactValue).toBe('+33612345678');
  });

  it('throws when contact value is invalid for method', () => {
    expect(() =>
      AuditRequest.create({
        websiteName: 'Example Studio',
        contactMethod: 'EMAIL',
        contactValue: 'invalid',
        locale: 'fr',
      }),
    ).toThrow(DomainValidationError);
  });
});
