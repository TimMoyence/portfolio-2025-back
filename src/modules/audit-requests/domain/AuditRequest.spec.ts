import {
  attendreUneProvenanceBornee,
  PROVENANCE_DEMESUREE,
} from '../../../../test/helpers/provenance';
import { DomainValidationError } from '../../../common/domain/errors/DomainValidationError';
import { AuditRequest } from './AuditRequest';

describe('AuditRequest aggregate', () => {
  it('creates request with normalized email and locale', () => {
    const request = AuditRequest.create({
      websiteName: '  example.com ',
      contactMethod: 'EMAIL',
      contactValue: '  HELLO@Example.com ',
      locale: 'en',
    });

    expect(request.websiteName).toBe('example.com');
    expect(request.contactValue).toBe('hello@example.com');
    expect(request.locale).toBe('en');
  });

  it('normalizes phone contact value', () => {
    const request = AuditRequest.create({
      websiteName: 'example.com',
      contactMethod: 'PHONE',
      contactValue: '00 33 6 12 34 56 78',
      locale: 'fr',
    });

    expect(request.contactValue).toBe('+33612345678');
  });

  it('throws when contact value is invalid for method', () => {
    expect(() =>
      AuditRequest.create({
        websiteName: 'example.com',
        contactMethod: 'EMAIL',
        contactValue: 'invalid',
        locale: 'fr',
      }),
    ).toThrow(new DomainValidationError('Invalid audit contact email'));
  });

  it.each([['de'], ['xx-invalid'], ['fr-FR']])(
    'refuse la locale non supportee %p au lieu de la remplacer par fr',
    (locale) => {
      expect(() =>
        AuditRequest.create({
          websiteName: 'example.com',
          contactMethod: 'EMAIL',
          contactValue: 'hello@example.com',
          locale: locale as 'fr',
        }),
      ).toThrow(new DomainValidationError('Invalid audit locale'));
    },
  );

  it.each([
    ['asilidesign.fr'],
    ['www.example.com'],
    ['https://example.com/tarifs?ref=1'],
  ])('accepte le site %p, que le pipeline sait auditer', (websiteName) => {
    const request = AuditRequest.create({
      websiteName,
      contactMethod: 'EMAIL',
      contactValue: 'hello@example.com',
      locale: 'fr',
    });

    expect(request.websiteName).toBe(websiteName);
  });

  it.each([['localhost'], ['http://localhost:3000'], ['Example Studio']])(
    'refuse a la creation le site %p, que le pipeline ne sait pas auditer',
    (websiteName) => {
      expect(() =>
        AuditRequest.create({
          websiteName,
          contactMethod: 'EMAIL',
          contactValue: 'hello@example.com',
          locale: 'fr',
        }),
      ).toThrow(new DomainValidationError('Invalid audit website'));
    },
  );

  it('borne la provenance consignée', () => {
    attendreUneProvenanceBornee(
      AuditRequest.create({
        websiteName: 'example.com',
        contactMethod: 'EMAIL',
        contactValue: 'hello@example.com',
        locale: 'fr',
        ...PROVENANCE_DEMESUREE,
      }),
    );
  });
});
