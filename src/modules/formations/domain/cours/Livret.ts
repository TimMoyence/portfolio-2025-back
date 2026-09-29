import type { Cours } from '../contrats/cours';
import type { DerouleCours } from '../contrats/deroule';
import type { CoursPublic } from '../contrats/tirage';
import { deroulePresentateur } from './DeroulePresentateur';
import { GRAINE_DU_CATALOGUE } from './Diffusion';
import { tirer } from './Tirage';

export interface LivretDuCours {
  readonly sujet: CoursPublic;
  readonly corrige: DerouleCours;
}

export interface LivretPublie extends LivretDuCours {
  readonly version: number;
}

export function livretDuCours(cours: Cours): LivretDuCours {
  return {
    sujet: tirer(cours, GRAINE_DU_CATALOGUE).sujet,
    corrige: deroulePresentateur(cours, GRAINE_DU_CATALOGUE),
  };
}
