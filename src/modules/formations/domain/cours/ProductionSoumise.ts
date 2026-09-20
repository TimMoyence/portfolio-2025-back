import type { Cours, Ecran, QuestionProduction } from '../contrats/cours';
import type { DetailProduction, ValeurProduction } from '../contrats/resultats';
import {
  ProductionInvalideError,
  ProductionVideError,
} from '../errors/FormationErrors';
import type { ConfusionId } from './banque/confusions';
import type { CorrigeProduction } from './Corrige';
import {
  corrigerClassement,
  corrigerFeuille,
  corrigerTableau,
  type SaisiesDeTableau,
} from './CorrectionProduction';
import { estDansLaGrille } from './PlansStockes';

const REFERENCE_DE_CELLULE = /^[A-Z][1-9]\d{0,2}$/;

export interface EcranDeProduction {
  readonly ecran: Extract<
    Ecran,
    { readonly brique: 'fp-sheet' | 'fp-table-build' | 'fp-cardsort' }
  >;
  readonly question: QuestionProduction;
  readonly rang: number;
}

export interface VerdictDeProduction {
  readonly correcte: boolean;
  readonly score: number;
  readonly details: readonly DetailProduction[];
}

export function ecranDeProduction(
  cours: Cours,
  questionId: string,
): EcranDeProduction | null {
  for (const [rang, ecran] of cours.ecrans.entries()) {
    if (
      (ecran.brique === 'fp-sheet' ||
        ecran.brique === 'fp-table-build' ||
        ecran.brique === 'fp-cardsort') &&
      ecran.production.id === questionId
    ) {
      return { ecran, question: ecran.production, rang };
    }
  }
  return null;
}

function refuser(questionId: string, raison: string): never {
  throw new ProductionInvalideError(questionId, raison);
}

function feuilleNettoyee(
  cible: EcranDeProduction,
  cellules: Readonly<Record<string, string>>,
): Readonly<Record<string, string>> {
  if (cible.ecran.brique !== 'fp-sheet') {
    refuser(cible.question.id, 'cette question n’attend pas une feuille');
  }
  const plan = cible.ecran.proprietes.plan;
  const verrouillees = new Set(plan.verrouillees);
  const retenues: Record<string, string> = {};
  for (const [reference, saisie] of Object.entries(cellules)) {
    const nom = reference.toUpperCase();
    if (!REFERENCE_DE_CELLULE.test(nom) || !estDansLaGrille(plan, nom)) {
      refuser(cible.question.id, `cellule hors de la grille : ${reference}`);
    }
    if (!verrouillees.has(nom) && saisie.trim().length > 0) {
      retenues[nom] = saisie;
    }
  }
  return retenues;
}

function saisiesNettoyees(
  cible: EcranDeProduction,
  saisies: readonly { rang: number; cle: string; valeur: number }[],
): SaisiesDeTableau {
  if (cible.ecran.brique !== 'fp-table-build') {
    refuser(cible.question.id, 'cette question n’attend pas un tableau');
  }
  const plan = cible.ecran.proprietes.plan;
  const colonnes = new Set(
    plan.colonnes
      .filter((colonne) => colonne.role === 'saisie')
      .map((colonne) => colonne.cle),
  );
  const lignes: Record<string, number | undefined>[] = Array.from(
    { length: plan.echeances },
    () => ({}),
  );
  for (const saisie of saisies) {
    if (saisie.rang >= plan.echeances || !colonnes.has(saisie.cle)) {
      refuser(
        cible.question.id,
        `saisie hors du plan : ${saisie.rang}:${saisie.cle}`,
      );
    }
    if (lignes[saisie.rang][saisie.cle] !== undefined) {
      refuser(
        cible.question.id,
        `saisie en double : ${saisie.rang}:${saisie.cle}`,
      );
    }
    lignes[saisie.rang][saisie.cle] = saisie.valeur;
  }
  return lignes;
}

function classementNettoye(
  cible: EcranDeProduction,
  classement: Readonly<Record<string, string>>,
): Readonly<Record<string, string>> {
  if (cible.ecran.brique !== 'fp-cardsort') {
    refuser(cible.question.id, 'cette question n’attend pas un classement');
  }
  const plan = cible.ecran.proprietes.plan;
  const cartes = new Set(plan.cartes.map((carte) => carte.id));
  const categories = new Set(plan.categories.map((categorie) => categorie.id));
  for (const [carteId, categorieId] of Object.entries(classement)) {
    if (!cartes.has(carteId)) {
      refuser(cible.question.id, `carte absente du plan : ${carteId}`);
    }
    if (!categories.has(categorieId)) {
      refuser(cible.question.id, `catégorie absente du plan : ${categorieId}`);
    }
  }
  return classement;
}

function compterSaisies(valeur: ValeurProduction): number {
  if ('neSaitPas' in valeur) {
    return 1;
  }
  if (valeur.type === 'feuille') {
    return Object.keys(valeur.cellules).length;
  }
  if (valeur.type === 'tableau') {
    return valeur.saisies.length;
  }
  return Object.keys(valeur.classement).length;
}

function produireNormalisee(
  cible: EcranDeProduction,
  valeur: Exclude<ValeurProduction, { readonly neSaitPas: true }>,
): ValeurProduction {
  if (valeur.type === 'feuille') {
    return {
      type: 'feuille',
      cellules: feuilleNettoyee(cible, valeur.cellules),
    };
  }
  if (valeur.type === 'tableau') {
    saisiesNettoyees(cible, valeur.saisies);
    return { type: 'tableau', saisies: valeur.saisies };
  }
  return {
    type: 'classement',
    classement: classementNettoye(cible, valeur.classement),
  };
}

export function normaliserProduction(
  cible: EcranDeProduction,
  valeur: ValeurProduction,
): ValeurProduction {
  if (valeur.type !== cible.question.type) {
    refuser(
      cible.question.id,
      `production de type ${valeur.type} pour une question ${cible.question.type}`,
    );
  }
  if ('neSaitPas' in valeur) {
    return valeur;
  }
  const normalisee = produireNormalisee(cible, valeur);
  if (compterSaisies(normalisee) === 0) {
    throw new ProductionVideError(cible.question.id);
  }
  return normalisee;
}

export function corrigerProduction(
  corrige: CorrigeProduction,
  valeur: ValeurProduction,
  cible: EcranDeProduction,
): VerdictDeProduction {
  if ('neSaitPas' in valeur) {
    return { correcte: false, score: 0, details: [] };
  }
  if (valeur.type === 'feuille' && corrige.type === 'feuille') {
    const correction = corrigerFeuille(corrige, valeur.cellules);
    return {
      correcte: correction.correcte,
      score: correction.score,
      details: correction.verdicts.map((cellule) => ({
        cle: cellule.reference,
        juste: cellule.juste,
        confusion: cellule.confusion,
      })),
    };
  }
  if (valeur.type === 'tableau' && corrige.type === 'tableau') {
    const correction = corrigerTableau(
      corrige,
      saisiesNettoyees(cible, valeur.saisies),
    );
    return {
      correcte: correction.correcte,
      score: correction.score,
      details: correction.verdicts.map((ligne) => ({
        cle: `${ligne.rang}:${ligne.cle}`,
        juste: ligne.juste,
        confusion: ligne.confusion,
      })),
    };
  }
  if (valeur.type === 'classement' && corrige.type === 'classement') {
    const correction = corrigerClassement(corrige, valeur.classement);
    return {
      correcte: correction.correcte,
      score: correction.score,
      details: correction.verdicts.map((carte) => ({
        cle: carte.carteId,
        juste: carte.juste,
        confusion: carte.confusion,
      })),
    };
  }
  return refuser(cible.question.id, 'corrigé absent pour cette production');
}

export function confusionDominante(
  details: readonly DetailProduction[],
): ConfusionId | null {
  const comptes = new Map<ConfusionId, number>();
  for (const detail of details) {
    if (detail.confusion !== null) {
      comptes.set(detail.confusion, (comptes.get(detail.confusion) ?? 0) + 1);
    }
  }
  let dominante: ConfusionId | null = null;
  let meilleur = 0;
  for (const [confusion, compte] of comptes) {
    if (compte > meilleur) {
      dominante = confusion;
      meilleur = compte;
    }
  }
  return dominante;
}
