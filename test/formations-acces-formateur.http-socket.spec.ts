/* eslint-disable @typescript-eslint/unbound-method */
import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import request from 'supertest';
import { ouvrirTirages } from '../src/modules/formations/domain/cours/OuvertureTirages';
import {
  FormationGroupNameTakenError,
  FormationGroupNotFoundError,
  ParticipantNotFoundError,
} from '../src/modules/formations/domain/errors/FormationErrors';
import type { SessionState } from '../src/modules/formations/domain/SessionState';
import {
  EN_TETE_JETON,
  ParticipantTokenService,
} from '../src/modules/formations/interfaces/ParticipantToken.service';
import {
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
const GROUPE_ID = 'd4444444-4444-4444-8444-444444444444';
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
  'groups',
  'participants',
];

type Methode = 'post' | 'patch' | 'delete';

interface Ecriture {
  readonly methode: Methode;
  readonly chemin: string;
  readonly corps?: object;
  readonly succes: number;
}

const ECRITURES: readonly Ecriture[] = [
  {
    methode: 'post',
    chemin: 'groups',
    corps: { name: 'Groupe A' },
    succes: 201,
  },
  {
    methode: 'patch',
    chemin: `groups/${GROUPE_ID}`,
    corps: { name: 'Groupe B' },
    succes: 200,
  },
  {
    methode: 'patch',
    chemin: `participants/${PARTICIPANT_ID}/group`,
    corps: { groupId: GROUPE_ID },
    succes: 204,
  },
  {
    methode: 'delete',
    chemin: `participants/${PARTICIPANT_ID}/group`,
    succes: 204,
  },
  {
    methode: 'post',
    chemin: 'annotations',
    corps: { screenId: 'E-OUV', groupName: 'Classe entière', note: 'Relancer' },
    succes: 201,
  },
];

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

describe('Acces formateur aux annotations, groupes, participants et reponses libres (e2e http socket)', () => {
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
    [
      depots.groups.create,
      depots.groups.rename,
      depots.groups.assignParticipant,
      depots.annotations.save,
    ].reduce((total, ecriture) => total + ecriture.mock.calls.length, 0);

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

    it('rend les participants avec leur groupe mais sans leur adresse', async () => {
      const reponse = await appel('get', 'participants', PROPRIETAIRE).expect(
        200,
      );

      expect(reponse.body).toEqual({
        participants: [
          {
            id: 'participant-uuid',
            prenom: 'Theo',
            nom: 'Martin',
            groupId: null,
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
      for (const suffixe of [
        'participants',
        'groups',
        'annotations',
        'free-responses',
      ]) {
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
    it.each(ECRITURES)(
      '$methode $chemin : 403 sans ecriture pour un autre formateur et pour un administrateur',
      async ({ methode, chemin, corps }) => {
        const statuts: number[] = [];
        for (const identite of [
          AUTRE_FORMATEUR,
          ADMINISTRATEUR,
          ADMINISTRATEUR_FORMATEUR,
        ]) {
          statuts.push(
            (await appel(methode, chemin, identite).send(corps)).status,
          );
        }

        expect(statuts).toEqual([403, 403, 403]);
        expect(ecrituresEnregistrees()).toBe(0);
      },
    );

    it.each(ECRITURES)(
      '$methode $chemin : $succes pour le proprietaire',
      async ({ methode, chemin, corps, succes }) => {
        await appel(methode, chemin, PROPRIETAIRE).send(corps).expect(succes);

        expect(ecrituresEnregistrees()).toBe(1);
      },
    );

    it('refuse en 409 un nom de groupe deja pris dans la seance', async () => {
      depots.groups.create.mockRejectedValueOnce(
        new FormationGroupNameTakenError('Groupe A'),
      );

      const reponse = await appel('post', 'groups', PROPRIETAIRE)
        .send({ name: 'Groupe A' })
        .expect(409);

      expect(reponse.body).toMatchObject({ code: 'NOM_DE_GROUPE_DEJA_PRIS' });
    });

    it('rend 404 pour un groupe ou un participant inconnu de la seance', async () => {
      depots.groups.rename.mockRejectedValueOnce(
        new FormationGroupNotFoundError(GROUPE_ID),
      );
      depots.groups.assignParticipant
        .mockRejectedValueOnce(new FormationGroupNotFoundError(GROUPE_ID))
        .mockRejectedValueOnce(new ParticipantNotFoundError(PARTICIPANT_ID));
      const affectation = {
        chemin: `participants/${PARTICIPANT_ID}/group`,
        corps: { groupId: GROUPE_ID },
      };

      const statuts = [
        (
          await appel('patch', `groups/${GROUPE_ID}`, PROPRIETAIRE).send({
            name: 'Groupe B',
          })
        ).status,
        (
          await appel('patch', affectation.chemin, PROPRIETAIRE).send(
            affectation.corps,
          )
        ).status,
        (
          await appel('patch', affectation.chemin, PROPRIETAIRE).send(
            affectation.corps,
          )
        ).status,
      ];

      expect(statuts).toEqual([404, 404, 404]);
    });

    it('refuse en 400 un nom de groupe ou une note faits de blancs', async () => {
      const statuts = [
        (await appel('post', 'groups', PROPRIETAIRE).send({ name: '   ' }))
          .status,
        (
          await appel('post', 'annotations', PROPRIETAIRE).send({
            screenId: 'E-OUV',
            groupName: 'Classe entière',
            note: '  ',
          })
        ).status,
      ];

      expect(statuts).toEqual([400, 400]);
      expect(ecrituresEnregistrees()).toBe(0);
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
