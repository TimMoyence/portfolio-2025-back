/* eslint-disable @typescript-eslint/unbound-method */
import { UnauthorizedException } from '@nestjs/common';
import {
  buildParticipantRecord,
  createMockParticipantsRepo,
} from '../../../../../test/factories/formation.factory';
import {
  identiteSignee,
  ParticipantTokenService,
} from '../ParticipantToken.service';

const SECRET = 'un-secret-de-test-suffisamment-long-1234';
const SESSION = '4d0f2a9e-0d7f-4d2f-9a3c-1f6b2a7c8d90';
const AUTRE_SESSION = '9c8b7a6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d';
const PARTICIPANT = '8f1c3b2a-5d4e-4f6a-9b8c-7d6e5f4a3b2c';

describe('ParticipantTokenService', () => {
  const participants = createMockParticipantsRepo();
  const service = new ParticipantTokenService(participants);
  const secretInitial = process.env.FORMATION_REVIEW_TOKEN_SECRET;

  beforeEach(() => {
    process.env.FORMATION_REVIEW_TOKEN_SECRET = SECRET;
    participants.findById.mockReset().mockResolvedValue(
      buildParticipantRecord({
        id: PARTICIPANT,
        sessionId: SESSION,
        generationDeJeton: 0,
      }),
    );
  });

  afterAll(() => {
    process.env.FORMATION_REVIEW_TOKEN_SECRET = secretInitial;
  });

  it('rend le participantId signe', async () => {
    const jeton = service.sign(SESSION, PARTICIPANT, 0);

    await expect(service.verify(SESSION, jeton)).resolves.toBe(PARTICIPANT);
  });

  it('refuse un jeton emis pour une autre session', async () => {
    const jeton = service.sign(AUTRE_SESSION, PARTICIPANT, 0);

    await expect(service.verify(SESSION, jeton)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('refuse un jeton dont le participantId a ete remplace', async () => {
    const [, generation, empreinte] = service
      .sign(SESSION, PARTICIPANT, 0)
      .split('.');

    await expect(
      service.verify(SESSION, `autre-id.${generation}.${empreinte}`),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('S1 · refuse un jeton dont la generation a ete remplacee', async () => {
    const [id, , empreinte] = service.sign(SESSION, PARTICIPANT, 0).split('.');

    await expect(
      service.verify(SESSION, `${id}.1.${empreinte}`),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('S1 · refuse le jeton d une generation revoquee par la liberation du poste', async () => {
    const jeton = service.sign(SESSION, PARTICIPANT, 0);
    participants.findById.mockResolvedValue(
      buildParticipantRecord({
        id: PARTICIPANT,
        sessionId: SESSION,
        generationDeJeton: 1,
      }),
    );

    await expect(service.verify(SESSION, jeton)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('S1 · accepte le jeton de la generation courante apres liberation', async () => {
    participants.findById.mockResolvedValue(
      buildParticipantRecord({
        id: PARTICIPANT,
        sessionId: SESSION,
        generationDeJeton: 1,
      }),
    );

    await expect(
      service.verify(SESSION, service.sign(SESSION, PARTICIPANT, 1)),
    ).resolves.toBe(PARTICIPANT);
  });

  it('refuse le jeton d un participant absent de la seance', async () => {
    participants.findById.mockResolvedValue(null);

    await expect(
      service.verify(SESSION, service.sign(SESSION, PARTICIPANT, 0)),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('ne consulte pas le depot pour un jeton dont la signature est fausse', async () => {
    const jeton = service.sign(SESSION, PARTICIPANT, 0);

    await expect(service.verify(SESSION, jeton.slice(0, -4))).rejects.toThrow(
      UnauthorizedException,
    );
    expect(participants.findById).not.toHaveBeenCalled();
  });

  it.each([
    undefined,
    '',
    'sans-separateur',
    '.empreinte-orpheline',
    'id.empreinte',
    'id.-1.empreinte',
    'id.1e3.empreinte',
  ])('refuse le jeton illisible %p', async (jeton) => {
    await expect(service.verify(SESSION, jeton)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('tire du jeton signe le participant et sa generation sans consulter le depot', () => {
    expect(
      identiteSignee(SESSION, service.sign(SESSION, PARTICIPANT, 3)),
    ).toEqual({ participantId: PARTICIPANT, generation: 3 });
    expect(participants.findById).not.toHaveBeenCalled();
  });

  it('refuse de signer quand le secret est trop court', () => {
    process.env.FORMATION_REVIEW_TOKEN_SECRET = 'trop-court';

    expect(() => service.sign(SESSION, PARTICIPANT, 0)).toThrow(
      'FORMATION_REVIEW_TOKEN_SECRET',
    );
  });

  it('refuse de signer quand le secret est absent', () => {
    delete process.env.FORMATION_REVIEW_TOKEN_SECRET;

    expect(() => service.sign(SESSION, PARTICIPANT, 0)).toThrow(
      'FORMATION_REVIEW_TOKEN_SECRET',
    );
  });

  it('ne produit pas la meme empreinte que le lien de revision', () => {
    const jeton = service.sign(SESSION, PARTICIPANT, 0);
    const { createHmac } =
      jest.requireActual<typeof import('node:crypto')>('node:crypto');
    const empreinteRevision = createHmac('sha256', SECRET)
      .update(`${SESSION}:${PARTICIPANT}`)
      .digest('hex');

    expect(jeton.endsWith(empreinteRevision)).toBe(false);
  });
});
