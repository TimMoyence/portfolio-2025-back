import { buildCoursDeTest } from '../../../../../test/factories/cours.factory';
import type { PilotageEcran } from '../contrats/pilotage';
import {
  PhaseFermeeError,
  PhaseNonMonotoneError,
  PilotageIncompatibleError,
} from '../errors/FormationErrors';
import {
  assertPhaseOuverte,
  assertPilotageCompatible,
  fusionnerPilotage,
} from './PilotageEcrans';

const COURS = buildCoursDeTest();
const EXEMPLE = COURS.ecrans[5];
const NUMERIQUE = COURS.ecrans[2];
const CITATION = COURS.ecrans[1];

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
