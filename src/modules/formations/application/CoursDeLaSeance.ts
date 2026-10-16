import type { Cours, Ecran } from '../domain/contrats/cours';
import {
  assertCorrectionNonProjetee,
  cibleServie,
} from '../domain/cours/EcranServi';
import type { ICatalogueCours } from '../domain/cours/ICatalogueCours.port';
import { assertPhaseOuverte } from '../domain/cours/PilotageEcrans';
import { CoursInconnuError } from '../domain/errors/FormationErrors';
import type {
  ISessionsRepository,
  SessionRecord,
} from '../domain/ISessions.repository';
import { assertSeanceTrouvee } from '../domain/SessionOwnership';
import { assertReponsesOuvertes } from '../domain/SessionState';

export async function seanceExistante(
  sessions: ISessionsRepository,
  sessionId: string,
): Promise<SessionRecord> {
  return assertSeanceTrouvee(await sessions.findById(sessionId), sessionId);
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
  session: Pick<SessionRecord, 'courseSlug' | 'courseVersion'>,
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

export function ecranOuvertAuxProductions<
  T extends { readonly rang: number; readonly ecran: Ecran },
>(
  session: SessionRecord,
  cours: Cours,
  cible: { readonly valeur: T | null; readonly id: string },
  absente: (id: string) => Error,
): T {
  const servie = cibleServie(
    session,
    cours,
    { ...cible, rang: (trouvee) => trouvee.rang },
    absente,
  );
  assertPhaseOuverte(session.pilotageEcrans, { ecranId: servie.ecran.id });
  assertCorrectionNonProjetee(session, cours, servie.ecran.id);
  return servie;
}
