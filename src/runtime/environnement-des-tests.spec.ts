import {
  SMTP_ET_DKIM_ABSENTS,
  setSmtpEnv,
} from '../../test/factories/mailer.factory';
import {
  installerVariables,
  poserVariables,
} from '../../test/helpers/environnement';

const PRESENTE = 'ENVIRONNEMENT_DES_TESTS_PRESENTE';
const ABSENTE = 'ENVIRONNEMENT_DES_TESTS_ABSENTE';
const DKIM_D_AVANT = {
  SMTP_DKIM_DOMAIN: 'dkim.avant.test',
  SMTP_DKIM_SELECTOR: 'selecteur-avant',
  SMTP_DKIM_PRIVATE_KEY: 'cle-avant',
};

const lire = (...noms: string[]) => noms.map((nom) => process.env[nom]);

describe('environnement des tests', () => {
  installerVariables(
    { [PRESENTE]: 'avant', [ABSENTE]: undefined, ...DKIM_D_AVANT },
    'chaque-test',
  );

  it('poserVariables pose les variables puis rend celles d avant, absence comprise', () => {
    const restaurer = poserVariables({
      [PRESENTE]: 'pendant',
      [ABSENTE]: 'posee',
    });
    const pendant = lire(PRESENTE, ABSENTE);

    restaurer();

    expect(pendant).toEqual(['pendant', 'posee']);
    expect(lire(PRESENTE, ABSENTE)).toEqual(['avant', undefined]);
  });

  it('setSmtpEnv retire le DKIM puis rend chaque variable SMTP et DKIM d avant, surcharges comprises', () => {
    const cles = [...Object.keys(SMTP_ET_DKIM_ABSENTS), PRESENTE];
    const avant = lire(...cles);

    const restaurer = setSmtpEnv({ [PRESENTE]: 'surchargee' });
    const dkimPendant = lire(...Object.keys(DKIM_D_AVANT));
    restaurer();

    expect(dkimPendant).toEqual([undefined, undefined, undefined]);
    expect(lire(...Object.keys(DKIM_D_AVANT))).toEqual(
      Object.values(DKIM_D_AVANT),
    );
    expect(lire(...cles)).toEqual(avant);
  });
});
