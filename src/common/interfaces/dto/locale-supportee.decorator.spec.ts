import {
  champsRefuses,
  messagesDeRefus,
} from '../../../../test/helpers/validation-pipe';
import { ArticleListQueryDto } from '../../../modules/articles/interfaces/dto/article-list.query.dto';
import { AuditRequestRequestDto } from '../../../modules/audit-requests/interfaces/dto/audit-request.request.dto';
import { ContactRequestDto } from '../../../modules/contacts/interfaces/dto/contact.request.dto';
import { CookieConsentRequestDto } from '../../../modules/cookie-consents/interfaces/dto/cookie-consent.request.dto';
import { RequestToolkitRequestDto } from '../../../modules/lead-magnets/interfaces/dto/request-toolkit.request.dto';
import { requireLocale } from '../../domain/validation/domain-validators';
import { LocaleSupportee } from './locale-supportee.decorator';

const accepteeParLeDomaine = (valeur: unknown): boolean => {
  try {
    requireLocale(valeur, 'locale');
    return true;
  } catch {
    return false;
  }
};

class SaisieTemoin {
  @LocaleSupportee()
  locale: string;

  @LocaleSupportee({ facultative: true })
  localeFacultative?: string;
}

describe('LocaleSupportee', () => {
  it('accepte chaque locale supportee et l absence d une locale facultative', () => {
    expect(champsRefuses(SaisieTemoin, { locale: 'fr' })).toEqual([]);
    expect(
      champsRefuses(SaisieTemoin, { locale: 'en', localeFacultative: 'fr' }),
    ).toEqual([]);
  });

  it.each([['de'], ['fr-FR'], ['FR'], [''], [42]])('refuse %p', (valeur) => {
    expect(
      champsRefuses(SaisieTemoin, {
        locale: valeur,
        localeFacultative: valeur,
      }),
    ).toEqual(['locale', 'localeFacultative']);
  });

  it('nomme les locales supportees dans le message de refus', () => {
    expect(messagesDeRefus(SaisieTemoin, { locale: 'de' })).toEqual([
      'locale must be one of the following values: fr, en',
    ]);
  });

  it.each([
    ['fr'],
    ['en'],
    ['fr-FR'],
    ['en-US'],
    ['FR'],
    [' fr '],
    ['de'],
    [''],
    [42],
    [null],
  ])('juge %p comme le domaine', (valeur) => {
    expect(
      champsRefuses(SaisieTemoin, { locale: valeur }).includes('locale'),
    ).toBe(!accepteeParLeDomaine(valeur));
  });

  it.each([
    ['le contact', ContactRequestDto, 'termsLocale'],
    ['le consentement cookies', CookieConsentRequestDto, 'locale'],
    ['la boite a outils', RequestToolkitRequestDto, 'termsLocale'],
    ['la liste des articles', ArticleListQueryDto, 'locale'],
    ['la demande d audit', AuditRequestRequestDto, 'locale'],
  ])(
    'porte la regle sur la locale de %s',
    (_saisie, dto: new () => object, champ) => {
      expect(champsRefuses(dto, { [champ]: 'fr' })).not.toContain(champ);
      expect(champsRefuses(dto, { [champ]: 'en' })).not.toContain(champ);
      expect(champsRefuses(dto, { [champ]: 'de' })).toContain(champ);
    },
  );
});
