export function messageDErreur(erreur: unknown): string {
  return erreur instanceof Error ? erreur.message : String(erreur);
}
