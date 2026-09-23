import type { Cours } from '../contrats/cours';
import type { DonneesParBrique } from '../contrats/donnees-publiques';
import type { PilotageEcran } from '../contrats/pilotage';
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

export function exempleAuRythmeDuPilotage(
  ecran: EcranPublic,
  pilotage: PilotageEcran | undefined,
): EcranPublic {
  if (ecran.type !== 'fp-worked') {
    return ecran;
  }
  const { exemple } = ecran.donnees as DonneesParBrique['fp-worked'];
  const etayage = pilotage?.etayage ?? 0;
  const servi: DonneesParBrique['fp-worked'] = {
    exemple: {
      ...exemple,
      etapes: exemple.etapes.map((etape, rang) =>
        rang < etayage ? etape : { ...etape, raisonnement: '' },
      ),
    },
    etayage,
  };
  return { ...ecran, donnees: servi };
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
