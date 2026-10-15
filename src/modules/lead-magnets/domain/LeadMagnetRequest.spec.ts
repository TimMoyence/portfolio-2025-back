import { DomainValidationError } from '../../../common/domain/errors/DomainValidationError';
import { buildLeadMagnetRequest } from '../../../../test/factories/lead-magnet-request.factory';

describe('LeadMagnetRequest', () => {
  it('enregistre la locale des conditions sous sa forme supportee', () => {
    expect(buildLeadMagnetRequest({ termsLocale: ' EN ' }).termsLocale).toBe(
      'en',
    );
  });

  it.each([['de'], ['xx']])(
    'refuse la locale des conditions non supportee %p',
    (termsLocale) => {
      expect(() => buildLeadMagnetRequest({ termsLocale })).toThrow(
        new DomainValidationError('Invalid terms locale'),
      );
    },
  );
});
