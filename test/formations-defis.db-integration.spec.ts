import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { Test } from 'supertest';
import { EN_TETE_JETON } from '../src/modules/formations/interfaces/ParticipantToken.service';
import {
  buildCoursAvecDefi,
  creerCatalogueDeTest,
  DEFI_DE_TEST,
} from './factories/cours.factory';
import { createMockFormationMailer } from './factories/formation.factory';
import { describeDb } from './helpers/db-integration-datasource';
import {
  DELAI_OUVERTURE_CONTEXTE_MS,
  ouvrirContexteFormations,
  type ContexteFormations,
} from './helpers/formations-db';
import {
  EN_TETE_IDENTITE,
  monterApplicationFormations,
  PREFIXE_API,
} from './helpers/formations-harness';
import { fermerApplication } from './helpers/nest-test-app';
import { silenceNestLogger } from './helpers/silence-nest-logger';

const COURS = buildCoursAvecDefi({ slug: 'cours-defis-integration' });
const CATALOGUE = creerCatalogueDeTest(COURS);
const FORMATEUR = 'a1111111-1111-4111-8111-111111111111';
const DERNIER_ECRAN = COURS.ecrans.length - 1;
const ECRAN_DU_DEFI = 'E-DEFI';
const SECRET = 'secret-de-test-formations-assez-long-1234';
const CREE = 201;
const OK = 200;
const SANS_CONTENU = 204;
const MAUVAISE_REQUETE = 400;
const NON_AUTORISE = 401;
const INTROUVABLE = 404;
const TENTATIVES_SIMULTANEES = 5;

interface ReponseOuverture {
  sessionId: string;
  code: string;
}

interface ReponseInscription {
  participantId: string;
  jeton: string;
}

interface Strategies {
  strategies: { id: string; libelle: string; fausse?: boolean }[];
}

interface Seance {
  sessionId: string;
  code: string;
  jeton: string;
  participantId: string;
}

describeDb('Defis ouverts (B12, db integration)', () => {
  silenceNestLogger(['log', 'warn', 'error']);

  let contexte: ContexteFormations;
  let app: INestApplication;
  let secretInitial: string | undefined;

  const serveur = (): Parameters<typeof request>[0] =>
    app.getHttpServer() as Parameters<typeof request>[0];

  const route = (chemin: string): string =>
    `/${PREFIXE_API}/formations${chemin}`;

  const formateur = (methode: 'post' | 'patch', chemin: string): Test =>
    request(serveur())
      [methode](route(chemin))
      .set(EN_TETE_IDENTITE, `${FORMATEUR}:teacher`);

  const tenter = (seance: Seance, texte: string): Test =>
    request(serveur())
      .post(
        route(`/sessions/${seance.sessionId}/defis/${DEFI_DE_TEST}/tentative`),
      )
      .set(EN_TETE_JETON, seance.jeton)
      .send({ texte, dureeMs: 120000 });

  const relire = (seance: Seance): Test =>
    request(serveur())
      .get(
        route(`/sessions/${seance.sessionId}/defis/${DEFI_DE_TEST}/strategies`),
      )
      .set(EN_TETE_JETON, seance.jeton);

  const inscrire = async (
    sessionId: string,
    code: string,
    cle: string,
  ): Promise<Seance> => {
    const inscription = await request(serveur())
      .post(route(`/sessions/${code}/join`))
      .send({
        studentKey: cle,
        prenom: 'Theo',
        nom: 'Martin',
        email: `${cle}@example.test`,
      })
      .expect(CREE);
    const { jeton, participantId } = inscription.body as ReponseInscription;
    return { sessionId, code, jeton, participantId };
  };

  const ouvrirSeance = async (cle: string): Promise<Seance> => {
    const ouverture = await formateur('post', '/sessions')
      .send({ courseSlug: COURS.slug })
      .expect(CREE);
    const { sessionId, code } = ouverture.body as ReponseOuverture;
    await formateur('post', `/sessions/${sessionId}/start`).expect(
      SANS_CONTENU,
    );
    await formateur('patch', `/sessions/${sessionId}/control`)
      .send({ ecran: DERNIER_ECRAN })
      .expect(SANS_CONTENU);
    return inscrire(sessionId, code, cle);
  };

  beforeAll(async () => {
    secretInitial = process.env.FORMATION_REVIEW_TOKEN_SECRET;
    process.env.FORMATION_REVIEW_TOKEN_SECRET = SECRET;
    contexte = await ouvrirContexteFormations();
    app = await monterApplicationFormations(
      { ...contexte, mailer: createMockFormationMailer() },
      CATALOGUE,
    );
  }, DELAI_OUVERTURE_CONTEXTE_MS);

  afterEach(async () => {
    await contexte.nettoyer();
  });

  afterAll(async () => {
    await fermerApplication(app);
    await contexte.fermer();
    process.env.FORMATION_REVIEW_TOKEN_SECRET = secretInitial;
  });

  it('ne sert les strategies qu apres l envoi, sans leur justesse', async () => {
    const seance = await ouvrirSeance('77777777-7777-4777-8777-000000000001');

    const avant = await relire(seance);
    const apres = await tenter(seance, 'Je lis l’origine de l’axe.');

    expect(avant.status).toBe(INTROUVABLE);
    expect(apres.status).toBe(CREE);
    const strategies = (apres.body as Strategies).strategies;
    expect(strategies).toHaveLength(2);
    expect(strategies.some((item) => 'fausse' in item)).toBe(false);
  });

  it('ajoute la justesse seulement apres la revelation pilotee', async () => {
    const seance = await ouvrirSeance('77777777-7777-4777-8777-000000000002');
    await tenter(seance, 'Je lis l’origine de l’axe.').expect(CREE);

    await formateur('patch', `/sessions/${seance.sessionId}/control`)
      .send({ pilotage: { screenId: ECRAN_DU_DEFI, revele: true } })
      .expect(SANS_CONTENU);
    const apres = await relire(seance).expect(OK);

    expect((apres.body as Strategies).strategies).toEqual([
      { id: 'axe', libelle: expect.any(String), fausse: false },
      { id: 'couleur', libelle: expect.any(String), fausse: true },
    ]);
  });

  it('fige la premiere tentative meme apres une seconde', async () => {
    const seance = await ouvrirSeance('77777777-7777-4777-8777-000000000003');
    await tenter(seance, 'Première idée.').expect(CREE);

    await tenter(seance, 'Seconde idée.').expect(CREE);

    const lignes = await contexte.freeResponses.listerDuParticipant(
      seance.sessionId,
      seance.participantId,
    );
    expect(lignes[0].premiereReponse).toBe('Première idée.');
    expect(lignes[0].response).toBe('Seconde idée.');
  });

  it('garde une seule premiere tentative malgre des envois simultanes', async () => {
    const seance = await ouvrirSeance('77777777-7777-4777-8777-000000000004');

    await Promise.all(
      Array.from({ length: TENTATIVES_SIMULTANEES }, (_, rang) =>
        tenter(seance, `Idée ${rang}.`),
      ),
    );

    const lignes = await contexte.freeResponses.listerDuParticipant(
      seance.sessionId,
      seance.participantId,
    );
    expect(lignes).toHaveLength(1);
    expect(lignes[0].premiereReponse).toMatch(/^Idée \d\.$/);
  });

  it('ne sert jamais les strategies au participant qui n a pas tente', async () => {
    const premier = await ouvrirSeance('77777777-7777-4777-8777-000000000005');
    const second = await inscrire(
      premier.sessionId,
      premier.code,
      '77777777-7777-4777-8777-000000000006',
    );
    await tenter(premier, 'Je lis l’origine.').expect(CREE);

    const refus = await relire(second);

    expect(refus.status).toBe(INTROUVABLE);
  });

  it('refuse une tentative vide', async () => {
    const seance = await ouvrirSeance('77777777-7777-4777-8777-000000000007');

    const refus = await tenter(seance, '   ');

    expect(refus.status).toBe(MAUVAISE_REQUETE);
  });

  it('refuse le jeton d un participant d une autre seance', async () => {
    const seance = await ouvrirSeance('77777777-7777-4777-8777-000000000008');
    const autre = await ouvrirSeance('77777777-7777-4777-8777-000000000009');

    const refus = await tenter(
      { ...seance, jeton: autre.jeton },
      'Je lis l’origine.',
    );

    expect(refus.status).toBe(NON_AUTORISE);
  });

  it('refuse un defi absent du cours', async () => {
    const seance = await ouvrirSeance('77777777-7777-4777-8777-000000000010');

    const refus = await request(serveur())
      .post(route(`/sessions/${seance.sessionId}/defis/defi-invente/tentative`))
      .set(EN_TETE_JETON, seance.jeton)
      .send({ texte: 'Une idée.', dureeMs: 1000 });

    expect(refus.status).toBe(INTROUVABLE);
  });
});
