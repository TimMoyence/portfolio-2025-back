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

function reflexionDe(
  corrige: CorrectionServie['corrige'],
): CorrectionServie['reflexion'] {
  return corrige?.type === 'reflexion'
    ? { attendu: corrige.attendu, suite: corrige.suite }
    : null;
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
  return correctionDe(source, tirage);
}

export function correctionDeLEcranRevele(
  ecran: Ecran,
  tirage: TirageDuCours,
): CorrectionServie | null {
  const correction = correctionDe(ecran, tirage);
  return correction.questions.length === 0 &&
    correction.corrige === null &&
    correction.reflexion === null
    ? null
    : correction;
}

function correctionDe(source: Ecran, tirage: TirageDuCours): CorrectionServie {
  const corrige = corrigeDeLEcran(source);
  return {
    ecranId: source.id,
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
    corrige,
    reflexion: reflexionDe(corrige),
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
