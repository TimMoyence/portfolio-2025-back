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
  ISessionsRepository,
  SessionRecord,
} from '../domain/ISessions.repository';
import { assertReponsesOuvertes } from '../domain/SessionState';

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

export function assertEcranOuvertAuxProductions(
  session: SessionRecord,
  cours: Cours,
  cible: { readonly rang: number; readonly ecran: Ecran },
): void {
  assertEcranServi(session, cible.rang, cible.ecran.id, cours.ecrans.length);
  assertPhaseOuverte(session.pilotageEcrans, { ecranId: cible.ecran.id });
  assertCorrectionNonProjetee(session, cours, cible.ecran.id);
}
