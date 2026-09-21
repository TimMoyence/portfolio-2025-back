import type { Cours } from '../contrats/cours';
import type { AnswerRecord } from '../IAnswers.repository';
import type { MasteryRecord } from '../IMastery.repository';
import { isDue } from '../LeitnerBox';

export const DELAI_MIN_RAPPEL_MS = 30 * 60 * 1000;
const CONCEPT_EXCLU = 'controle-coherence';
export const CONCEPTS_MAX = 2;

export interface EcranDeRappel {
  readonly screenId: string;
  readonly rang: number;
  readonly obligatoires: readonly string[];
  readonly banque: readonly {
    readonly id: string;
    readonly concept: string;
  }[];
}

export interface ContexteDeChoix {
  readonly cible: EcranDeRappel;
  readonly reponses: readonly AnswerRecord[];
  readonly maitrise: readonly MasteryRecord[];
  readonly maintenant: Date;
}

export function ecranDeRappel(cours: Cours): EcranDeRappel | null {
  for (const [rang, ecran] of cours.ecrans.entries()) {
    if (ecran.brique === 'fp-spaced') {
      return {
        screenId: ecran.id,
        rang,
        obligatoires: ecran.obligatoires,
        banque: ecran.banque.map((question) => ({
          id: question.id,
          concept: question.concept,
        })),
      };
    }
  }
  return null;
}

interface DerniereReponse {
  readonly correcte: boolean;
  readonly soumisLe: Date;
}

function derniereReponseParConcept(
  reponses: readonly AnswerRecord[],
): ReadonlyMap<string, DerniereReponse> {
  const parConcept = new Map<string, DerniereReponse>();
  for (const reponse of reponses) {
    const courante = parConcept.get(reponse.concept);
    if (courante === undefined || courante.soumisLe < reponse.soumisLe) {
      parConcept.set(reponse.concept, {
        correcte: reponse.correcte,
        soumisLe: reponse.soumisLe,
      });
    }
  }
  return parConcept;
}

function tauxDeReussite(entree: MasteryRecord | undefined): number {
  if (entree === undefined || entree.succes + entree.echecs === 0) {
    return 0;
  }
  return entree.succes / (entree.succes + entree.echecs);
}

function assezAncienne(reponse: DerniereReponse, maintenant: Date): boolean {
  return (
    maintenant.getTime() - reponse.soumisLe.getTime() >= DELAI_MIN_RAPPEL_MS
  );
}

function prioriteDuConcept(
  concept: string,
  contexte: ContexteDeChoix,
  derniere: ReadonlyMap<string, DerniereReponse>,
): number {
  const reponse = derniere.get(concept);
  if (
    reponse !== undefined &&
    !reponse.correcte &&
    assezAncienne(reponse, contexte.maintenant)
  ) {
    return 1;
  }
  const entree = contexte.maitrise.find(
    (candidate) => candidate.concept === concept,
  );
  if (
    entree !== undefined &&
    isDue({ boite: entree.boite, seancesDepuisDerniereVue: entree.boite })
  ) {
    return 2;
  }
  if (
    reponse !== undefined &&
    reponse.correcte &&
    assezAncienne(reponse, contexte.maintenant)
  ) {
    return 3;
  }
  return 4;
}

export function choisirRappels(contexte: ContexteDeChoix): readonly string[] {
  const repondues = new Set(
    contexte.reponses.map((reponse) => reponse.questionId),
  );
  const obligatoires = contexte.cible.obligatoires.filter(
    (id) => !repondues.has(id),
  );
  const restantes = contexte.cible.banque.filter(
    (question) =>
      !repondues.has(question.id) &&
      !obligatoires.includes(question.id) &&
      question.concept !== CONCEPT_EXCLU,
  );
  const derniere = derniereReponseParConcept(contexte.reponses);
  const rangDansLaBanque = new Map(
    contexte.cible.banque.map((question, rang) => [question.concept, rang]),
  );
  const concepts = [...new Set(restantes.map((question) => question.concept))];
  const classes = concepts
    .map((concept) => ({
      concept,
      priorite: prioriteDuConcept(concept, contexte, derniere),
      anciennete: derniere.get(concept)?.soumisLe.getTime() ?? 0,
      taux: tauxDeReussite(
        contexte.maitrise.find((entree) => entree.concept === concept),
      ),
      rang: rangDansLaBanque.get(concept) ?? Number.MAX_SAFE_INTEGER,
    }))
    .sort(comparerCandidats)
    .slice(0, CONCEPTS_MAX);
  const complement = classes.map(
    ({ concept }) =>
      restantes.find((question) => question.concept === concept)!.id,
  );
  return [...obligatoires, ...complement];
}

interface Candidat {
  readonly priorite: number;
  readonly anciennete: number;
  readonly taux: number;
  readonly rang: number;
}

function comparerCandidats(gauche: Candidat, droite: Candidat): number {
  if (gauche.priorite !== droite.priorite) {
    return gauche.priorite - droite.priorite;
  }
  if (gauche.priorite === 1 && gauche.anciennete !== droite.anciennete) {
    return gauche.anciennete - droite.anciennete;
  }
  if (gauche.taux !== droite.taux) {
    return gauche.taux - droite.taux;
  }
  return gauche.rang - droite.rang;
}
