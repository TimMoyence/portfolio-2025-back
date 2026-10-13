import { Writable } from 'node:stream';

export const EVENEMENT_LIGNE = 'ligne';

export interface LigneEcrite {
  readonly brute: string;
  readonly champs: unknown;
}

export function fluxDeJournal(): Writable {
  return new Writable({
    write(morceau: Buffer, _encodage, suite) {
      const brute = morceau.toString('utf8');
      const ligne: LigneEcrite = { brute, champs: JSON.parse(brute) };
      this.emit(EVENEMENT_LIGNE, ligne);
      suite();
    },
  });
}
