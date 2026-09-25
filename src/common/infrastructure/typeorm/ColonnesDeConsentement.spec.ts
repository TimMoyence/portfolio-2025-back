import { getMetadataArgsStorage } from 'typeorm';
import {
  ColonneAcceptationDesConditions,
  ColonneVersionDesConditions,
} from './ColonnesDeConsentement';

class ConsentementTemoin {
  @ColonneVersionDesConditions()
  termsVersion: string;

  @ColonneAcceptationDesConditions()
  termsAcceptedAt: Date;
}

const optionsDe = (propriete: string) =>
  getMetadataArgsStorage().columns.find(
    (args) =>
      args.target === ConsentementTemoin && args.propertyName === propriete,
  )?.options;

describe('ColonnesDeConsentement', () => {
  it('stocke la version des conditions sur 50 caracteres', () => {
    expect(optionsDe('termsVersion')).toEqual({
      name: 'terms_version',
      type: 'varchar',
      length: 50,
    });
  });

  it('horodate l acceptation des conditions avec fuseau', () => {
    expect(optionsDe('termsAcceptedAt')).toEqual({
      name: 'terms_accepted_at',
      type: 'timestamptz',
    });
  });
});
