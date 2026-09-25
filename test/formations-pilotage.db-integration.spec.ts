import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { Test } from 'supertest';
import type { PilotageEcran } from '../src/modules/formations/domain/contrats/pilotage';
import {
  buildCoursAvecVoteJumele,
  creerCatalogueDeTest,
} from './factories/cours.factory';
import { createMockFormationMailer } from './factories/formation.factory';
import { describeDb } from './helpers/db-integration-datasource';
import {
  DELAI_OUVERTURE_CONTEXTE_MS,
  ouvrirContexteFormations,
  type ContexteFormations,
} from './helpers/formations-db';
import {
  abonnerAuFlux,
  attendreQue,
  EN_TETE_IDENTITE,
  monterApplicationFormations,
  routeFormations,
  serveurHttpDe,
  type FluxEcoute,
} from './helpers/formations-harness';
import {
  ecouterEnBoucleLocale,
  fermerApplication,
} from './helpers/nest-test-app';
import { silenceNestLogger } from './helpers/silence-nest-logger';

const COURS = buildCoursAvecVoteJumele({ slug: 'cours-pilotage-integration' });
const CATALOGUE = creerCatalogueDeTest(COURS);
const FORMATEUR = 'a1111111-1111-4111-8111-111111111111';
const ECRAN_DE_VOTE = 'E-VOTE';
const ECRAN_DE_L_EXEMPLE = 'E-REM';
const SANS_CONTENU = 204;
const MAUVAISE_REQUETE = 400;
const CONFLIT = 409;
const DELAI_FLUX_MS = 5000;

interface ReponseOuverture {
  sessionId: string;
  code: string;
}

interface EtatDiffuse {
  revision: number;
  pilotage: Readonly<Record<string, PilotageEcran>>;
}

describeDb('Pilotage par ecran persiste (B21, db integration)', () => {
  silenceNestLogger(['log', 'warn', 'error']);

  let contexte: ContexteFormations;
  let app: INestApplication;
  let port: number;
  const fluxOuverts: FluxEcoute[] = [];

  const serveur = () => serveurHttpDe(app);

  const route = routeFormations;

  const formateur = (methode: 'post' | 'patch', chemin: string): Test =>
    request(serveur())
      [methode](route(chemin))
      .set(EN_TETE_IDENTITE, `${FORMATEUR}:teacher`);

  const monter = async (): Promise<void> => {
    app = await monterApplicationFormations(
      { ...contexte, mailer: createMockFormationMailer() },
      CATALOGUE,
    );
    port = await ecouterEnBoucleLocale(app);
  };

  const ouvrirSeance = async (): Promise<string> => {
    const reponse = await formateur('post', '/sessions')
      .send({ courseSlug: COURS.slug })
      .expect(201);
    return (reponse.body as ReponseOuverture).sessionId;
  };

  const premierEtatDuFlux = async (sessionId: string): Promise<EtatDiffuse> => {
    const chemin = route(`/sessions/${sessionId}/presenter-stream`);
    const flux = await abonnerAuFlux(port, chemin, {
      [EN_TETE_IDENTITE]: `${FORMATEUR}:teacher`,
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

  beforeAll(async () => {
    contexte = await ouvrirContexteFormations();
    await monter();
  }, DELAI_OUVERTURE_CONTEXTE_MS);

  afterEach(async () => {
    while (fluxOuverts.length > 0) {
      fluxOuverts.pop()?.fermer();
    }
    await contexte.nettoyer();
  });

  afterAll(async () => {
    await fermerApplication(app);
    await contexte.fermer();
  });

  it('restitue le pilotage et la revision apres une recreation du module', async () => {
    const sessionId = await ouvrirSeance();
    await formateur('patch', `/sessions/${sessionId}/control`)
      .send({ pilotage: { screenId: ECRAN_DE_VOTE, phase: 'revote' } })
      .expect(SANS_CONTENU);

    await fermerApplication(app);
    await monter();

    const etat = await premierEtatDuFlux(sessionId);

    expect(etat.pilotage).toEqual({ [ECRAN_DE_VOTE]: { phase: 'revote' } });
    expect(etat.revision).toBeGreaterThan(0);
  });

  it('cumule les pilotages de plusieurs ecrans et incremente la revision', async () => {
    const sessionId = await ouvrirSeance();
    await formateur('patch', `/sessions/${sessionId}/control`)
      .send({ pilotage: { screenId: ECRAN_DE_VOTE, phase: 'discussion' } })
      .expect(SANS_CONTENU);
    await formateur('patch', `/sessions/${sessionId}/control`)
      .send({ pilotage: { screenId: ECRAN_DE_L_EXEMPLE, etayage: 1 } })
      .expect(SANS_CONTENU);

    const seance = await contexte.sessions.findById(sessionId);

    expect(seance?.pilotageEcrans).toEqual({
      [ECRAN_DE_VOTE]: { phase: 'discussion' },
      [ECRAN_DE_L_EXEMPLE]: { etayage: 1 },
    });
    expect(seance?.revision).toBe(2);
  });

  it('garde les champs deja pilotes d un ecran quand une commande en pose un autre', async () => {
    const sessionId = await ouvrirSeance();
    await formateur('patch', `/sessions/${sessionId}/control`)
      .send({ pilotage: { screenId: ECRAN_DE_VOTE, resultatsProjetes: true } })
      .expect(SANS_CONTENU);
    await formateur('patch', `/sessions/${sessionId}/control`)
      .send({ pilotage: { screenId: ECRAN_DE_VOTE, phase: 'discussion' } })
      .expect(SANS_CONTENU);

    const seance = await contexte.sessions.findById(sessionId);

    expect(seance?.pilotageEcrans).toEqual({
      [ECRAN_DE_VOTE]: { phase: 'discussion', resultatsProjetes: true },
    });
  });

  it('refuse de ramener une phase en arriere', async () => {
    const sessionId = await ouvrirSeance();
    await formateur('patch', `/sessions/${sessionId}/control`)
      .send({ pilotage: { screenId: ECRAN_DE_VOTE, phase: 'revele' } })
      .expect(SANS_CONTENU);

    const refus = await formateur('patch', `/sessions/${sessionId}/control`)
      .send({ pilotage: { screenId: ECRAN_DE_VOTE, phase: 'vote' } })
      .expect(CONFLIT);

    expect((refus.body as { code?: string }).code).toBe('PHASE_NON_MONOTONE');
  });

  it('refuse un pilotage incompatible avec la brique de l ecran', async () => {
    const sessionId = await ouvrirSeance();

    const refus = await formateur(
      'patch',
      `/sessions/${sessionId}/control`,
    ).send({ pilotage: { screenId: ECRAN_DE_VOTE, etayage: 1 } });

    expect(refus.status).toBe(MAUVAISE_REQUETE);
  });

  it('refuse un ecran absent du cours de la seance', async () => {
    const sessionId = await ouvrirSeance();

    const refus = await formateur(
      'patch',
      `/sessions/${sessionId}/control`,
    ).send({ pilotage: { screenId: 'E-INVENTE', phase: 'vote' } });

    expect(refus.status).toBe(MAUVAISE_REQUETE);
  });

  it('refuse un corps de pilotage sans aucun changement', async () => {
    const sessionId = await ouvrirSeance();

    const refus = await formateur(
      'patch',
      `/sessions/${sessionId}/control`,
    ).send({});

    expect(refus.status).toBe(MAUVAISE_REQUETE);
  });
});
