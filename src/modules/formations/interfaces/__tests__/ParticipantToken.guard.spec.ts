import { UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import { ParticipantTokenGuard } from '../ParticipantToken.guard';
import {
  EN_TETE_JETON,
  ParticipantTokenService,
} from '../ParticipantToken.service';

const SESSION_ID = '11111111-1111-4111-8111-111111111111';
const AUTRE_SESSION_ID = '22222222-2222-4222-8222-222222222222';
const PARTICIPANT_ID = '33333333-3333-4333-8333-333333333333';
const SECRET_TEST = 'secret-de-test-assez-long-pour-hmac-sha256-0123456789';

function contexte(
  sessionId: string | undefined,
  jeton: string | readonly string[] | undefined,
): ExecutionContext {
  const requete = {
    params: { id: sessionId },
    headers: jeton === undefined ? {} : { [EN_TETE_JETON]: jeton },
  };
  return {
    switchToHttp: () => ({ getRequest: () => requete }),
  } as unknown as ExecutionContext;
}

describe('ParticipantTokenGuard', () => {
  const secretInitial = process.env.FORMATION_REVIEW_TOKEN_SECRET;
  const tokens = new ParticipantTokenService();
  const garde = new ParticipantTokenGuard(tokens);

  beforeAll(() => {
    process.env.FORMATION_REVIEW_TOKEN_SECRET = SECRET_TEST;
  });

  afterAll(() => {
    process.env.FORMATION_REVIEW_TOKEN_SECRET = secretInitial;
  });

  it('laisse passer un jeton signe pour cette seance', () => {
    const jeton = tokens.sign(SESSION_ID, PARTICIPANT_ID);

    expect(garde.canActivate(contexte(SESSION_ID, jeton))).toBe(true);
  });

  it('retient le premier jeton quand l en-tete arrive en double', () => {
    const jeton = tokens.sign(SESSION_ID, PARTICIPANT_ID);

    expect(
      garde.canActivate(contexte(SESSION_ID, [jeton, 'forge.abcdef'])),
    ).toBe(true);
    expect(() =>
      garde.canActivate(contexte(SESSION_ID, ['forge.abcdef', jeton])),
    ).toThrow(UnauthorizedException);
  });

  it('refuse une requete dont la route ne porte aucune seance', () => {
    const jeton = tokens.sign(SESSION_ID, PARTICIPANT_ID);

    expect(() => garde.canActivate(contexte(undefined, jeton))).toThrow(
      UnauthorizedException,
    );
  });

  it('refuse une requete sans jeton avant toute ouverture de flux', () => {
    expect(() => garde.canActivate(contexte(SESSION_ID, undefined))).toThrow(
      UnauthorizedException,
    );
  });

  it('refuse un jeton forge qui a la forme attendue', () => {
    expect(() =>
      garde.canActivate(contexte(SESSION_ID, `${PARTICIPANT_ID}.abcdef`)),
    ).toThrow(UnauthorizedException);
  });

  it('refuse un jeton valide emis pour une autre seance', () => {
    const jeton = tokens.sign(AUTRE_SESSION_ID, PARTICIPANT_ID);

    expect(() => garde.canActivate(contexte(SESSION_ID, jeton))).toThrow(
      UnauthorizedException,
    );
  });
});
