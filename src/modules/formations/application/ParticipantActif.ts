import { appartenanceDuParticipant } from '../domain/AppartenanceDuParticipant';
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
  const appartenance = appartenanceDuParticipant(
    await participants.findById(participantId),
    sessionId,
  );
  if (appartenance.exclusion !== null) {
    throw new ParticipantNotFoundError(participantId);
  }
  return appartenance.participant;
}
