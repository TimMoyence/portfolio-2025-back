import {
  buildCoursDeTest,
  EN_CATALOGUE,
} from '../../../../../test/factories/cours.factory';
import {
  buildCasAQuestionsLibres,
  buildCoursDeBriques,
} from '../../../../../test/factories/ecrans-stockes.factory';
import { lireCoursStocke } from './CoursStocke';
import { ResourceNotFoundError } from '../../../../common/domain/errors/ResourceNotFoundError';
import type { Ecran } from '../contrats/cours';
import { EcranNonServiError } from '../errors/FormationErrors';
import {
  activitesLibres,
  assertEcranServi,
  dernierEcranServi,
  rangDeLaQuestion,
  rangDeLEcran,
} from './EcranServi';
import type { DiffusionDeSeance } from './EcranServi';

const PILOTE: DiffusionDeSeance = {
  etat: 'en_cours',
  modeRythme: 'pilote',
  ecranCourant: 2,
  intervalleLibre: null,
};

describe('dernierEcranServi', () => {
  it('sert jusqu a l ecran courant en rythme pilote', () => {
    expect(dernierEcranServi(PILOTE, 7)).toBe(2);
  });

  it('sert tout le cours en rythme libre sans intervalle', () => {
    expect(dernierEcranServi({ ...PILOTE, modeRythme: 'libre' }, 7)).toBe(6);
  });

  it('sert jusqu au dernier ecran de l intervalle libre', () => {
    expect(
      dernierEcranServi(
        {
          ...PILOTE,
          modeRythme: 'libre',
          intervalleLibre: { premier: 1, dernier: 4 },
        },
        7,
      ),
    ).toBe(4);
  });

  it('sert tout le cours une fois la seance terminee', () => {
    expect(dernierEcranServi({ ...PILOTE, etat: 'terminee' }, 7)).toBe(6);
  });
});

describe('assertEcranServi', () => {
  it('laisse passer un ecran deja projete', () => {
    expect(() => {
      assertEcranServi(PILOTE, 2, 'E-NUM', 7);
    }).not.toThrow();
  });

  it('refuse un ecran a venir', () => {
    expect(() => {
      assertEcranServi(PILOTE, 3, 'E-CONCEPT', 7);
    }).toThrow(EcranNonServiError);
  });

  it('refuse un ecran absent du cours', () => {
    expect(() => {
      assertEcranServi(PILOTE, -1, 'E-INCONNU', 7);
    }).toThrow(EcranNonServiError);
  });

  it('borne le rythme libre sans connaitre le nombre d ecrans', () => {
    expect(() => {
      assertEcranServi(
        {
          ...PILOTE,
          modeRythme: 'libre',
          intervalleLibre: { premier: 0, dernier: 1 },
        },
        2,
        'E-NUM',
      );
    }).toThrow(EcranNonServiError);
  });

  it('porte le code ECRAN_NON_SERVI', () => {
    expect(new EcranNonServiError('E-CONCEPT').code).toBe('ECRAN_NON_SERVI');
  });

  it('se presente comme une ressource absente, donc en 404', () => {
    expect(new EcranNonServiError('E-CONCEPT')).toBeInstanceOf(
      ResourceNotFoundError,
    );
  });
});

describe('rangDeLEcran', () => {
  it('rend le rang de l ecran vise', () => {
    expect(rangDeLEcran(buildCoursDeTest(), 'E-NUM')).toBe(2);
  });

  it('rend moins un pour un ecran inconnu', () => {
    expect(rangDeLEcran(buildCoursDeTest(), 'E-INCONNU')).toBe(-1);
  });
});

describe('rangDeLaQuestion', () => {
  it('rend le rang de l ecran qui porte la question', () => {
    expect(rangDeLaQuestion(buildCoursDeTest(), 'Q-TEST-NUM')).toBe(2);
  });

  it('rend moins un pour une question qui ne figure sur aucun ecran', () => {
    expect(rangDeLaQuestion(buildCoursDeTest(), 'Q-HORS-COURS')).toBe(-1);
  });
});

describe('activitesLibres', () => {
  const activites = activitesLibres(buildCoursDeTest());

  it('admet une activite par etape d exemple travaille', () => {
    expect(activites.get('E-REM')).toEqual(['E-REM:etape-1']);
  });

  it('admet le texte du rappel d ouverture', () => {
    expect(activites.get('E-OUV')).toEqual(['Q-TEST-RAPPEL:rappel']);
  });

  it('admet le texte argumente du billet de sortie', () => {
    expect(activites.get('E-EXIT')).toEqual(['Q-TEST-EXIT']);
  });

  it('n admet aucune activite sur un ecran sans texte libre', () => {
    expect(activites.has('E-NUM')).toBe(false);
  });

  it('admet la reflexion d un ecran de rendu v2', () => {
    const cours = buildCoursDeTest();
    const reflexion: Ecran = {
      ...EN_CATALOGUE,
      id: 'E-REFLEXION',
      dureeMinutes: 3,
      concepts: ['proportion'],
      notes: 'Réflexion',
      brique: 'fp-story',
      proprietes: {
        presentation: {
          version: 2 as const,
          screenId: 'E-REFLEXION',
          renderer: 'reflection' as const,
          props: {
            promptData: {
              id: 'reflexion-1',
              type: 'reflection' as const,
              question: 'Que retenez-vous ?',
            },
          },
        },
      },
    };
    expect(
      activitesLibres({ ...cours, ecrans: [reflexion] }).get('E-REFLEXION'),
    ).toEqual(['reflexion-1']);
  });

  it('L3 · admet une activite par question libre d un cas professionnel', () => {
    const cours = lireCoursStocke(
      buildCoursDeBriques([buildCasAQuestionsLibres()]),
    );

    expect(activitesLibres(cours).get('B2-01-A1-03-MISSION')).toEqual([
      'b2-01-a1-mission:mesure',
      'b2-01-a1-mission:comparable',
    ]);
  });
});
