export interface EcranPublic {
  readonly id: string;
  readonly type: string;
  readonly duree: number;
  readonly interactif: boolean;
  readonly donnees: Readonly<Record<string, unknown>>;
}

export interface CoursPublic {
  readonly id: string;
  readonly titre: string;
  readonly niveau: string;
  readonly duree: number;
  readonly concepts: readonly string[];
  readonly ecrans: readonly EcranPublic[];
}
