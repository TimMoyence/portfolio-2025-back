import { UnauthorizedException } from '@nestjs/common';
import { ParticipantTokenService } from '../ParticipantToken.service';

const SECRET = 'un-secret-de-test-suffisamment-long-1234';
const SESSION = '4d0f2a9e-0d7f-4d2f-9a3c-1f6b2a7c8d90';
const AUTRE_SESSION = '9c8b7a6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d';
const PARTICIPANT = '8f1c3b2a-5d4e-4f6a-9b8c-7d6e5f4a3b2c';

describe('ParticipantTokenService', () => {
  const service = new ParticipantTokenService();
  const secretInitial = process.env.FORMATION_REVIEW_TOKEN_SECRET;

  beforeEach(() => {
    process.env.FORMATION_REVIEW_TOKEN_SECRET = SECRET;
  });

  afterAll(() => {
    process.env.FORMATION_REVIEW_TOKEN_SECRET = secretInitial;
  });

  it('rend le participantId signe', () => {
    const jeton = service.sign(SESSION, PARTICIPANT);

    expect(service.verify(SESSION, jeton)).toBe(PARTICIPANT);
  });

  it('refuse un jeton emis pour une autre session', () => {
    const jeton = service.sign(AUTRE_SESSION, PARTICIPANT);

    expect(() => service.verify(SESSION, jeton)).toThrow(UnauthorizedException);
  });

  it('refuse un jeton dont le participantId a ete remplace', () => {
    const [, empreinte] = service.sign(SESSION, PARTICIPANT).split('.');

    expect(() => service.verify(SESSION, `autre-id.${empreinte}`)).toThrow(
      UnauthorizedException,
    );
  });

  it('refuse une empreinte tronquee', () => {
    const jeton = service.sign(SESSION, PARTICIPANT);

    expect(() => service.verify(SESSION, jeton.slice(0, -4))).toThrow(
      UnauthorizedException,
    );
  });

  it.each([undefined, '', 'sans-separateur', '.empreinte-orpheline'])(
    'refuse le jeton illisible %p',
    (jeton) => {
      expect(() => service.verify(SESSION, jeton)).toThrow(
        UnauthorizedException,
      );
    },
  );

  it('refuse de signer quand le secret est trop court', () => {
    process.env.FORMATION_REVIEW_TOKEN_SECRET = 'trop-court';

    expect(() => service.sign(SESSION, PARTICIPANT)).toThrow(
      'FORMATION_REVIEW_TOKEN_SECRET',
    );
  });

  it('refuse de signer quand le secret est absent', () => {
    delete process.env.FORMATION_REVIEW_TOKEN_SECRET;

    expect(() => service.sign(SESSION, PARTICIPANT)).toThrow(
      'FORMATION_REVIEW_TOKEN_SECRET',
    );
  });

  it('ne produit pas la meme empreinte que le lien de revision', () => {
    const jeton = service.sign(SESSION, PARTICIPANT);
    const { createHmac } =
      jest.requireActual<typeof import('node:crypto')>('node:crypto');
    const empreinteRevision = createHmac('sha256', SECRET)
      .update(`${SESSION}:${PARTICIPANT}`)
      .digest('hex');

    expect(jeton.endsWith(empreinteRevision)).toBe(false);
  });
});
