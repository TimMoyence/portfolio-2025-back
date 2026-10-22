import {
  buildCoursAvecEnigmes,
  ENIGMES_DE_TEST,
  PARCOURS_DE_TEST,
  TENTATIVES_MAX_DE_TEST,
} from '../../../../../test/factories/cours.factory';
import { buildCoursDuContenu } from '../../../../../test/factories/contenus-de-cours.factory';
import { CONTENUS } from '../../../../../test/factories/contenus-publies';
import {
  corrigerEnigme,
  ecranDEnigmes,
  enigmeOuverte,
  enigmeVisee,
  etatDesEnigmes,
} from './Enigmes';
import type { EcranDEnigmes } from './Enigmes';

const COURS = buildCoursAvecEnigmes();

function cible(): EcranDEnigmes {
  const trouve = ecranDEnigmes(COURS, PARCOURS_DE_TEST);
  if (trouve === null) {
    throw new Error('parcours absent du cours de test');
  }
  return trouve;
}

const CIBLE = cible();

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

const PARCOURS_DES_COURS: readonly (readonly [string, EcranDEnigmes])[] =
  CONTENUS.flatMap((contenu) => {
    const cours = buildCoursDuContenu(contenu);
    return cours.ecrans.flatMap((ecran) => {
      const parcours =
        ecran.brique === 'fp-escape'
          ? ecranDEnigmes(cours, ecran.proprietes.parcours.id)
          : null;
      return parcours === null ? [] : [[ecran.id, parcours] as const];
    });
  });

function idsDe(parcours: EcranDEnigmes): string[] {
  return parcours.ecran.proprietes.parcours.enigmes.map(({ id }) => id);
}

const PARCOURS_A_PLUSIEURS_ENIGMES = PARCOURS_DES_COURS.filter(
  ([, parcours]) => idsDe(parcours).length > 2,
);

describe('etatDesEnigmes', () => {
  it('trouve dans les cours servis des parcours de plus de deux énigmes', () => {
    expect(PARCOURS_A_PLUSIEURS_ENIGMES.length).toBeGreaterThan(0);
  });

  it.each(PARCOURS_DES_COURS)(
    '%s : sans tentative, ouvre la première énigme seule, toutes au plafond',
    (_ecran, parcours) => {
      const [premiere, ...suivantes] = idsDe(parcours);

      const etat = etatDesEnigmes(parcours, []);

      expect(etat.enigmeOuverte).toBe(premiere);
      expect(etat.acheve).toBe(false);
      expect(etat.etats[premiere]).toEqual({
        etat: 'ouverte',
        tentativesRestantes: parcours.tentativesMax,
      });
      expect(
        suivantes
          .map((id) => etat.etats[id].etat)
          .every((e) => e === 'verrouillee'),
      ).toBe(true);
    },
  );

  it.each(PARCOURS_A_PLUSIEURS_ENIGMES)(
    '%s : ouvre l énigme suivante après une énigme résolue, puis après une épuisée',
    (_ecran, parcours) => {
      const [premiere, seconde, troisieme] = idsDe(parcours);

      const apresResolue = etatDesEnigmes(parcours, [
        { enigmeId: premiere, tentatives: 2, resolue: true },
      ]);
      const apresEpuisee = etatDesEnigmes(parcours, [
        {
          enigmeId: premiere,
          tentatives: parcours.tentativesMax,
          resolue: false,
        },
      ]);

      expect(apresResolue.etats[premiere]).toEqual({
        etat: 'resolue',
        tentativesRestantes: parcours.tentativesMax - 2,
      });
      expect(apresResolue.enigmeOuverte).toBe(seconde);
      expect(apresEpuisee.etats[premiere]).toEqual({
        etat: 'epuisee',
        tentativesRestantes: 0,
      });
      expect(apresEpuisee.enigmeOuverte).toBe(seconde);
      expect(apresResolue.etats[troisieme].etat).toBe('verrouillee');
    },
  );

  it.each(PARCOURS_DES_COURS)(
    '%s : achève le parcours quand chaque énigme est résolue ou épuisée',
    (_ecran, parcours) => {
      const ids = idsDe(parcours);
      const progression = ids.map((enigmeId, rang) => ({
        enigmeId,
        tentatives: rang === ids.length - 1 ? parcours.tentativesMax : 1,
        resolue: rang < ids.length - 1,
      }));

      const etat = etatDesEnigmes(parcours, progression);

      expect(etat.enigmeOuverte).toBeNull();
      expect(etat.acheve).toBe(true);
      expect(ids.map((id) => etat.etats[id].etat)).toEqual([
        ...ids.slice(0, -1).map(() => 'resolue'),
        'epuisee',
      ]);
    },
  );

  it.each(PARCOURS_DES_COURS)(
    '%s : n ouvre que l énigme que la tentative accepte',
    (_ecran, parcours) => {
      const ids = idsDe(parcours);
      const progression = [{ enigmeId: ids[0], tentatives: 3, resolue: true }];

      const etat = etatDesEnigmes(parcours, progression);

      expect(ids.filter((id) => etat.etats[id].etat === 'ouverte')).toEqual(
        ids.filter(
          (id, rang) =>
            enigmeOuverte(parcours, progression, rang) &&
            !progression.some((p) => p.enigmeId === id && p.resolue),
        ),
      );
    },
  );
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

  describe('piege a la tolerance de la solution', () => {
    const avecPieges = {
      ...corrige,
      solution: {
        type: 'nombre',
        valeur: 10,
        tolerance: { type: 'absolue', valeur: 0.5 },
        formePubliee: '10',
      },
      pieges: [
        { valeur: 10.4, confusion: 'indice-lu-comme-taux' },
        { valeur: 20, confusion: 'moyenne-simple-des-taux' },
        { valeur: 20.3, confusion: 'indice-lu-comme-taux' },
      ],
    } as const;

    it.each([
      ['la solution passe avant un piege qui la recouvre', '10,4', true, null],
      [
        'le premier piege atteint gagne',
        '20,3',
        false,
        'moyenne-simple-des-taux',
      ],
      [
        'un piege se lit dans la tolerance',
        '19,6',
        false,
        'moyenne-simple-des-taux',
      ],
      ['hors de toute tolerance, aucune confusion', '30', false, null],
    ])('%s', (_cas, saisie, correcte, confusion) => {
      expect(corrigerEnigme(avecPieges, saisie)).toEqual({
        correcte,
        valeurNormalisee: Number(saisie.replace(',', '.')),
        confusion,
      });
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
