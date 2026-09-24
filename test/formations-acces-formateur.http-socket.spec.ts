/* eslint-disable @typescript-eslint/unbound-method */
import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import request from 'supertest';
import { ouvrirTirages } from '../src/modules/formations/domain/cours/OuvertureTirages';
import type { SessionState } from '../src/modules/formations/domain/SessionState';
import {
  EN_TETE_JETON,
  ParticipantTokenService,
} from '../src/modules/formations/interfaces/ParticipantToken.service';
import {
  buildParticipantRecord,
  buildSessionRecord,
  createMockDepotsFormations,
} from './factories/formation.factory';
import {
  coursPublie,
  EN_TETE_IDENTITE,
  monterApplicationFormations,
  PREFIXE_API,
} from './helpers/formations-harness';
import { fermerApplication } from './helpers/nest-test-app';
import { ecartsAuSchemaDeReponse } from './helpers/schema-openapi';

const SECRET = 'secret-de-test-formations-assez-long-1234';
const PROPRIETAIRE_ID = 'a1111111-1111-4111-8111-111111111111';
const SESSION_ID = 'c3333333-3333-4333-8333-333333333333';
const PARTICIPANT_ID = 'e5555555-5555-4555-8555-555555555555';

const PROPRIETAIRE = `${PROPRIETAIRE_ID}:teacher`;
const AUTRE_FORMATEUR = 'b2222222-2222-4222-8222-222222222222:teacher';
const ADMINISTRATEUR = 'f6666666-6666-4666-8666-666666666666:admin';
const ADMINISTRATEUR_FORMATEUR =
  'f6666666-6666-4666-8666-666666666666:admin:teacher';

const COURS = coursPublie('b2-01-traitement-information-chiffree');
const BAREME = ouvrirTirages(COURS);

const LECTURES = [
  'results',
  'report',
  'deroule',
  'free-responses',
  'annotations',
  'participants',
];

type Methode = 'post' | 'patch' | 'delete';

const ANNOTATION = { screenId: 'E-OUV', note: 'Relancer' };

function seance(etat: SessionState = 'en_cours') {
  return buildSessionRecord({
    id: SESSION_ID,
    teacherId: PROPRIETAIRE_ID,
    courseSlug: COURS.slug,
    bareme: BAREME,
    ecranCourant: COURS.ecrans.length - 1,
    etat,
  });
}

describe('Acces formateur aux annotations, participants et reponses libres (e2e http socket)', () => {
  const depots = createMockDepotsFormations();
  let app: INestApplication;

  const serveur = (): Parameters<typeof request>[0] =>
    app.getHttpServer() as Parameters<typeof request>[0];
  const route = (suffixe: string): string =>
    `/${PREFIXE_API}/formations/sessions/${SESSION_ID}/${suffixe}`;
  const appel = (
    methode: 'get' | Methode,
    suffixe: string,
    identite: string,
  ): request.Test =>
    request(serveur())[methode](route(suffixe)).set(EN_TETE_IDENTITE, identite);
  const ecrituresEnregistrees = (): number =>
    depots.annotations.save.mock.calls.length;

  beforeAll(async () => {
    process.env.FORMATION_REVIEW_TOKEN_SECRET = SECRET;
    app = await monterApplicationFormations(depots);
  });

  afterAll(async () => {
    await fermerApplication(app);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    depots.sessions.findById.mockResolvedValue(seance());
    depots.participants.findById.mockResolvedValue(
      buildParticipantRecord({ id: PARTICIPANT_ID, sessionId: SESSION_ID }),
    );
  });

  describe('lectures reservees au proprietaire et ouvertes a l administrateur', () => {
    it.each(LECTURES)(
      'GET %s : 403 pour un autre formateur, 200 pour le proprietaire et pour un administrateur',
      async (suffixe) => {
        const statuts: number[] = [];
        for (const identite of [
          AUTRE_FORMATEUR,
          PROPRIETAIRE,
          ADMINISTRATEUR,
        ]) {
          statuts.push((await appel('get', suffixe, identite)).status);
        }

        expect(statuts).toEqual([403, 200, 200]);
      },
    );

    it('rend les participants sans leur adresse ni groupe', async () => {
      const reponse = await appel('get', 'participants', PROPRIETAIRE).expect(
        200,
      );

      expect(reponse.body).toEqual({
        participants: [
          {
            id: 'participant-uuid',
            prenom: 'Theo',
            nom: 'Martin',
            evince: false,
          },
        ],
      });
    });

    it('rend les annotations par ecran, sans groupe', async () => {
      const reponse = await appel('get', 'annotations', PROPRIETAIRE).expect(
        200,
      );

      expect(reponse.body).toEqual({
        annotations: [
          {
            id: 'annotation-uuid',
            sessionId: 'session-uuid',
            teacherId: 'teacher-uuid',
            screenId: 'B2-01-S11-REFLECTION',
            note: 'Faire expliciter la base de comparaison.',
            updatedAt: '2026-09-11T08:25:00.000Z',
          },
        ],
      });
    });

    it('documente exactement la forme rendue des nouvelles lectures', async () => {
      const document = SwaggerModule.createDocument(
        app,
        new DocumentBuilder().setTitle('formations').build(),
      );
      const ecarts: string[] = [];
      for (const suffixe of ['participants', 'annotations', 'free-responses']) {
        const reponse = await appel('get', suffixe, PROPRIETAIRE).expect(200);
        ecarts.push(
          ...ecartsAuSchemaDeReponse(
            document,
            `/{id}/${suffixe}`,
            reponse.body,
          ),
        );
      }

      expect(ecarts).toEqual([]);
    });
  });

  describe('ecritures reservees au proprietaire', () => {
    it('POST annotations : 403 sans ecriture pour un autre formateur et pour un administrateur', async () => {
      const statuts: number[] = [];
      for (const identite of [
        AUTRE_FORMATEUR,
        ADMINISTRATEUR,
        ADMINISTRATEUR_FORMATEUR,
      ]) {
        statuts.push(
          (await appel('post', 'annotations', identite).send(ANNOTATION))
            .status,
        );
      }

      expect(statuts).toEqual([403, 403, 403]);
      expect(ecrituresEnregistrees()).toBe(0);
    });

    it('POST annotations : 201 pour le proprietaire, annotation portee par l ecran', async () => {
      await appel('post', 'annotations', PROPRIETAIRE)
        .send(ANNOTATION)
        .expect(201);

      expect(depots.annotations.save).toHaveBeenCalledWith({
        sessionId: SESSION_ID,
        teacherId: PROPRIETAIRE_ID,
        screenId: 'E-OUV',
        note: 'Relancer',
      });
    });

    it('refuse en 400 une note faite de blancs', async () => {
      await appel('post', 'annotations', PROPRIETAIRE)
        .send({ ...ANNOTATION, note: '  ' })
        .expect(400);

      expect(ecrituresEnregistrees()).toBe(0);
    });

    it('refuse en 400 une annotation qui porte encore un groupe', async () => {
      await appel('post', 'annotations', PROPRIETAIRE)
        .send({ ...ANNOTATION, groupName: 'Classe entière' })
        .expect(400);

      expect(ecrituresEnregistrees()).toBe(0);
    });

    it.each<[Methode | 'get', string]>([
      ['get', 'groups'],
      ['post', 'groups'],
      ['patch', 'groups/d4444444-4444-4444-8444-444444444444'],
      ['patch', `participants/${PARTICIPANT_ID}/group`],
      ['delete', `participants/${PARTICIPANT_ID}/group`],
    ])('%s %s : route de groupes retiree, 404', async (methode, chemin) => {
      await appel(methode, chemin, PROPRIETAIRE).send({}).expect(404);
    });
  });

  describe('reponse libre de l etudiant', () => {
    const reponseLibre = {
      screenId: 'E-REM',
      activityId: 'E-REM:etape-1',
      response: '  Je vérifie la base.  ',
      dureeMs: 1400,
    };
    const envoyer = (corps: object) =>
      request(serveur())
        .post(route('free-responses'))
        .set(
          EN_TETE_JETON,
          app.get(ParticipantTokenService).sign(SESSION_ID, PARTICIPANT_ID),
        )
        .send(corps);

    it('enregistre la reponse du participant porte par le jeton pendant la seance', async () => {
      const reponse = await envoyer(reponseLibre).expect(201);

      expect(reponse.body).toEqual({ status: 'enregistre' });
      expect(depots.freeResponses.save).toHaveBeenCalledWith({
        ...reponseLibre,
        sessionId: SESSION_ID,
        participantId: PARTICIPANT_ID,
        response: 'Je vérifie la base.',
      });
    });

    it.each([
      ['attente', 'SEANCE_NON_DEMARREE'],
      ['terminee', 'SEANCE_TERMINEE'],
    ] as const)(
      'refuse en 409 une reponse quand la seance est %s',
      async (etat, code) => {
        depots.sessions.findById.mockResolvedValue(seance(etat));

        const reponse = await envoyer(reponseLibre).expect(409);

        expect(reponse.body).toMatchObject({ code });
        expect(depots.freeResponses.save).not.toHaveBeenCalled();
      },
    );

    it('refuse en 400 une reponse vide une fois les blancs retires', async () => {
      await envoyer({ ...reponseLibre, response: ' \n\t ' }).expect(400);

      expect(depots.freeResponses.save).not.toHaveBeenCalled();
    });
  });
});
