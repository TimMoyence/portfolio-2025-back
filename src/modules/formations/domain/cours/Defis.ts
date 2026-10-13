import type { Cours, Ecran } from '../contrats/cours';

export interface EcranDeDefi {
  readonly ecran: Extract<Ecran, { readonly brique: 'fp-challenge' }>;
  readonly rang: number;
}

export interface StrategiePubliee {
  readonly id: string;
  readonly libelle: string;
  readonly fausse?: boolean;
}

export function ecranDeDefi(cours: Cours, defiId: string): EcranDeDefi | null {
  for (const [rang, ecran] of cours.ecrans.entries()) {
    if (
      ecran.brique === 'fp-challenge' &&
      ecran.proprietes.probleme.id === defiId
    ) {
      return { ecran, rang };
    }
  }
  return null;
}

export function strategiesPubliees(
  cible: EcranDeDefi,
  revele: boolean,
): readonly StrategiePubliee[] {
  return cible.ecran.defi.strategies.map((strategie) =>
    revele
      ? {
          id: strategie.id,
          libelle: strategie.libelle,
          fausse: strategie.fausse,
        }
      : { id: strategie.id, libelle: strategie.libelle },
  );
}
