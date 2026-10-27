import type { PilotageEcran } from '../src/modules/formations/domain/contrats/pilotage';
import {
  buildCoursAvecVoteJumele,
  creerCatalogueDeTest,
} from './factories/cours.factory';
import { describeDb } from './helpers/db-integration-datasource';
import {
  CODE_HTTP,
  FORMATEUR_DE_TEST,
  installerBancDeSeance,
} from './helpers/formations-banc-seance';
import {
  abonnerAuFlux,
  attendreQue,
  EN_TETE_IDENTITE,
  type FluxEcoute,
} from './helpers/formations-harness';

const COURS = buildCoursAvecVoteJumele({ slug: 'cours-pilotage-integration' });
const ECRAN_DE_VOTE = 'E-VOTE';
const ECRAN_DE_L_EXEMPLE = 'E-REM';
const DELAI_FLUX_MS = 5000;

interface EtatDiffuse {
  revision: number;
  pilotage: Readonly<Record<string, PilotageEcran>>;
}

describeDb('Pilotage par ecran persiste (B21, db integration)', () => {
  const banc = installerBancDeSeance({
    catalogue: creerCatalogueDeTest(COURS),
    slug: COURS.slug,
  });
  const fluxOuverts: FluxEcoute[] = [];

  const ouvrirSeance = async (): Promise<string> =>
    (await banc.ouvrir()).sessionId;

  const piloter = (sessionId: string, pilotage: Record<string, unknown>) =>
    banc.piloter(sessionId, { pilotage });

  const piloterSansErreur = async (
    sessionId: string,
    ...pilotages: Record<string, unknown>[]
  ): Promise<void> => {
    for (const pilotage of pilotages) {
      await piloter(sessionId, pilotage).expect(CODE_HTTP.SANS_CONTENU);
    }
  };

  const seancePilotee = async (
    ...pilotages: Record<string, unknown>[]
  ): Promise<string> => {
    const sessionId = await ouvrirSeance();
    await piloterSansErreur(sessionId, ...pilotages);
    return sessionId;
  };

  const premierEtatDuFlux = async (sessionId: string): Promise<EtatDiffuse> => {
    const chemin = banc.route(`/sessions/${sessionId}/presenter-stream`);
    const flux = await abonnerAuFlux(banc.port(), chemin, {
      [EN_TETE_IDENTITE]: `${FORMATEUR_DE_TEST}:teacher`,
    });
    fluxOuverts.push(flux);
    await attendreQue(
      () => flux.evenements.some((evenement) => evenement.type === 'etat'),
      DELAI_FLUX_MS,
    );
    const etat = flux.evenements.find(
      (evenement) => evenement.type === 'etat',
    )?.donnees;
    if (etat === undefined) {
      throw new Error('aucun evenement etat recu sur le flux formateur');
    }
    return etat as unknown as EtatDiffuse;
  };

  const stocke = async (sessionId: string) => {
    const seance = await banc.contexte().sessions.findById(sessionId);
    return { pilotage: seance?.pilotageEcrans, revision: seance?.revision };
  };

  afterEach(() => {
    while (fluxOuverts.length > 0) {
      fluxOuverts.pop()?.fermer();
    }
  });

  it('restitue le pilotage et la revision apres une recreation du module', async () => {
    const sessionId = await seancePilotee({
      screenId: ECRAN_DE_VOTE,
      phase: 'question-2',
    });

    await banc.remonter();

    const etat = await premierEtatDuFlux(sessionId);

    expect(etat.pilotage).toEqual({ [ECRAN_DE_VOTE]: { phase: 'question-2' } });
    expect(etat.revision).toBeGreaterThan(0);
  });

  it('cumule les pilotages de plusieurs ecrans et incremente la revision', async () => {
    const sessionId = await seancePilotee(
      { screenId: ECRAN_DE_VOTE, resultatsProjetes: true },
      { screenId: ECRAN_DE_L_EXEMPLE, etayage: 1 },
    );

    await expect(stocke(sessionId)).resolves.toEqual({
      pilotage: {
        [ECRAN_DE_VOTE]: { resultatsProjetes: true },
        [ECRAN_DE_L_EXEMPLE]: { etayage: 1 },
      },
      revision: 2,
    });
  });

  it('garde les champs deja pilotes d un ecran quand une commande en pose un autre', async () => {
    const sessionId = await seancePilotee(
      { screenId: ECRAN_DE_VOTE, resultatsProjetes: true },
      { screenId: ECRAN_DE_VOTE, phase: 'question-2' },
    );

    expect((await stocke(sessionId)).pilotage).toEqual({
      [ECRAN_DE_VOTE]: { phase: 'question-2', resultatsProjetes: true },
    });
  });

  it('M2 · révèle la correction d un vote jumelé après la question 2, sans changer de phase', async () => {
    const sessionId = await seancePilotee(
      { screenId: ECRAN_DE_VOTE, phase: 'question-2' },
      { screenId: ECRAN_DE_VOTE, revele: true },
    );

    expect((await stocke(sessionId)).pilotage).toEqual({
      [ECRAN_DE_VOTE]: { phase: 'question-2', revele: true },
    });
  });

  it('refuse de ramener une phase en arriere', async () => {
    const sessionId = await seancePilotee({
      screenId: ECRAN_DE_VOTE,
      phase: 'question-2',
    });

    const refus = await piloter(sessionId, {
      screenId: ECRAN_DE_VOTE,
      phase: 'question-1',
    }).expect(CODE_HTTP.CONFLIT);

    expect((refus.body as { code?: string }).code).toBe('PHASE_NON_MONOTONE');
  });

  it.each([
    [
      'un pilotage incompatible avec la brique de l ecran',
      { pilotage: { screenId: ECRAN_DE_VOTE, etayage: 1 } },
    ],
    [
      'un ecran absent du cours de la seance',
      { pilotage: { screenId: 'E-INVENTE', phase: 'question-1' } },
    ],
    ['un corps de pilotage sans aucun changement', {}],
  ])('refuse %s', async (_cas, corps) => {
    const sessionId = await ouvrirSeance();

    const refus = await banc.piloter(sessionId, corps);

    expect(refus.status).toBe(CODE_HTTP.INVALIDE);
  });
});
