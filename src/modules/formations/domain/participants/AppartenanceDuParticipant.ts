import type { ParticipantRecord } from './IParticipants.repository';

type ExclusionDuParticipant = 'absent' | 'evince' | 'revoque';

export type AppartenanceDuParticipant =
  | { readonly participant: ParticipantRecord; readonly exclusion: null }
  | { readonly exclusion: ExclusionDuParticipant };

export function appartenanceDuParticipant(
  participant: ParticipantRecord | null,
  sessionId: string,
  generation?: number,
): AppartenanceDuParticipant {
  if (participant === null || participant.sessionId !== sessionId) {
    return { exclusion: 'absent' };
  }
  if (
    generation !== undefined &&
    participant.generationDeJeton !== generation
  ) {
    return { exclusion: 'revoque' };
  }
  return participant.evinceLe === null
    ? { participant, exclusion: null }
    : { exclusion: 'evince' };
}
