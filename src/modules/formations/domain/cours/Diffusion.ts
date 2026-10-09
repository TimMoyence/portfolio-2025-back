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
import { explicationsRevelees } from './CorrectionSurPlace';
import { questionsDe } from './Cours';
import { corrigeDeLEcran } from './DeroulePresentateur';
import { etayageAtteint } from './EcranServi';
import { tirer } from './Tirage';

export const GRAINE_DU_CATALOGUE = 0;

export const ECRAN_VERROUILLE = 'ecran-verrouille';

export function ecranVerrouille(ecran: EcranPublic): EcranPublic {
  return {
    id: ecran.id,
    type: ECRAN_VERROUILLE,
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
  const etayage = etayageAtteint(pilotage);
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

export function correctionSurPlaceServie(
  ecran: Ecran,
  tirage: TirageDuCours,
  pilotage: PilotageEcran | undefined,
): CorrectionServie | null {
  const explications = explicationsRevelees(ecran, pilotage);
  if (explications.length === 0) {
    return null;
  }
  const correction = correctionDe(ecran, tirage);
  const references = new Set(
    explications.map((explication) => explication.reference),
  );
  const toutes = pilotage?.revele === true;
  return {
    ...correction,
    questions: correction.questions.filter(
      (question) => toutes || references.has(question.questionId),
    ),
    explications,
  };
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
