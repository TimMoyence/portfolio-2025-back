import { ESPACE_INSECABLE as INSECABLE } from '../texte/nettoyage/sans-espaces-typographiques';
import {
  avecVirgule,
  enEuros,
  enPourcent,
  ecrituresEnPourcentage,
  nombreAffiche,
  nombreFrancais,
  nombreSommable,
  pourcentageAffiche,
  VALEUR_ABSENTE,
} from './ecriture-francaise';

const FINE = ' ';

describe('nombreAffiche', () => {
  it.each([
    [12500.5, 2, 2, `12${FINE}500,50`],
    [6400, 2, 0, `6${FINE}400`],
    [1234567.891, 2, 2, `1${FINE}234${FINE}567,89`],
    [-12345.6, 1, 1, `-12${FINE}345,6`],
    [0.45678, 4, 0, '0,4568'],
    [1.005, 2, 2, '1,01'],
    [-0.001, 2, 0, '0'],
  ])(
    'F-11 · écrit %p avec au plus %p et au moins %p décimales en %p',
    (valeur, decimales, decimalesMin, attendue) => {
      expect(nombreAffiche(valeur, decimales, decimalesMin)).toBe(attendue);
    },
  );

  it('écrit un tiret pour une valeur absente', () => {
    expect(nombreAffiche(null, 2)).toBe(VALEUR_ABSENTE);
  });
});

describe('nombreFrancais', () => {
  it.each([
    [1234567.891, 2, '1 234 567,89'],
    [1234, 0, '1 234'],
    [999, 0, '999'],
    [0.5, 2, '0,50'],
    [-12345.6, 1, '-12 345,6'],
  ])('écrit %p avec %p décimales en %p', (valeur, decimales, attendue) => {
    expect(nombreFrancais(valeur, decimales)).toBe(attendue);
  });
});

describe('enEuros', () => {
  it.each([
    [1_340_208, '1 340 208 €'],
    [77_850.4, '77 850 €'],
    [-27_862, '-27 862 €'],
  ])('écrit le montant %p à l euro près : %p', (valeur, attendue) => {
    expect(enEuros(valeur)).toBe(attendue);
  });
});

describe('enPourcent', () => {
  it.each([
    [27.25, '27,3 %'],
    [(0.1 + 0.2) * 100, '30,0 %'],
    [-12.04, '-12,0 %'],
  ])('écrit le taux %p au dixième de point : %p', (valeur, attendue) => {
    expect(enPourcent(valeur)).toBe(attendue);
  });
});

describe('ecrituresEnPourcentage', () => {
  it.each([
    [0.425, ['42,5 %', '42,5%', '42,50 %', '42,50%']],
    [0.12345, ['12,345 %', '12,345%']],
    [0, ['0 %', '0%', '0,00 %', '0,00%']],
    [0.1 + 0.2, ['30 %', '30%', '30,00 %', '30,00%']],
  ])(
    'PCT-01 · écrit la part %p en pourcentage au millionième, et à deux décimales quand elles valent autant : %p',
    (part, attendues) => {
      expect(ecrituresEnPourcentage(part)).toEqual(attendues);
    },
  );
});

describe('pourcentageAffiche', () => {
  it.each([
    [0.85, '85'],
    [1, '100'],
    [0.004, '0'],
    [0.125, '13'],
  ])(
    'D-04 · écrit la part %p en %p pour cent, liés par une insécable',
    (part, attendu) => {
      expect(pourcentageAffiche(part)).toBe(`${attendu}${INSECABLE}%`);
    },
  );
});

describe('nombreSommable', () => {
  it.each([
    [12500.5, '12500,5'],
    [-12.5, '-12,5'],
    [1e-7, '0,0000001'],
    [1338.23, '1338,23'],
    [0, '0'],
  ])(
    'D-04 · écrit %p en %p, que l Excel français lit en nombre',
    (valeur, attendue) => {
      expect(nombreSommable(valeur)).toBe(attendue);
    },
  );
});

describe('avecVirgule', () => {
  it('fixe le nombre de décimales sans grouper les milliers', () => {
    expect(avecVirgule(1234.5, 2)).toBe('1234,50');
  });

  it('garde l écriture la plus courte sans décimales imposées', () => {
    expect(avecVirgule(12.25)).toBe('12,25');
    expect(avecVirgule(40)).toBe('40');
  });
});
