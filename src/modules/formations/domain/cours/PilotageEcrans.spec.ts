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
  type PilotageDemande,
  type QuestionPilotee,
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

function refusePar(
  refus: new (...args: never[]) => Error,
  garde: () => void,
): boolean {
  try {
    garde();
    return false;
  } catch (erreur) {
    if (erreur instanceof refus) {
      return true;
    }
    throw erreur;
  }
}

function accepte(ecran: Ecran, demande: PilotageDemande): boolean {
  return !refusePar(PilotageIncompatibleError, () => {
    assertPilotageCompatible(ecran, demande);
  });
}

function ouverte(
  pilotage: Readonly<Record<string, PilotageEcran>>,
  question: QuestionPilotee,
): boolean {
  return !refusePar(PhaseFermeeError, () => {
    assertPhaseOuverte(pilotage, question);
  });
}

const QUESTIONNAIRE = ecranDuCours('E-PRATIQUE');
const FEUILLE = ecranDuCours('E-FEUILLE');
const MACHINE = COURS.ecrans.find(({ id }) => id === 'E-CONCEPT') as Ecran;

describe('assertPilotageCompatible', () => {
  it.each<[string, Ecran, PilotageDemande, boolean]>([
    [
      'accepte un etayage sur un exemple travaille',
      EXEMPLE,
      { screenId: 'E-REM', etayage: 1 },
      true,
    ],
    [
      'refuse un etayage au-dela des etapes de l exemple',
      EXEMPLE,
      { screenId: 'E-REM', etayage: 2 },
      false,
    ],
    [
      'refuse un etayage sur un ecran qui n est pas un exemple travaille',
      NUMERIQUE,
      { screenId: 'E-NUM', etayage: 1 },
      false,
    ],
    [
      'refuse une phase de vote sur un ecran sans question jumelle',
      NUMERIQUE,
      { screenId: 'E-NUM', phase: 'revote' },
      false,
    ],
    [
      'RET-32 · accepte la revelation de la correction d un questionnaire',
      QUESTIONNAIRE,
      { screenId: 'E-PRATIQUE', revele: true },
      true,
    ],
    [
      'RET-31 · accepte sur la feuille la correction par formules puis par valeurs',
      FEUILLE,
      { screenId: 'E-FEUILLE', etayage: 2 },
      true,
    ],
    [
      'RET-31 · refuse sur la feuille un troisieme niveau de correction',
      FEUILLE,
      { screenId: 'E-FEUILLE', etayage: 3 },
      false,
    ],
    [
      'R1 · accepte de révéler la correction d un écran porteur d une question',
      NUMERIQUE,
      { screenId: 'E-NUM', revele: true },
      true,
    ],
    [
      'R1 · refuse une révélation sur un écran sans corrigé',
      CITATION,
      { screenId: 'E-CITATION', revele: true },
      false,
    ],
    [
      'RET-21 · accepte les reglages de la machine sur ses parametres, dans leurs bornes',
      MACHINE,
      { screenId: 'E-CONCEPT', reglages: { prix: 250, taux: -20 } },
      true,
    ],
    [
      'RET-21 · refuse un parametre inconnu',
      MACHINE,
      { screenId: 'E-CONCEPT', reglages: { cout: 5 } },
      false,
    ],
    [
      'RET-21 · refuse une valeur hors bornes',
      MACHINE,
      { screenId: 'E-CONCEPT', reglages: { prix: 5000 } },
      false,
    ],
    [
      'RET-21 · refuse des reglages sur un ecran qui n est pas une machine',
      NUMERIQUE,
      { screenId: 'E-NUM', reglages: { prix: 250 } },
      false,
    ],
  ])('%s', (_titre, ecran, demande, attendu) => {
    expect(accepte(ecran, demande)).toBe(attendu);
  });
});

describe('pilotage des écrans de la QA B2', () => {
  const cours = lireCoursStocke(
    buildCoursDeBriques(
      ['fp-plot', 'fp-table-build', 'fp-quote', 'fp-recall'].map((brique) =>
        buildEcranDeBrique(brique),
      ),
    ),
  );
  const [TRACE, TABLEAU, CITATION_STOCKEE, RAPPEL] = cours.ecrans;
  const CAS = lireCoursStocke(buildCoursDeBriques([buildCasAQuestionsLibres()]))
    .ecrans[0];

  it('F12 · accepte les réglages d un tracé dans les bornes de ses paramètres', () => {
    if (TRACE.brique !== 'fp-plot') throw new Error('tracé attendu');
    const [parametre] = TRACE.proprietes.parametres;
    const regler = (valeur: number) =>
      accepte(TRACE, {
        screenId: TRACE.id,
        reglages: { [parametre.cle]: valeur },
      });

    expect([regler(parametre.max), regler(parametre.max + 1)]).toEqual([
      true,
      false,
    ]);
  });

  it('F17 · étaye la construction de tableau en deux niveaux au plus', () => {
    expect([
      accepte(TABLEAU, { screenId: TABLEAU.id, etayage: 2 }),
      accepte(TABLEAU, { screenId: TABLEAU.id, etayage: 3 }),
    ]).toEqual([true, false]);
  });

  it('révèle un écran à réponses libres et refuse un écran sans réponse', () => {
    expect([
      accepte(CAS, { screenId: CAS.id, revele: true }),
      accepte(CITATION_STOCKEE, {
        screenId: CITATION_STOCKEE.id,
        revele: true,
      }),
    ]).toEqual([true, false]);
  });

  it('F10 · accepte la projection des résultats sur tout écran', () => {
    expect(
      accepte(CITATION_STOCKEE, {
        screenId: CITATION_STOCKEE.id,
        resultatsProjetes: true,
      }),
    ).toBe(true);
  });

  it('F02 · affiche tout de suite les options d un rappel et refuse ailleurs', () => {
    expect(
      [RAPPEL, CITATION_STOCKEE].map((ecran) =>
        accepte(ecran, { screenId: ecran.id, optionsAffichees: true }),
      ),
    ).toEqual([true, false]);
  });

  it('F02 · ne remasque pas des options déjà affichées', () => {
    const affichees = fusionnerPilotage(
      {},
      { screenId: RAPPEL.id, optionsAffichees: true },
    );

    expect(() =>
      fusionnerPilotage(affichees, {
        screenId: RAPPEL.id,
        optionsAffichees: false,
      }),
    ).toThrow(PhaseNonMonotoneError);
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

  it('garde la révélation quand la demande porte ses champs optionnels à undefined', () => {
    expect(
      fusionnerPilotage(
        { 'E-TABLEAU': { revele: true, etayage: 1, optionsAffichees: true } },
        {
          screenId: 'E-TABLEAU',
          etayage: 2,
          revele: undefined,
          phase: undefined,
          optionsAffichees: undefined,
          reglages: undefined,
        },
      ),
    ).toEqual({
      'E-TABLEAU': { revele: true, etayage: 2, optionsAffichees: true },
    });
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
    expect(ouverte({}, { ecranId: 'E-NUM' })).toBe(true);
  });

  it('RET-32 · ferme aux reponses un questionnaire dont la correction est revelee', () => {
    expect([
      ouverte({ 'E-PRATIQUE': { revele: true } }, { ecranId: 'E-PRATIQUE' }),
      ouverte({ 'E-PRATIQUE': {} }, { ecranId: 'E-PRATIQUE' }),
    ]).toEqual([false, true]);
  });

  it('ferme toute question d un ecran dont la correction est revelee', () => {
    const pilotage = { 'E-NUM': { revele: true } };

    expect([
      ouverte(pilotage, { ecranId: 'E-NUM' }),
      ouverte(pilotage, { ecranId: 'E-NUM', ouverture: 'jumelle' }),
    ]).toEqual([false, false]);
  });

  it.each<[string, PilotageEcran | undefined, boolean, boolean]>([
    [
      'accepte la principale et refuse la jumelle avant toute phase pilotee',
      undefined,
      true,
      false,
    ],
    [
      'ferme les deux questions pendant la discussion',
      { phase: 'discussion' },
      false,
      false,
    ],
    ['ouvre la jumelle seule au revote', { phase: 'revote' }, false, true],
    [
      'ouvre la jumelle seule a la revelation',
      { phase: 'revele' },
      false,
      true,
    ],
  ])('%s', (_titre, pilotageDuVote, principale, jumelle) => {
    const pilotage: Record<string, PilotageEcran> =
      pilotageDuVote === undefined ? {} : { 'E-VOTE': pilotageDuVote };

    expect({
      principale: ouverte(pilotage, {
        ecranId: 'E-VOTE',
        ouverture: 'principale',
      }),
      jumelle: ouverte(pilotage, { ecranId: 'E-VOTE', ouverture: 'jumelle' }),
    }).toEqual({ principale, jumelle });
  });

  it('porte les codes PHASE_FERMEE et PHASE_NON_MONOTONE', () => {
    expect(new PhaseFermeeError('E-VOTE').code).toBe('PHASE_FERMEE');
    expect(new PhaseNonMonotoneError('E-VOTE').code).toBe('PHASE_NON_MONOTONE');
  });
});
