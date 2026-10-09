export interface IClasseursDeCours {
  lire(classeur: string): Promise<Uint8Array>;
}
