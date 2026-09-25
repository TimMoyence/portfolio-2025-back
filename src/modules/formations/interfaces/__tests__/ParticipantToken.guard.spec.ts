import { UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import {
  buildParticipantRecord,
  createMockParticipantsRepo,
} from '../../../../../test/factories/formation.factory';
import { installerVariables } from '../../../../../test/helpers/environnement';
import { ParticipantTokenGuard } from '../ParticipantToken.guard';
import {
  EN_TETE_JETON,
  ParticipantTokenService,
} from '../ParticipantToken.service';

const SESSION_ID = '11111111-1111-4111-8111-111111111111';
const AUTRE_SESSION_ID = '22222222-2222-4222-8222-222222222222';
const PARTICIPANT_ID = '33333333-3333-4333-8333-333333333333';
const SECRET_TEST = 'secret-de-test-assez-long-pour-hmac-sha256-0123456789';

interface RequeteDeTest {
  params: { id: string | undefined };
  headers: Record<string, string | readonly string[]>;
  participantId?: string;
  generationDeJeton?: number;
}

function requeteDe(
  sessionId: string | undefined,
  jeton: string | readonly string[] | undefined,
): RequeteDeTest {
  return {
    params: { id: sessionId },
    headers: jeton === undefined ? {} : { [EN_TETE_JETON]: jeton },
  };
}

function contexteDe(requete: RequeteDeTest): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => requete }),
  } as unknown as ExecutionContext;
}

function contexte(
  sessionId: string | undefined,
  jeton: string | readonly string[] | undefined,
): ExecutionContext {
  return contexteDe(requeteDe(sessionId, jeton));
}

describe('ParticipantTokenGuard', () => {
  const participants = createMockParticipantsRepo();
  const tokens = new ParticipantTokenService(participants);
  const garde = new ParticipantTokenGuard(tokens);
  const signer = (sessionId = SESSION_ID, generation = 0) =>
    tokens.sign(sessionId, PARTICIPANT_ID, generation);

  installerVariables({ FORMATION_REVIEW_TOKEN_SECRET: SECRET_TEST });

  beforeEach(() => {
    participants.findById
      .mockReset()
      .mockResolvedValue(
        buildParticipantRecord({ id: PARTICIPANT_ID, sessionId: SESSION_ID }),
      );
  });

  it('laisse passer un jeton signe pour cette seance', async () => {
    await expect(
      garde.canActivate(contexte(SESSION_ID, signer())),
    ).resolves.toBe(true);
  });

  it('rattache a la requete le participant dont il a verifie le jeton', async () => {
    const requete = requeteDe(SESSION_ID, signer());

    await garde.canActivate(contexteDe(requete));

    expect(requete.participantId).toBe(PARTICIPANT_ID);
  });

  it('S1 · rattache a la requete la generation de jeton qu il a verifiee', async () => {
    participants.findById.mockResolvedValue(
      buildParticipantRecord({
        id: PARTICIPANT_ID,
        sessionId: SESSION_ID,
        generationDeJeton: 2,
      }),
    );
    const requete = requeteDe(SESSION_ID, signer(SESSION_ID, 2));

    await garde.canActivate(contexteDe(requete));

    expect(requete.generationDeJeton).toBe(2);
  });

  it('ne rattache aucun participant quand le jeton est refuse', async () => {
    const requete = requeteDe(SESSION_ID, `${PARTICIPANT_ID}.0.abcdef`);

    await expect(garde.canActivate(contexteDe(requete))).rejects.toThrow(
      UnauthorizedException,
    );
    expect(requete.participantId).toBeUndefined();
  });

  it('S1 · refuse le jeton d un poste libere depuis', async () => {
    participants.findById.mockResolvedValue(
      buildParticipantRecord({
        id: PARTICIPANT_ID,
        sessionId: SESSION_ID,
        generationDeJeton: 1,
      }),
    );

    await expect(
      garde.canActivate(contexte(SESSION_ID, signer())),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('retient le premier jeton quand l en-tete arrive en double', async () => {
    await expect(
      garde.canActivate(contexte(SESSION_ID, [signer(), 'forge.0.abcdef'])),
    ).resolves.toBe(true);
    await expect(
      garde.canActivate(contexte(SESSION_ID, ['forge.0.abcdef', signer()])),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('refuse une requete dont la route ne porte aucune seance', async () => {
    await expect(
      garde.canActivate(contexte(undefined, signer())),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('refuse une requete sans jeton avant toute ouverture de flux', async () => {
    await expect(
      garde.canActivate(contexte(SESSION_ID, undefined)),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('refuse un jeton forge qui a la forme attendue', async () => {
    await expect(
      garde.canActivate(contexte(SESSION_ID, `${PARTICIPANT_ID}.0.abcdef`)),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('refuse un jeton valide emis pour une autre seance', async () => {
    await expect(
      garde.canActivate(contexte(SESSION_ID, signer(AUTRE_SESSION_ID))),
    ).rejects.toThrow(UnauthorizedException);
  });
});
