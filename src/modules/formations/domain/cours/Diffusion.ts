import type { Cours } from '../contrats/cours';
import type { CoursPublic, EcranPublic } from '../contrats/tirage';
import { tirer } from './Tirage';

const GRAINE_DU_CATALOGUE = 0;

export function ecranVerrouille(ecran: EcranPublic): EcranPublic {
  return {
    id: ecran.id,
    type: 'ecran-verrouille',
    titre: ecran.titre,
    duree: ecran.duree,
    interactif: false,
    donnees: {},
  };
}

export function projeterCatalogue(cours: Cours): CoursPublic {
  const { sujet } = tirer(cours, GRAINE_DU_CATALOGUE);
  return {
    ...sujet,
    ecrans: sujet.ecrans.map((ecran, rang) =>
      cours.ecrans[rang].diffusion === 'seance'
        ? ecranVerrouille(ecran)
        : ecran,
    ),
  };
}
