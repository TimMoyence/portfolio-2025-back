import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AuthController } from '../src/modules/users/interfaces/Auth.controller';
import {
  REFRESH_SANS_JETON_PAR_ADRESSE,
  REFRESH_TOKEN_RATE_LIMIT,
} from '../src/modules/users/domain/auth.constants';
import {
  authControllerProviders,
  createAuthUseCaseStubs,
} from './factories/core-api.factory';
import { buildAuthResult, buildUser } from './factories/user.factory';
import {
  applicationDeLaSuite,
  bootstrapTestAppAvecCookies,
  httpServerOf,
} from './helpers/nest-test-app';

const JETON_DU_FORMATEUR = 'jeton-de-rafraichissement-du-formateur';
const JETON_D_UN_AUTRE_POSTE = 'jeton-de-rafraichissement-d-un-autre-poste';

describe('Rafraichissement de session — une salle derriere une seule adresse', () => {
  const authStubs = createAuthUseCaseStubs();

  const app = applicationDeLaSuite(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot([{ ttl: 60000, limit: 30 }])],
      controllers: [AuthController],
      providers: [
        ...authControllerProviders(authStubs),
        { provide: APP_GUARD, useClass: ThrottlerGuard },
      ],
    }).compile();

    return bootstrapTestAppAvecCookies(moduleRef);
  });

  const rafraichir = (jeton?: string) => {
    const appel = request(httpServerOf(app())).post('/api/auth/refresh');
    return jeton === undefined
      ? appel
      : appel.set('Cookie', `refresh_token=${jeton}`);
  };

  const statutsDistincts = async (
    rafraichissements: number,
    jeton?: string,
  ): Promise<number[]> => {
    const statuts = new Set<number>();
    for (let appel = 0; appel < rafraichissements; appel += 1) {
      statuts.add((await rafraichir(jeton)).status);
    }
    return [...statuts];
  };

  beforeEach(() => {
    authStubs.refreshTokensUseCase.execute.mockResolvedValue(
      buildAuthResult({
        refreshToken: JETON_DU_FORMATEUR,
        user: buildUser({ roles: ['teacher'] }),
      }),
    );
  });

  it('repond 401 et non 429 aux postes anonymes d une salle qui rechargent le cours', async () => {
    await expect(
      statutsDistincts(2 * REFRESH_TOKEN_RATE_LIMIT),
    ).resolves.toEqual([401]);
  });

  it('laisse le formateur rafraichir quand les postes anonymes ont atteint le plafond de l adresse', async () => {
    await expect(
      statutsDistincts(
        REFRESH_SANS_JETON_PAR_ADRESSE - 2 * REFRESH_TOKEN_RATE_LIMIT,
      ),
    ).resolves.toEqual([401]);
    expect((await rafraichir()).status).toBe(429);
    expect((await rafraichir(JETON_DU_FORMATEUR)).status).toBe(200);
  });

  it('borne toujours les rafraichissements d un meme jeton', async () => {
    await expect(
      statutsDistincts(REFRESH_TOKEN_RATE_LIMIT, JETON_D_UN_AUTRE_POSTE),
    ).resolves.toEqual([200]);
    expect((await rafraichir(JETON_D_UN_AUTRE_POSTE)).status).toBe(429);
  });
});
