import {
  buildCoursAvecEnigmes,
  ENIGMES_DE_TEST,
  PARCOURS_DE_TEST,
  TENTATIVES_MAX_DE_TEST,
} from '../../../../../test/factories/cours.factory';
import {
  corrigerEnigme,
  ecranDEnigmes,
  enigmeOuverte,
  enigmeVisee,
} from './Enigmes';
import type { EcranDEnigmes } from './Enigmes';
import { lireNombreSaisi } from './SaisieNumerique';

const COURS = buildCoursAvecEnigmes();

function cible(): EcranDEnigmes {
  const trouve = ecranDEnigmes(COURS, PARCOURS_DE_TEST);
  if (trouve === null) {
    throw new Error('parcours absent du cours de test');
  }
  return trouve;
}

const CIBLE = cible();

describe('lireNombreSaisi', () => {
  it.each([
    ['142 920', 142920],
    ['142 920', 142920],
    ['142 920,5', 142920.5],
    ['23,4', 23.4],
    ['−2,5', -2.5],
    ['12 %', 12],
    ['12 €', 12],
    ['3 pts', 3],
    ['3 points', 3],
  ])('lit « %s » comme %p', (brut, attendu) => {
    expect(lireNombreSaisi(brut)).toBe(attendu);
  });

  it.each(['', 'douze', '1,2,3', '12x'])('refuse la saisie « %s »', (brut) => {
    expect(lireNombreSaisi(brut)).toBeNull();
  });
});

describe('ecranDEnigmes', () => {
  it('rend l ecran, son rang et le plafond de tentatives', () => {
    expect(CIBLE.ecran.id).toBe('E-COFFRE');
    expect(CIBLE.rang).toBe(COURS.ecrans.length - 1);
    expect(CIBLE.tentativesMax).toBe(TENTATIVES_MAX_DE_TEST);
  });

  it('rend null pour un parcours inconnu', () => {
    expect(ecranDEnigmes(COURS, 'P-INCONNU')).toBeNull();
  });
});

describe('enigmeVisee', () => {
  it('rend la question, son corrige et son rang', () => {
    const visee = enigmeVisee(CIBLE, ENIGMES_DE_TEST[1]);

    expect(visee?.rangEnigme).toBe(1);
    expect(visee?.corrige.fragment).toBe('F1');
  });

  it('rend null pour une enigme absente du parcours', () => {
    expect(enigmeVisee(CIBLE, 'E9-INVENTEE')).toBeNull();
  });
});

describe('enigmeOuverte', () => {
  it('ouvre toujours la premiere enigme', () => {
    expect(enigmeOuverte(CIBLE, [], 0)).toBe(true);
  });

  it('garde la suivante fermee tant que la precedente n est ni resolue ni epuisee', () => {
    expect(
      enigmeOuverte(
        CIBLE,
        [{ enigmeId: ENIGMES_DE_TEST[0], tentatives: 3, resolue: false }],
        1,
      ),
    ).toBe(false);
  });

  it('garde la suivante fermee tant que la precedente n a jamais ete tentee', () => {
    expect(enigmeOuverte(CIBLE, [], 1)).toBe(false);
  });

  it('ouvre la suivante quand la precedente est resolue', () => {
    expect(
      enigmeOuverte(
        CIBLE,
        [{ enigmeId: ENIGMES_DE_TEST[0], tentatives: 2, resolue: true }],
        1,
      ),
    ).toBe(true);
  });

  it('ouvre la suivante quand les tentatives de la precedente sont epuisees', () => {
    expect(
      enigmeOuverte(
        CIBLE,
        [
          {
            enigmeId: ENIGMES_DE_TEST[0],
            tentatives: TENTATIVES_MAX_DE_TEST,
            resolue: false,
          },
        ],
        1,
      ),
    ).toBe(true);
  });
});

describe('corrigerEnigme', () => {
  const corrige = enigmeVisee(CIBLE, ENIGMES_DE_TEST[0])!.corrige;

  it('accepte la solution ecrite a la francaise', () => {
    expect(corrigerEnigme(corrige, '23,4')).toEqual({
      correcte: true,
      valeurNormalisee: 23.4,
      confusion: null,
    });
  });

  it('accepte la solution dans la tolerance', () => {
    expect(corrigerEnigme(corrige, '23,42').correcte).toBe(true);
  });

  it('reconnait le piege declare et le nomme', () => {
    expect(corrigerEnigme(corrige, '26,666667')).toEqual({
      correcte: false,
      valeurNormalisee: 26.666667,
      confusion: 'moyenne-simple-des-taux',
    });
  });

  it('refuse une saisie illisible sans valeur normalisee', () => {
    expect(corrigerEnigme(corrige, 'je ne sais pas')).toEqual({
      correcte: false,
      valeurNormalisee: null,
      confusion: null,
    });
  });

  it('accepte une solution textuelle aux accents et a la casse pres', () => {
    expect(
      corrigerEnigme(
        {
          ...corrige,
          solution: { type: 'texte', acceptees: ['Prix médian'] },
        },
        '  prix median ',
      ).correcte,
    ).toBe(true);
  });
});
