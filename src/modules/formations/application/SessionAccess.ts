import { InsufficientPermissionsError } from '../../../common/domain/errors/InsufficientPermissionsError';
import type {
  ISessionsRepository,
  SessionRecord,
} from '../domain/ISessions.repository';
import {
  assertSessionOwnedBy,
  assertSessionReadableBy,
  ROLE_ADMINISTRATEUR,
} from '../domain/SessionOwnership';
import type { ActeurFormation } from '../domain/SessionOwnership';

export function assertAdministrateur(acteur: ActeurFormation): void {
  if (!acteur.roles.includes(ROLE_ADMINISTRATEUR)) {
    throw new InsufficientPermissionsError(
      'Seul un administrateur ouvre une seance sur une version choisie.',
    );
  }
}

export async function seanceLisiblePar(
  sessions: ISessionsRepository,
  sessionId: string,
  acteur: ActeurFormation,
): Promise<SessionRecord> {
  return assertSessionReadableBy(
    await sessions.findById(sessionId),
    sessionId,
    acteur,
  );
}

export async function seancePilotablePar(
  sessions: ISessionsRepository,
  sessionId: string,
  teacherId: string,
): Promise<SessionRecord> {
  return assertSessionOwnedBy(
    await sessions.findById(sessionId),
    sessionId,
    teacherId,
  );
}
