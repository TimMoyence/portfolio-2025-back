import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { Response, Test } from 'supertest';
import type { ValeurProduction } from '../src/modules/formations/domain/contrats/resultats';
import { EN_TETE_JETON } from '../src/modules/formations/interfaces/ParticipantToken.service';
import {
  buildCoursAvecProductions,
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

const COURS = buildCoursAvecProductions({
  slug: 'cours-productions-integration',
});
const CATALOGUE = creerCatalogueDeTest(COURS);
const FORMATEUR = 'a1111111-1111-4111-8111-111111111111';
const DERNIER_ECRAN = COURS.ecrans.length - 1;
const SECRET = 'secret-de-test-formations-assez-long-1234';
const FEUILLE_JUSTE: ValeurProduction = {
  type: 'feuille',
  cellules: { D2: '=(C2-B2)/B2', D3: '=(C3-B3)/B3' },
};
const CREE = 201;
const SANS_CONTENU = 204;
const MAUVAISE_REQUETE = 400;
const NON_AUTORISE = 401;
const CONFLIT = 409;
const PRODUCTIONS_SIMULTANEES = 6;

interface ReponseOuverture {
  sessionId: string;
  code: string;
}

interface ReponseInscription {
  participantId: string;
  sessionId: string;
  jeton: string;
}

interface VerdictProduction {
  correcte: boolean;
  score: number;
  details: { cle: string; juste: boolean; libelleConfusion: string | null }[];
  libelleConfusion: string | null;
}

interface Seance {
  sessionId: string;
  jeton: string;
  participantId: string;
}

function codeDe(reponse: Response): string | undefined {
  return (reponse.body as { code?: string }).code;
}

describeDb('Route des productions (B5, B11, db integration)', () => {
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

  const produire = (sessionId: string, jeton: string, corps: object): Test =>
    request(serveur())
      .post(route(`/sessions/${sessionId}/productions`))
      .set(EN_TETE_JETON, jeton)
      .send(corps);

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
    const inscription = await request(serveur())
      .post(route(`/sessions/${code}/join`))
      .send({
        studentKey: cle,
        prenom: 'Theo',
        nom: 'Martin',
        email: 'theo.martin@example.test',
      })
      .expect(CREE);
    const { jeton, participantId } = inscription.body as ReponseInscription;
    return { sessionId, jeton, participantId };
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

  it('corrige la feuille du participant et persiste le score et le detail', async () => {
    const seance = await ouvrirSeance('44444444-4444-4444-8444-000000000001');

    const reponse = await produire(seance.sessionId, seance.jeton, {
      questionId: 'Q-TEST-FEUILLE',
      valeur: FEUILLE_JUSTE,
      dureeMs: 600000,
    }).expect(CREE);

    const verdict = reponse.body as VerdictProduction;
    expect(verdict.correcte).toBe(true);
    expect(verdict.score).toBe(1);
    expect(verdict.details.map((detail) => detail.cle)).toEqual(['D2', 'D3']);

    const enregistrees = await contexte.answers.listBySession(seance.sessionId);
    expect(enregistrees).toHaveLength(1);
    expect(enregistrees[0].score).toBe(1);
    expect(enregistrees[0].details).toEqual([
      { cle: 'D2', juste: true, confusion: null },
      { cle: 'D3', juste: true, confusion: null },
    ]);
  });

  it('refuse le jeton d un participant d une autre seance', async () => {
    const seance = await ouvrirSeance('44444444-4444-4444-8444-000000000002');
    const autre = await ouvrirSeance('44444444-4444-4444-8444-000000000003');

    const refus = await produire(seance.sessionId, autre.jeton, {
      questionId: 'Q-TEST-FEUILLE',
      valeur: FEUILLE_JUSTE,
      dureeMs: 1000,
    });

    expect(refus.status).toBe(NON_AUTORISE);
  });

  it('refuse une requete sans jeton de participant', async () => {
    const seance = await ouvrirSeance('44444444-4444-4444-8444-000000000004');

    const refus = await request(serveur())
      .post(route(`/sessions/${seance.sessionId}/productions`))
      .send({
        questionId: 'Q-TEST-FEUILLE',
        valeur: FEUILLE_JUSTE,
        dureeMs: 1000,
      });

    expect(refus.status).toBe(NON_AUTORISE);
  });

  it('refuse l identite du formateur, qui n est pas un participant', async () => {
    const seance = await ouvrirSeance('44444444-4444-4444-8444-000000000005');

    const refus = await request(serveur())
      .post(route(`/sessions/${seance.sessionId}/productions`))
      .set(EN_TETE_IDENTITE, `${FORMATEUR}:teacher`)
      .send({
        questionId: 'Q-TEST-FEUILLE',
        valeur: FEUILLE_JUSTE,
        dureeMs: 1000,
      });

    expect(refus.status).toBe(NON_AUTORISE);
  });

  it('refuse une production vide', async () => {
    const seance = await ouvrirSeance('44444444-4444-4444-8444-000000000006');

    const refus = await produire(seance.sessionId, seance.jeton, {
      questionId: 'Q-TEST-FEUILLE',
      valeur: { type: 'feuille', cellules: {} },
      dureeMs: 1000,
    });

    expect(refus.status).toBe(MAUVAISE_REQUETE);
    expect(codeDe(refus)).toBe('PRODUCTION_VIDE');
  });

  it('refuse une cellule hors de la grille du plan', async () => {
    const seance = await ouvrirSeance('44444444-4444-4444-8444-000000000007');

    const refus = await produire(seance.sessionId, seance.jeton, {
      questionId: 'Q-TEST-FEUILLE',
      valeur: { type: 'feuille', cellules: { Z99: '=1' } },
      dureeMs: 1000,
    });

    expect(refus.status).toBe(MAUVAISE_REQUETE);
    expect(codeDe(refus)).toBe('PRODUCTION_INVALIDE');
  });

  it('refuse une question fermee, qui passe par la route des reponses', async () => {
    const seance = await ouvrirSeance('44444444-4444-4444-8444-000000000008');

    const refus = await produire(seance.sessionId, seance.jeton, {
      questionId: 'Q-TEST-NUM',
      valeur: FEUILLE_JUSTE,
      dureeMs: 1000,
    });

    expect(refus.status).toBe(MAUVAISE_REQUETE);
    expect(codeDe(refus)).toBe('TYPE_DE_QUESTION');
  });

  it('refuse une production visant un ecran que le formateur n a pas projete', async () => {
    const seance = await ouvrirSeance('44444444-4444-4444-8444-000000000009');
    await formateur('patch', `/sessions/${seance.sessionId}/control`)
      .send({ ecran: 0 })
      .expect(SANS_CONTENU);

    const refus = await produire(seance.sessionId, seance.jeton, {
      questionId: 'Q-TEST-FEUILLE',
      valeur: FEUILLE_JUSTE,
      dureeMs: 1000,
    });

    expect(refus.status).toBe(CONFLIT);
    expect(codeDe(refus)).toBe('ECRAN_NON_SERVI');
  });

  it('refuse une seconde production sur la meme question', async () => {
    const seance = await ouvrirSeance('44444444-4444-4444-8444-000000000010');
    await produire(seance.sessionId, seance.jeton, {
      questionId: 'Q-TEST-FEUILLE',
      valeur: FEUILLE_JUSTE,
      dureeMs: 1000,
    }).expect(CREE);

    const refus = await produire(seance.sessionId, seance.jeton, {
      questionId: 'Q-TEST-FEUILLE',
      valeur: FEUILLE_JUSTE,
      dureeMs: 1000,
    });

    expect(refus.status).toBe(CONFLIT);
    expect(codeDe(refus)).toBe('REPONSE_DEJA_ENREGISTREE');
  });

  it('n enregistre qu une seule production quand le poste en envoie plusieurs en parallele', async () => {
    const seance = await ouvrirSeance('44444444-4444-4444-8444-000000000011');

    const reponses = await Promise.all(
      Array.from({ length: PRODUCTIONS_SIMULTANEES }, () =>
        produire(seance.sessionId, seance.jeton, {
          questionId: 'Q-TEST-FEUILLE',
          valeur: FEUILLE_JUSTE,
          dureeMs: 1000,
        }),
      ),
    );

    const creees = reponses.filter((reponse) => reponse.status === CREE);
    const conflits = reponses.filter((reponse) => reponse.status === CONFLIT);
    const enregistrees = await contexte.answers.listBySession(seance.sessionId);

    expect(creees).toHaveLength(1);
    expect(conflits).toHaveLength(PRODUCTIONS_SIMULTANEES - 1);
    expect(enregistrees).toHaveLength(1);
  });
});
