import { messageDErreur } from '../domain/errors/message-d-erreur';

export interface JournalDesEchecs {
  warn(message: string): void;
}

export function journaliserLEchec(
  tache: Promise<unknown>,
  echec: string,
  journal: JournalDesEchecs,
): Promise<void> {
  return tache.then(
    () => undefined,
    (erreur: unknown) => journal.warn(`${echec}: ${messageDErreur(erreur)}`),
  );
}

export function enArrierePlan(
  tache: Promise<unknown>,
  echec: string,
  journal: JournalDesEchecs,
): void {
  void journaliserLEchec(tache, echec, journal);
}
