import { Test } from '@nestjs/testing';
import { once } from 'node:events';
import { LoggerModule } from 'nestjs-pino';
import request from 'supertest';
import { optionsJournalHttp } from '../src/config/journal-http';
import { GetToolkitByTokenUseCase } from '../src/modules/lead-magnets/application/queries/GetToolkitByToken.useCase';
import { LeadMagnetsController } from '../src/modules/lead-magnets/interfaces/LeadMagnets.controller';
import { ResetPasswordUseCase } from '../src/modules/users/application/ResetPassword.useCase';
import { VerifyEmailUseCase } from '../src/modules/users/application/VerifyEmail.useCase';
import {
  FORME_D_UN_JETON_EMIS,
  TokenHash,
} from '../src/modules/users/domain/TokenHash';
import { AuthController } from '../src/modules/users/interfaces/Auth.controller';
import {
  applicationDeLaSuite,
  bootstrapTestApp,
  serveurHttpDe,
} from './helpers/nest-test-app';
import {
  EVENEMENT_LIGNE,
  fluxDeJournal,
  type LigneEcrite,
} from './helpers/flux-de-journal';
import { documentOpenApiFormations } from './helpers/schema-openapi';

type Serveur = ReturnType<typeof serveurHttpDe>;
type Jeton = string | readonly string[] | undefined;
type Requete = (serveur: Serveur) => request.Test;

interface Lien {
  readonly nom: string;
  readonly operation: readonly ['get' | 'post', string];
  readonly inconnu: string;
  readonly lecture: jest.Mock;
  readonly cleCherchee: (jeton: string) => string;
  readonly appeler: (serveur: Serveur, jeton: Jeton) => request.Test;
  readonly jetonDansLeChemin: boolean;
  readonly refusPropres?: readonly (readonly [string, Requete])[];
}

const depot = {
  findByToken: jest.fn(),
  findActiveByTokenHash: jest.fn(),
};

const journal = fluxDeJournal();
const UUID_INCONNU = '550e8400-e29b-41d4-a716-446655440000';
const JETON_EMIS_INCONNU = 'a'.repeat(64);
const NOUVEAU_MOT_DE_PASSE = 'NouveauMotDePasse1!';
const tel = (jeton: string) => jeton;
const empreinte = (jeton: string) => TokenHash.fromRaw(jeton).value;

function parQuery(methode: 'get' | 'post', chemin: string) {
  return (serveur: Serveur, jeton: Jeton) => {
    const requete = (jeton === undefined ? [] : [jeton].flat())
      .map((valeur) => `token=${encodeURIComponent(valeur)}`)
      .join('&');
    return request(serveur)[methode](
      requete === '' ? `/api/${chemin}` : `/api/${chemin}?${requete}`,
    );
  };
}

const reinitialiser = (serveur: Serveur) =>
  request(serveur).post('/api/auth/reset-password');

const reinitialiserAvec =
  (token: unknown): Requete =>
  (serveur) =>
    reinitialiser(serveur).send({ token, newPassword: NOUVEAU_MOT_DE_PASSE });

const reinitialiserParFormulaire =
  (...jetons: [string, string][]): Requete =>
  (serveur) =>
    reinitialiser(serveur)
      .type('form')
      .send(
        new URLSearchParams([
          ...jetons,
          ['newPassword', NOUVEAU_MOT_DE_PASSE],
        ]).toString(),
      );

const LIENS: readonly Lien[] = [
  {
    nom: 'la page du toolkit',
    operation: ['get', '/api/lead-magnets/toolkit/{token}'],
    inconnu: UUID_INCONNU,
    lecture: depot.findByToken,
    cleCherchee: tel,
    appeler: (serveur, jeton) =>
      request(serveur).get(`/api/lead-magnets/toolkit/${String(jeton)}`),
    jetonDansLeChemin: true,
  },
  {
    nom: 'la verification d adresse',
    operation: ['get', '/api/auth/verify-email'],
    inconnu: JETON_EMIS_INCONNU,
    lecture: depot.findActiveByTokenHash,
    cleCherchee: empreinte,
    appeler: parQuery('get', 'auth/verify-email'),
    jetonDansLeChemin: false,
  },
  {
    nom: 'la reinitialisation du mot de passe',
    operation: ['post', '/api/auth/reset-password'],
    inconnu: JETON_EMIS_INCONNU,
    lecture: depot.findActiveByTokenHash,
    cleCherchee: empreinte,
    appeler: (serveur, jeton) => reinitialiserAvec(jeton)(serveur),
    jetonDansLeChemin: false,
    refusPropres: [
      ['un jeton null', reinitialiserAvec(null)],
      ['un jeton numerique', reinitialiserAvec(12345)],
      ['un jeton objet', reinitialiserAvec({ jeton: JETON_EMIS_INCONNU })],
      [
        'un jeton repete dans un formulaire',
        reinitialiserParFormulaire(
          ['token', JETON_EMIS_INCONNU],
          ['token', JETON_EMIS_INCONNU],
        ),
      ],
      [
        'un jeton indexe dans un formulaire',
        reinitialiserParFormulaire(['token[jeton]', JETON_EMIS_INCONNU]),
      ],
    ],
  },
];

const MAL_FORMES: readonly (readonly [string, (lien: Lien) => Jeton])[] = [
  ['un texte quelconque', () => 'pas-un-jeton'],
  ['le jeton en majuscules', (lien) => lien.inconnu.toUpperCase()],
  ['le jeton tronque', (lien) => lien.inconnu.slice(1)],
];

const PARAMETRES_INVALIDES: readonly (readonly [
  string,
  (lien: Lien) => Jeton,
])[] = [
  ['un parametre absent', () => undefined],
  ['un parametre vide', () => ''],
  ['un parametre repete', (lien) => [lien.inconnu, lien.inconnu]],
];

const CAS_REFUSES = LIENS.flatMap((lien) => [
  ...[
    ...MAL_FORMES,
    ...(lien.jetonDansLeChemin ? [] : PARAMETRES_INVALIDES),
  ].map(
    ([cas, jeton]) =>
      [
        lien.nom,
        cas,
        lien,
        (serveur: Serveur) => lien.appeler(serveur, jeton(lien)),
      ] as const,
  ),
  ...(lien.refusPropres ?? []).map(
    ([cas, requete]) => [lien.nom, cas, lien, requete] as const,
  ),
]);

function reponseSansInstance(reponse: request.Response) {
  return {
    status: reponse.status,
    corps: { ...(reponse.body as object), instance: undefined },
  };
}

describe('Liens a jeton envoyes par courriel — un jeton refuse ne se distingue pas d un jeton inconnu', () => {
  const app = applicationDeLaSuite(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        LoggerModule.forRoot({
          pinoHttp: [optionsJournalHttp({ NODE_ENV: 'production' }), journal],
        }),
      ],
      controllers: [LeadMagnetsController, AuthController],
      providers: [
        GetToolkitByTokenUseCase,
        VerifyEmailUseCase,
        ResetPasswordUseCase,
      ],
    })
      .useMocker(() => depot)
      .compile();
    return bootstrapTestApp(moduleRef);
  });
  const serveur = () => serveurHttpDe(app());

  beforeEach(() => {
    for (const lecture of Object.values(depot)) {
      lecture.mockReset().mockResolvedValue(null);
    }
  });

  const PAR_LIEN = LIENS.map((lien) => [lien.nom, lien] as const);

  it.each(PAR_LIEN)(
    '%s cherche au depot un jeton de la forme emise',
    async (_nom, lien) => {
      await lien.appeler(serveur(), lien.inconnu).expect(404);

      expect(lien.lecture).toHaveBeenCalledWith(lien.cleCherchee(lien.inconnu));
    },
  );

  it.each(PAR_LIEN)(
    '%s dit a la personne que son lien est invalide ou expire, et documente ce refus en 404',
    async (_nom, lien) => {
      const reponse = await lien.appeler(serveur(), lien.inconnu);
      const [methode, chemin] = lien.operation;
      const documente =
        documentOpenApiFormations(app()).paths[chemin]?.[methode]?.responses;

      expect(reponse.body).toMatchObject({
        status: 404,
        detail: 'Lien invalide ou expiré.',
      });
      expect(documente?.['404']).toEqual({
        description: (reponse.body as { detail: string }).detail,
      });
    },
  );

  it.each(PAR_LIEN)(
    '%s n ecrit pas son jeton dans le journal HTTP de production',
    async (_nom, lien) => {
      const ligne = once(journal, EVENEMENT_LIGNE);

      await lien.appeler(serveur(), lien.inconnu).expect(404);
      const [{ brute, champs }] = (await ligne) as [LigneEcrite];

      expect(champs).toMatchObject({
        req: {
          method: lien.operation[0].toUpperCase(),
          url: expect.any(String) as unknown,
        },
        res: { statusCode: 404 },
      });
      expect(brute).not.toContain(lien.inconnu);
    },
  );

  it('la reinitialisation documente son jeton comme un texte de la forme emise', () => {
    expect(documentOpenApiFormations(app()).components?.schemas).toMatchObject({
      ResetPasswordDto: {
        properties: {
          token: { type: 'string', pattern: FORME_D_UN_JETON_EMIS.source },
        },
        required: expect.arrayContaining(['token']) as unknown,
      },
    });
  });

  it.each(CAS_REFUSES)(
    '%s refuse %s comme un jeton inconnu, sans lire le depot',
    async (_nom, _cas, lien, requete) => {
      const refuse = await requete(serveur());
      expect(lien.lecture).not.toHaveBeenCalled();

      const inconnu = await lien.appeler(serveur(), lien.inconnu);

      expect(inconnu.status).toBe(404);
      expect(reponseSansInstance(refuse)).toEqual(reponseSansInstance(inconnu));
    },
  );
});
