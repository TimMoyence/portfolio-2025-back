import type {
  Cours,
  Ecran,
} from '../../src/modules/formations/domain/contrats/cours';
import { questionsDe } from '../../src/modules/formations/domain/cours/Cours';
import type { ContenuDeCours } from '../../src/modules/formations/domain/cours/CoursStocke';
import { tirer } from '../../src/modules/formations/domain/cours/Tirage';
import { enFrancais } from './feuille-de-cours';
import { corrigeDeFeuille, ecranDuContenu } from './fiche-de-cours';
import { arrondi } from './lecture-de-cours';

const sansEspaces = (texte: string): string => texte.replaceAll(/\s/gu, '');

function valeursASaisirDe(
  ecran: Ecran,
  solutions: ReturnType<typeof tirer>['solutions'],
): number[] {
  return questionsDe(ecran)
    .flatMap((question): readonly number[] => {
      if (question.type === 'numeric') {
        return [Number(solutions[question.id].valeur)];
      }
      if (!('corrige' in question)) {
        return [];
      }
      const { corrige } = question;
      if (corrige.type === 'enigme') {
        return corrige.solution.type === 'nombre'
          ? [corrige.solution.valeur]
          : [];
      }
      return corrige.type === 'tableau'
        ? corrige.attendus.map(({ valeur }) => valeur)
        : [];
    })
    .filter((valeur) => !Number.isInteger(arrondi(valeur, 2)));
}

export function valeursDevoileesAvantLeurEcran(
  contenu: ContenuDeCours,
  cours: Cours,
): string[] {
  const { solutions } = tirer(cours, 0);
  const ordre = contenu.ecrans.map(({ screenId }) => screenId);
  const corrections = new Map(
    ordre.map((screenId) => {
      const { proprietes } = ecranDuContenu(contenu, screenId);
      const texte =
        'correctionSurPlace' in proprietes
          ? sansEspaces(JSON.stringify(proprietes.correctionSurPlace))
          : '';
      return [screenId, texte] as const;
    }),
  );

  return cours.ecrans.flatMap((ecran) =>
    valeursASaisirDe(ecran, solutions).flatMap((valeur) => {
      const forme = enFrancais(valeur, 2);
      return ordre
        .slice(0, ordre.indexOf(ecran.id))
        .filter((anterieur) => corrections.get(anterieur)?.includes(forme))
        .map((anterieur) => `${forme} de ${ecran.id} dans ${anterieur}`);
    }),
  );
}

export function colonnesVidesDeLaFeuille(
  contenu: ContenuDeCours,
  cours: Cours,
  screenId: string,
  feuille: string,
): string[] {
  const ecran = ecranDuContenu(contenu, screenId);
  if (ecran.brique !== 'fp-sheet') {
    throw new Error(`${screenId} n’est plus un tableur`);
  }
  const { plan } = ecran.proprietes;
  const references = [
    ...Object.keys(plan.cellules),
    ...corrigeDeFeuille(cours, feuille).attendus.map(
      ({ reference }) => reference,
    ),
  ];
  return Array.from({ length: plan.colonnes }, (_, rang) =>
    String.fromCodePoint(65 + rang),
  ).filter((colonne) => !references.some((nom) => nom.startsWith(colonne)));
}
