export interface ContexteDEcriture {
  save: { mockRejectedValue(erreur: unknown): unknown };
  ecrire: () => Promise<unknown>;
}

export function verifierPanneDEcritureTransmise(
  contexte: () => ContexteDEcriture,
): void {
  it('laisse passer une erreur qui ne vient pas d une violation de contrainte unique', async () => {
    const { save, ecrire } = contexte();
    save.mockRejectedValue(new Error('connexion perdue'));

    await expect(ecrire()).rejects.toThrow('connexion perdue');
  });
}
