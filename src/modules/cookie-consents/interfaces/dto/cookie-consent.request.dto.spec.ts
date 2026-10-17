import { buildChoixDeConsentement } from '../../../../../test/factories/cookie-consents.factory';
import { champsRefuses } from '../../../../../test/helpers/validation-pipe';
import {
  CookieConsent,
  type CreateCookieConsentProps,
} from '../../domain/CookieConsent';
import { CookieConsentRequestDto } from './cookie-consent.request.dto';

type ChampListe = 'source' | 'action';

const CANDIDATS: Record<ChampListe, string[]> = {
  source: ['banner', 'settings', 'footer', 'BANNER', ''],
  action: [
    'accept_all',
    'essential_only',
    'save_preferences',
    'withdraw',
    'reject_all',
    '',
  ],
};

const leDtoAdmet = (champ: ChampListe, valeur: string) =>
  !champsRefuses(CookieConsentRequestDto, {
    ...buildChoixDeConsentement(),
    [champ]: valeur,
  }).includes(champ);

const leDomaineAdmet = (champ: ChampListe, valeur: string) => {
  try {
    CookieConsent.create({
      ...buildChoixDeConsentement(),
      [champ]: valeur,
    } as CreateCookieConsentProps);
    return true;
  } catch {
    return false;
  }
};

describe('CookieConsentRequestDto', () => {
  it.each(Object.keys(CANDIDATS) as ChampListe[])(
    'admet exactement les valeurs de %s que le domaine admet',
    (champ) => {
      const verdicts = CANDIDATS[champ].map((valeur) => ({
        valeur,
        dto: leDtoAdmet(champ, valeur),
        domaine: leDomaineAdmet(champ, valeur),
      }));

      expect(verdicts.filter(({ dto, domaine }) => dto !== domaine)).toEqual(
        [],
      );
      expect(verdicts.filter(({ dto }) => dto).length).toBeGreaterThan(1);
    },
  );
});
