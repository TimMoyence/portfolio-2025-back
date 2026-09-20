import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { Response, Test } from 'supertest';
import { EN_TETE_JETON } from '../src/modules/formations/interfaces/ParticipantToken.service';
import {
  buildCoursDeClasse,
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
  EN_TETE_IDENTITE,
  monterApplicationFormations,
  PREFIXE_API,
} from './helpers/formations-harness';
import { fermerApplication } from './helpers/nest-test-app';
import { silenceNestLogger } from './helpers/silence-nest-logger';

const COURS = buildCoursDeClasse(4);
const CATALOGUE = creerCatalogueDeTest(COURS);
const FORMATEUR = 'a1111111-1111-4111-8111-111111111111';
const AUTRE_FORMATEUR = 'b2222222-2222-4222-8222-222222222222';
const SECRET = 'secret-de-test-formations-assez-long-1234';
const CAPACITE = 2;
const CREE = 201;
const OK = 200;
const SANS_CONTENU = 204;
const NON_AUTORISE = 401;
const INTERDIT = 403;
const INTROUVABLE = 404;
const CONFLIT = 409;

interface ReponseOuverture {
  sessionId: string;
  code: string;
}

interface ReponseInscription {
  participantId: string;
  jeton: string;
  seed: number;
}

function codeDe(reponse: Response): string | undefined {
  return (reponse.body as { code?: string }).code;
}

describeDb('Capacite et eviction (B28, db integration)', () => {
  silenceNestLogger(['log', 'warn', 'error']);

  let contexte: ContexteFormations;
  let app: INestApplication;
  let secretInitial: string | undefined;

  const serveur = (): Parameters<typeof request>[0] =>
    app.getHttpServer() as Parameters<typeof request>[0];

  const route = (chemin: string): string =>
    `/${PREFIXE_API}/formations${chemin}`;

  const commePro = (
    methode: 'post' | 'patch' | 'get' | 'delete',
    chemin: string,
    identite = `${FORMATEUR}:teacher`,
  ): Test =>
    request(serveur())[methode](route(chemin)).set(EN_TETE_IDENTITE, identite);

  const inscrire = (code: string, cle: string): Test =>
    request(serveur())
      .post(route(`/sessions/${code}/join`))
      .send({
        studentKey: cle,
        prenom: 'Theo',
        nom: 'Martin',
        email: `${cle}@example.test`,
      });

  const ouvrirSeance = async (capacite?: number): Promise<ReponseOuverture> => {
    const ouverture = await commePro('post', '/sessions')
      .send({ courseSlug: COURS.slug, ...(capacite ? { capacite } : {}) })
      .expect(CREE);
    const seance = ouverture.body as ReponseOuverture;
    await commePro('post', `/sessions/${seance.sessionId}/start`).expect(
      SANS_CONTENU,
    );
    return seance;
  };

  const cle = (rang: number): string =>
    `99999999-9999-4999-8999-${String(rang).padStart(12, '0')}`;

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

  it('refuse en 409 SEANCE_COMPLETE au-dela de la capacite demandee', async () => {
    const seance = await ouvrirSeance(CAPACITE);
    for (let rang = 0; rang < CAPACITE; rang += 1) {
      await inscrire(seance.code, cle(rang)).expect(CREE);
    }

    const refus = await inscrire(seance.code, cle(CAPACITE));

    expect(refus.status).toBe(CONFLIT);
    expect(codeDe(refus)).toBe('SEANCE_COMPLETE');
  });

  it('applique la capacite par defaut de quarante quand elle n est pas demandee', async () => {
    const seance = await ouvrirSeance();

    const enregistree = await contexte.sessions.findById(seance.sessionId);

    expect(enregistree?.capacite).toBe(40);
  });

  it('libere la place et la graine du participant evince, et conserve ses reponses', async () => {
    const seance = await ouvrirSeance(CAPACITE);
    const premier = (await inscrire(seance.code, cle(0)).expect(CREE))
      .body as ReponseInscription;
    await inscrire(seance.code, cle(1)).expect(CREE);
    await request(serveur())
      .post(route(`/sessions/${seance.sessionId}/answers`))
      .set(EN_TETE_JETON, premier.jeton)
      .send({
        questionId: COURS.ecrans[0].question!.id,
        valeur: 1,
        dureeMs: 1000,
      });

    await commePro(
      'delete',
      `/sessions/${seance.sessionId}/participants/${premier.participantId}`,
    ).expect(SANS_CONTENU);
    const remplacant = (await inscrire(seance.code, cle(2)).expect(CREE))
      .body as ReponseInscription;

    expect(remplacant.seed).toBe(premier.seed);
    const reponses = await contexte.answers.listBySession(seance.sessionId);
    expect(
      reponses.filter(
        (reponse) => reponse.participantId === premier.participantId,
      ),
    ).toHaveLength(1);
  });

  it('revoque l acces du participant evince', async () => {
    const seance = await ouvrirSeance(CAPACITE);
    const premier = (await inscrire(seance.code, cle(0)).expect(CREE))
      .body as ReponseInscription;

    await commePro(
      'delete',
      `/sessions/${seance.sessionId}/participants/${premier.participantId}`,
    ).expect(SANS_CONTENU);
    const refus = await request(serveur())
      .get(route(`/sessions/${seance.sessionId}/sujet`))
      .set(EN_TETE_JETON, premier.jeton);

    expect(refus.status).toBe(INTROUVABLE);
  });

  it('retire l evince de la liste des participants du formateur', async () => {
    const seance = await ouvrirSeance(CAPACITE);
    const premier = (await inscrire(seance.code, cle(0)).expect(CREE))
      .body as ReponseInscription;

    await commePro(
      'delete',
      `/sessions/${seance.sessionId}/participants/${premier.participantId}`,
    ).expect(SANS_CONTENU);
    const liste = await commePro(
      'get',
      `/sessions/${seance.sessionId}/participants`,
    ).expect(OK);

    expect(
      (liste.body as { participants: { id: string }[] }).participants,
    ).toEqual([]);
  });

  it('refuse l eviction a un autre formateur et a un anonyme', async () => {
    const seance = await ouvrirSeance(CAPACITE);
    const premier = (await inscrire(seance.code, cle(0)).expect(CREE))
      .body as ReponseInscription;
    const chemin = `/sessions/${seance.sessionId}/participants/${premier.participantId}`;

    const parUnAutre = await commePro(
      'delete',
      chemin,
      `${AUTRE_FORMATEUR}:teacher`,
    );
    const sansIdentite = await request(serveur()).delete(route(chemin));

    expect(parUnAutre.status).toBe(INTERDIT);
    expect(sansIdentite.status).toBe(NON_AUTORISE);
  });

  it('signale un participant deja evince', async () => {
    const seance = await ouvrirSeance(CAPACITE);
    const premier = (await inscrire(seance.code, cle(0)).expect(CREE))
      .body as ReponseInscription;
    const chemin = `/sessions/${seance.sessionId}/participants/${premier.participantId}`;
    await commePro('delete', chemin).expect(SANS_CONTENU);

    const refus = await commePro('delete', chemin);

    expect(refus.status).toBe(INTROUVABLE);
  });
});
