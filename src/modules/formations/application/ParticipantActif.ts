import type {
  IParticipantsRepository,
  ParticipantRecord,
} from '../domain/IParticipants.repository';
import { ParticipantNotFoundError } from '../domain/errors/FormationErrors';

export async function participantActif(
  participants: IParticipantsRepository,
  sessionId: string,
  participantId: string,
): Promise<ParticipantRecord> {
  const participant = await participants.findById(participantId);
  if (
    participant === null ||
    participant.sessionId !== sessionId ||
    participant.evinceLe !== null
  ) {
    throw new ParticipantNotFoundError(participantId);
  }
  return participant;
}
