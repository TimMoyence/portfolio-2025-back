export interface ClasseurTelecharge {
  readonly nom: string;
  readonly type: string;
  readonly contenu: Uint8Array;
}

export interface IClasseursDeCours {
  lire(classeur: string): Promise<ClasseurTelecharge>;
}
