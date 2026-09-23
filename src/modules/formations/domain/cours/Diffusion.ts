import type { Cours, Ecran } from '../contrats/cours';
import type { DonneesParBrique } from '../contrats/donnees-publiques';
import type { PilotageEcran } from '../contrats/pilotage';
import type {
  CorrectionServie,
  CoursPublic,
  EcranPublic,
  TirageDuCours,
} from '../contrats/tirage';
import { ecranCorrigePar } from './Corrections';
import { questionsDe } from './Cours';
import { corrigeDeLEcran } from './DeroulePresentateur';
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
    ...(ecran.ecranCorrige === undefined
      ? {}
      : { ecranCorrige: ecran.ecranCorrige }),
  };
}

export function exempleAuRythmeDuPilotage(
  ecran: EcranPublic,
  pilotage: PilotageEcran | undefined,
): EcranPublic {
  if (ecran.type !== 'fp-worked') {
    return ecran;
  }
  const donnees = ecran.donnees as DonneesParBrique['fp-worked'];
  const etayage = pilotage?.etayage ?? 0;
  const servi: DonneesParBrique['fp-worked'] = {
    ...donnees,
    exemple: {
      ...donnees.exemple,
      etapes: donnees.exemple.etapes.map((etape, rang) =>
        rang < etayage ? etape : { ...etape, raisonnement: '' },
      ),
    },
    etayage,
  };
  return { ...ecran, donnees: servi };
}

function reflexionDe(source: Ecran): CorrectionServie['reflexion'] {
  if (source.brique !== 'fp-story') {
    return null;
  }
  const correction = source.proprietes.correction;
  if (correction === undefined || !('expected' in correction)) {
    return null;
  }
  return { attendu: correction.expected, suite: correction.nextAction };
}

export function correctionServie(
  cours: Cours,
  ecran: Ecran,
  tirage: TirageDuCours,
): CorrectionServie | null {
  const ecranId = ecranCorrigePar(ecran);
  const source = cours.ecrans.find((candidat) => candidat.id === ecranId);
  if (ecranId === null || source === undefined) {
    return null;
  }
  return {
    ecranId,
    questions: questionsDe(source)
      .filter(
        (question) => question.type === 'vote' || question.type === 'numeric',
      )
      .map((question) => ({
        questionId: question.id,
        bonneReponse: tirage.corriges[question.id].bonneReponse,
        optionId:
          question.type === 'vote'
            ? String(tirage.solutions[question.id].valeur)
            : null,
      })),
    corrige: corrigeDeLEcran(source),
    reflexion: reflexionDe(source),
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
