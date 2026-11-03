import { BadRequestException } from '@nestjs/common';
import type { ArgumentMetadata } from '@nestjs/common';
import { CibleParticipantPipe } from './cible-participant.params';

const SESSION_ID = '4d0f2a9e-0d7f-4d2f-9a3c-1f6b2a7c8d90';
const PARTICIPANT_ID = 'a0b1c2d3-e4f5-4678-9012-abcdefabcdef';
const HORS_RFC = '11111111-1111-1111-1111-111111111111';
const METADONNEES: ArgumentMetadata = { type: 'param' };

const cibler = (params: Record<string, string>) =>
  new CibleParticipantPipe().transform(params, METADONNEES);

describe('CibleParticipantPipe', () => {
  it('accepte une seance et un participant designes par leur uuid', async () => {
    await expect(
      cibler({ id: SESSION_ID, participantId: PARTICIPANT_ID }),
    ).resolves.toEqual({ id: SESSION_ID, participantId: PARTICIPANT_ID });
  });

  it('accepte un uuid bien forme hors version RFC, comme ParseUUIDPipe', async () => {
    await expect(
      cibler({ id: HORS_RFC, participantId: HORS_RFC }),
    ).resolves.toEqual({ id: HORS_RFC, participantId: HORS_RFC });
  });

  it.each([
    ['la seance', { id: 'pas-un-uuid', participantId: PARTICIPANT_ID }],
    ['le participant', { id: SESSION_ID, participantId: 'pas-un-uuid' }],
  ])(
    'refuse %s quand ce n est pas un uuid, avec le message de ParseUUIDPipe',
    async (_cible, params) => {
      const refus = cibler(params);
      await expect(refus).rejects.toBeInstanceOf(BadRequestException);
      await expect(refus).rejects.toThrow(
        'Validation failed (uuid is expected)',
      );
    },
  );
});
