import { PATH_METADATA, METHOD_METADATA } from '@nestjs/common/constants';
import { RequestMethod } from '@nestjs/common';
import { DECORATORS } from '@nestjs/swagger/dist/constants';
import { IS_PUBLIC_KEY } from '../../auth/public.decorator';
import { FormulairePublic, LienPublic } from '../formulaire-public.decorator';
import {
  limiteDeThrottle,
  methodeDe,
} from '../../../../../test/helpers/metadonnees-de-route';

class ControleurTemoin {
  @FormulairePublic(4, 'inscription')
  soumettre(): void {}

  @LienPublic()
  suivreLeLien(): void {}
}

const handler = methodeDe(ControleurTemoin, 'soumettre');

const attendreLe429Documente = (gestionnaire: object) =>
  expect(
    Reflect.getMetadata(DECORATORS.API_RESPONSE, gestionnaire),
  ).toMatchObject({ '429': { description: 'Trop de requetes' } });

describe('LienPublic', () => {
  const lien = methodeDe(ControleurTemoin, 'suivreLeLien');

  it('ouvre la route sans authentification', () => {
    expect(Reflect.getMetadata(IS_PUBLIC_KEY, lien)).toBe(true);
  });

  it('documente le refus 429 de sa limite', () => {
    attendreLe429Documente(lien);
  });

  it('limite les clics a dix par minute', () => {
    expect(limiteDeThrottle(lien)).toMatchObject({
      limite: 10,
      fenetre: 60000,
    });
  });
});

describe('FormulairePublic', () => {
  it('ouvre la route sans authentification', () => {
    expect(Reflect.getMetadata(IS_PUBLIC_KEY, handler)).toBe(true);
  });

  it('limite les soumissions par heure', () => {
    expect(limiteDeThrottle(handler)).toMatchObject({
      limite: 4,
      fenetre: 3600000,
    });
  });

  it('documente le refus 429 de sa limite', () => {
    attendreLe429Documente(handler);
  });

  it('expose la route en POST sur le chemin donne', () => {
    expect(Reflect.getMetadata(METHOD_METADATA, handler)).toBe(
      RequestMethod.POST,
    );
    expect(Reflect.getMetadata(PATH_METADATA, handler)).toBe('inscription');
  });
});
