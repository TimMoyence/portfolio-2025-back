import { getMetadataArgsStorage } from 'typeorm';
import type { SupportedLocale } from '../../../domain/value-objects/LocaleCode';
import { ColonneDeLangue } from './ColonneDeLangue';

class LangueTemoin {
  @ColonneDeLangue()
  locale: SupportedLocale;

  @ColonneDeLangue('fr')
  localeParDefaut: SupportedLocale;
}

const optionsDe = (propriete: string) =>
  getMetadataArgsStorage().columns.find(
    (args) => args.target === LangueTemoin && args.propertyName === propriete,
  )?.options;

describe('ColonneDeLangue', () => {
  it('stocke la langue sur deux caracteres, sans valeur par defaut', () => {
    expect(optionsDe('locale')).toEqual({ type: 'varchar', length: 2 });
  });

  it('porte la langue par defaut demandee', () => {
    expect(optionsDe('localeParDefaut')).toEqual({
      type: 'varchar',
      length: 2,
      default: 'fr',
    });
  });
});
