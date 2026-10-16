import { DomainValidationError } from '../../../common/domain/errors/DomainValidationError';
import { buildLeadMagnetRequest } from '../../../../test/factories/lead-magnet-request.factory';

describe('LeadMagnetRequest', () => {
  it('enregistre la locale supportee des conditions', () => {
    expect(buildLeadMagnetRequest({ termsLocale: 'en' }).termsLocale).toBe(
      'en',
    );
  });

  it.each([['de'], ['xx'], [' EN '], ['en-GB']])(
    'refuse la locale des conditions non supportee %p',
    (termsLocale) => {
      expect(() => buildLeadMagnetRequest({ termsLocale })).toThrow(
        new DomainValidationError('Invalid terms locale'),
      );
    },
  );
});
