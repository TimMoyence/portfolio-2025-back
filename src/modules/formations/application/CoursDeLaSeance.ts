import type { Cours, Ecran } from '../domain/contrats/cours';
import {
  assertCorrectionNonProjetee,
  assertEcranServi,
} from '../domain/cours/EcranServi';
import type { ICatalogueCours } from '../domain/cours/ICatalogueCours.port';
import { assertPhaseOuverte } from '../domain/cours/PilotageEcrans';
import {
  CoursInconnuError,
  SessionNotFoundError,
} from '../domain/errors/FormationErrors';
import type {
  IParticipantsRepository,
  ParticipantRecord,
} from '../domain/IParticipants.repository';
import type {
  ISessionsRepository,
  SessionRecord,
} from '../domain/ISessions.repository';
import { assertReponsesOuvertes } from '../domain/SessionState';
import { participantActif } from './ParticipantActif';

export async function seanceExistante(
  sessions: ISessionsRepository,
  sessionId: string,
): Promise<SessionRecord> {
  const session = await sessions.findById(sessionId);
  if (!session) {
    throw new SessionNotFoundError(sessionId);
  }
  return session;
}

export async function seanceOuverteAuxReponses(
  sessions: ISessionsRepository,
  sessionId: string,
): Promise<SessionRecord> {
  const session = await seanceExistante(sessions, sessionId);
  assertReponsesOuvertes(session.etat);
  return session;
}

export async function coursDeLaSeance(
  catalogue: ICatalogueCours,
  session: SessionRecord,
): Promise<Cours> {
  const cours = await catalogue.trouver(
    session.courseSlug,
    session.courseVersion,
  );
  if (!cours) {
    throw new CoursInconnuError(session.courseSlug);
  }
  return cours;
}

export async function contexteDuParticipant(
  depots: {
    readonly sessions: ISessionsRepository;
    readonly participants: IParticipantsRepository;
    readonly catalogue: ICatalogueCours;
  },
  sessionId: string,
  participantId: string,
): Promise<{
  session: SessionRecord;
  participant: ParticipantRecord;
  cours: Cours;
}> {
  const session = await seanceExistante(depots.sessions, sessionId);
  const participant = await participantActif(
    depots.participants,
    sessionId,
    participantId,
  );
  const cours = await coursDeLaSeance(depots.catalogue, session);
  return { session, participant, cours };
}

export function assertEcranOuvertAuxProductions(
  session: SessionRecord,
  cours: Cours,
  cible: { readonly rang: number; readonly ecran: Ecran },
): void {
  assertEcranServi(session, cible.rang, cible.ecran.id, cours.ecrans.length);
  assertPhaseOuverte(session.pilotageEcrans, { ecranId: cible.ecran.id });
  assertCorrectionNonProjetee(session, cours, cible.ecran.id);
}
