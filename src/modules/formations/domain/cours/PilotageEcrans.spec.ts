import {
  buildCoursAvecProductions,
  buildCoursDeTest,
} from '../../../../../test/factories/cours.factory';
import {
  buildCasAQuestionsLibres,
  buildCoursDeBriques,
  buildEcranDeBrique,
} from '../../../../../test/factories/ecrans-stockes.factory';
import type { Ecran } from '../contrats/cours';
import { lireCoursStocke } from './CoursStocke';
import type { PilotageEcran } from '../contrats/pilotage';
import {
  PhaseFermeeError,
  PhaseNonMonotoneError,
  PilotageIncompatibleError,
} from '../errors/FormationErrors';
import {
  assertEtapeNonCorrigee,
  assertPhaseOuverte,
  assertPilotageCompatible,
  fusionnerPilotage,
} from './PilotageEcrans';

const COURS = buildCoursDeTest();
const EXEMPLE = COURS.ecrans[5];
const NUMERIQUE = COURS.ecrans[2];
const CITATION = COURS.ecrans[1];

function ecranDuCours(id: string): Ecran {
  const ecran = buildCoursAvecProductions().ecrans.find(
    (candidat) => candidat.id === id,
  );
  if (ecran === undefined) {
    throw new Error(`écran absent de la factory : ${id}`);
  }
  return ecran;
}

const QUESTIONNAIRE = ecranDuCours('E-PRATIQUE');
const FEUILLE = ecranDuCours('E-FEUILLE');

describe('assertPilotageCompatible', () => {
  it('accepte un etayage sur un exemple travaille', () => {
    expect(() => {
      assertPilotageCompatible(EXEMPLE, { screenId: 'E-REM', etayage: 1 });
    }).not.toThrow();
  });

  it('refuse un etayage au-dela des etapes de l exemple', () => {
    expect(() => {
      assertPilotageCompatible(EXEMPLE, { screenId: 'E-REM', etayage: 2 });
    }).toThrow(PilotageIncompatibleError);
  });

  it('refuse un etayage sur un ecran qui n est pas un exemple travaille', () => {
    expect(() => {
      assertPilotageCompatible(NUMERIQUE, { screenId: 'E-NUM', etayage: 1 });
    }).toThrow(PilotageIncompatibleError);
  });

  it('refuse une phase de vote sur un ecran sans question jumelle', () => {
    expect(() => {
      assertPilotageCompatible(NUMERIQUE, {
        screenId: 'E-NUM',
        phase: 'revote',
      });
    }).toThrow(PilotageIncompatibleError);
  });

  it('RET-32 · accepte la revelation de la correction d un questionnaire', () => {
    expect(() => {
      assertPilotageCompatible(QUESTIONNAIRE, {
        screenId: 'E-PRATIQUE',
        revele: true,
      });
    }).not.toThrow();
  });

  it('RET-31 · accepte sur la feuille la correction par formules puis par valeurs', () => {
    expect(() => {
      assertPilotageCompatible(FEUILLE, { screenId: 'E-FEUILLE', etayage: 2 });
    }).not.toThrow();
  });

  it('RET-31 · refuse sur la feuille un troisieme niveau de correction', () => {
    expect(() => {
      assertPilotageCompatible(FEUILLE, { screenId: 'E-FEUILLE', etayage: 3 });
    }).toThrow(PilotageIncompatibleError);
  });

  it('R1 · accepte de révéler la correction d un écran porteur d une question', () => {
    expect(() => {
      assertPilotageCompatible(NUMERIQUE, { screenId: 'E-NUM', revele: true });
    }).not.toThrow();
  });

  it('R1 · refuse une révélation sur un écran sans corrigé', () => {
    expect(() => {
      assertPilotageCompatible(CITATION, {
        screenId: 'E-CITATION',
        revele: true,
      });
    }).toThrow(PilotageIncompatibleError);
  });

  describe('reglages de la machine', () => {
    const MACHINE = COURS.ecrans.find(({ id }) => id === 'E-CONCEPT') as Ecran;

    it('RET-21 · accepte les reglages de la machine sur ses parametres, dans leurs bornes', () => {
      expect(() => {
        assertPilotageCompatible(MACHINE, {
          screenId: 'E-CONCEPT',
          reglages: { prix: 250, taux: -20 },
        });
      }).not.toThrow();
    });

    it.each([
      ['un parametre inconnu', { cout: 5 }],
      ['une valeur hors bornes', { prix: 5000 }],
    ])('RET-21 · refuse %s', (_cas, reglages) => {
      expect(() => {
        assertPilotageCompatible(MACHINE, { screenId: 'E-CONCEPT', reglages });
      }).toThrow(PilotageIncompatibleError);
    });

    it('RET-21 · refuse des reglages sur un ecran qui n est pas une machine', () => {
      expect(() => {
        assertPilotageCompatible(NUMERIQUE, {
          screenId: 'E-NUM',
          reglages: { prix: 250 },
        });
      }).toThrow(PilotageIncompatibleError);
    });
  });
});

describe('pilotage des écrans de la QA B2', () => {
  const cours = lireCoursStocke(
    buildCoursDeBriques(
      ['fp-plot', 'fp-table-build', 'fp-quote'].map((brique) =>
        buildEcranDeBrique(brique),
      ),
    ),
  );
  const [TRACE, TABLEAU, CITATION_STOCKEE] = cours.ecrans;
  const CAS = lireCoursStocke(buildCoursDeBriques([buildCasAQuestionsLibres()]))
    .ecrans[0];

  it('F12 · accepte les réglages d un tracé dans les bornes de ses paramètres', () => {
    if (TRACE.brique !== 'fp-plot') throw new Error('tracé attendu');
    const [parametre] = TRACE.proprietes.parametres;

    expect(() => {
      assertPilotageCompatible(TRACE, {
        screenId: TRACE.id,
        reglages: { [parametre.cle]: parametre.max },
      });
    }).not.toThrow();
    expect(() => {
      assertPilotageCompatible(TRACE, {
        screenId: TRACE.id,
        reglages: { [parametre.cle]: parametre.max + 1 },
      });
    }).toThrow(PilotageIncompatibleError);
  });

  it('F17 · étaye la construction de tableau en deux niveaux au plus', () => {
    expect(() => {
      assertPilotageCompatible(TABLEAU, { screenId: TABLEAU.id, etayage: 2 });
    }).not.toThrow();
    expect(() => {
      assertPilotageCompatible(TABLEAU, { screenId: TABLEAU.id, etayage: 3 });
    }).toThrow(PilotageIncompatibleError);
  });

  it('révèle un écran à réponses libres et refuse un écran sans réponse', () => {
    expect(() => {
      assertPilotageCompatible(CAS, { screenId: CAS.id, revele: true });
    }).not.toThrow();
    expect(() => {
      assertPilotageCompatible(CITATION_STOCKEE, {
        screenId: CITATION_STOCKEE.id,
        revele: true,
      });
    }).toThrow(PilotageIncompatibleError);
  });

  it('F10 · accepte la projection des résultats sur tout écran', () => {
    expect(() => {
      assertPilotageCompatible(CITATION_STOCKEE, {
        screenId: CITATION_STOCKEE.id,
        resultatsProjetes: true,
      });
    }).not.toThrow();
  });
});

describe('étayage atteint (SEC-2)', () => {
  it('garde le maximum atteint quand l étayage affiché redescend', () => {
    const avance = fusionnerPilotage({}, { screenId: 'E-REM', etayage: 2 });
    const masque = fusionnerPilotage(avance, { screenId: 'E-REM', etayage: 0 });

    expect(masque['E-REM']).toEqual({ etayage: 0, etayageAtteint: 2 });
  });

  it('ne laisse pas le client poser l étayage atteint', () => {
    const demande = {
      screenId: 'E-REM',
      etayage: 0,
      etayageAtteint: 0,
    } as unknown as Parameters<typeof fusionnerPilotage>[1];

    expect(
      fusionnerPilotage(
        { 'E-REM': { etayage: 1, etayageAtteint: 1 } },
        demande,
      )['E-REM'],
    ).toEqual({ etayage: 0, etayageAtteint: 1 });
  });

  it('ferme une étape déjà corrigée même après « Masquer »', () => {
    if (EXEMPLE.brique !== 'fp-worked') throw new Error('exemple attendu');
    const [premiere] = EXEMPLE.proprietes.exemple.etapes;
    const activite = `${EXEMPLE.proprietes.exemple.id}:${premiere.id}`;

    expect(() => {
      assertEtapeNonCorrigee(
        { [EXEMPLE.id]: { etayage: 0, etayageAtteint: 1 } },
        EXEMPLE,
        activite,
      );
    }).toThrow(PhaseFermeeError);
  });
});

describe('fusionnerPilotage', () => {
  it('inscrit le pilotage d un ecran encore vierge', () => {
    expect(
      fusionnerPilotage({}, { screenId: 'E-VOTE', phase: 'discussion' }),
    ).toEqual({ 'E-VOTE': { phase: 'discussion' } });
  });

  it('conserve le pilotage des autres ecrans', () => {
    const courant: Record<string, PilotageEcran> = {
      'E-AUTRE': { etayage: 2 },
    };

    expect(
      fusionnerPilotage(courant, { screenId: 'E-VOTE', phase: 'vote' }),
    ).toEqual({ 'E-AUTRE': { etayage: 2 }, 'E-VOTE': { phase: 'vote' } });
  });

  it('avance la phase sans effacer l etayage deja pose', () => {
    expect(
      fusionnerPilotage(
        { 'E-VOTE': { phase: 'vote', etayage: 1 } },
        { screenId: 'E-VOTE', phase: 'revote' },
      ),
    ).toEqual({ 'E-VOTE': { phase: 'revote', etayage: 1 } });
  });

  it('refuse de ramener la phase en arriere', () => {
    expect(() => {
      fusionnerPilotage(
        { 'E-VOTE': { phase: 'revele' } },
        { screenId: 'E-VOTE', phase: 'discussion' },
      );
    }).toThrow(PhaseNonMonotoneError);
  });

  it('accepte de redemander la phase courante', () => {
    expect(
      fusionnerPilotage(
        { 'E-VOTE': { phase: 'revote' } },
        { screenId: 'E-VOTE', phase: 'revote' },
      ),
    ).toEqual({ 'E-VOTE': { phase: 'revote' } });
  });

  it('refuse de retirer une revelation deja faite', () => {
    expect(() => {
      fusionnerPilotage(
        { 'E-DEFI': { revele: true } },
        { screenId: 'E-DEFI', revele: false },
      );
    }).toThrow(PhaseNonMonotoneError);
  });
});

describe('assertPhaseOuverte', () => {
  it('laisse passer une question sans ouverture declaree', () => {
    expect(() => {
      assertPhaseOuverte({}, { ecranId: 'E-NUM' });
    }).not.toThrow();
  });

  it('RET-32 · ferme aux reponses un questionnaire dont la correction est revelee', () => {
    expect(() => {
      assertPhaseOuverte(
        { 'E-PRATIQUE': { revele: true } },
        { ecranId: 'E-PRATIQUE' },
      );
    }).toThrow(PhaseFermeeError);
    expect(() => {
      assertPhaseOuverte({ 'E-PRATIQUE': {} }, { ecranId: 'E-PRATIQUE' });
    }).not.toThrow();
  });

  it('accepte la principale avant toute phase pilotee', () => {
    expect(() => {
      assertPhaseOuverte({}, { ecranId: 'E-VOTE', ouverture: 'principale' });
    }).not.toThrow();
  });

  it('refuse la jumelle avant le revote', () => {
    expect(() => {
      assertPhaseOuverte({}, { ecranId: 'E-VOTE', ouverture: 'jumelle' });
    }).toThrow(PhaseFermeeError);
  });

  it('ferme les deux questions pendant la discussion', () => {
    const pilotage = { 'E-VOTE': { phase: 'discussion' as const } };

    expect(() => {
      assertPhaseOuverte(pilotage, {
        ecranId: 'E-VOTE',
        ouverture: 'principale',
      });
    }).toThrow(PhaseFermeeError);
    expect(() => {
      assertPhaseOuverte(pilotage, { ecranId: 'E-VOTE', ouverture: 'jumelle' });
    }).toThrow(PhaseFermeeError);
  });

  it('ouvre la jumelle seule au revote puis a la revelation', () => {
    for (const phase of ['revote', 'revele'] as const) {
      const pilotage = { 'E-VOTE': { phase } };
      expect(() => {
        assertPhaseOuverte(pilotage, {
          ecranId: 'E-VOTE',
          ouverture: 'jumelle',
        });
      }).not.toThrow();
      expect(() => {
        assertPhaseOuverte(pilotage, {
          ecranId: 'E-VOTE',
          ouverture: 'principale',
        });
      }).toThrow(PhaseFermeeError);
    }
  });

  it('ferme toute question d un ecran dont la correction est revelee', () => {
    const pilotage = { 'E-NUM': { revele: true } };

    expect(() => {
      assertPhaseOuverte(pilotage, { ecranId: 'E-NUM' });
    }).toThrow(PhaseFermeeError);
    expect(() => {
      assertPhaseOuverte(pilotage, { ecranId: 'E-NUM', ouverture: 'jumelle' });
    }).toThrow(PhaseFermeeError);
  });

  it('porte les codes PHASE_FERMEE et PHASE_NON_MONOTONE', () => {
    expect(new PhaseFermeeError('E-VOTE').code).toBe('PHASE_FERMEE');
    expect(new PhaseNonMonotoneError('E-VOTE').code).toBe('PHASE_NON_MONOTONE');
  });
});
