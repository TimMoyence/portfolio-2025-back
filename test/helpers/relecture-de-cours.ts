import type {
  Cours,
  Ecran,
} from '../../src/modules/formations/domain/contrats/cours';
import { questionsDe } from '../../src/modules/formations/domain/cours/Cours';
import type { ContenuDeCours } from '../../src/modules/formations/domain/cours/CoursStocke';
import { projeterCatalogue } from '../../src/modules/formations/domain/cours/Diffusion';
import { tirer } from '../../src/modules/formations/domain/cours/Tirage';
import { typographier } from '../../src/modules/formations/domain/cours/Typographie';
import { nombreFrancais } from '../../src/modules/formations/infrastructure/contenus/briques';
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

const SIGNE_EGAL_DE_FORMULE = /(?<=^|[\s«(])=(?=\S)/gu;
const APPEL_DE_FONCTION = /(?<![\p{L}\d_.$])[A-Z][A-Z0-9]*(?:\.[A-Z0-9]+)*\(/gu;
const FORMULE_ALTEREE = /[\u{A0}\u{202F}]|\s[;:!]/u;
const PONCTUATION_FINALE = '.,';
const ESPACES_TYPOGRAPHIQUES = /[\u{A0}\u{202F}]/gu;
const CARACTERES_SPECIAUX = /[.*+?^${}()|[\]\\]/g;

function textesDe(valeur: unknown): string[] {
  if (typeof valeur === 'string') {
    return [valeur];
  }
  if (typeof valeur !== 'object' || valeur === null) {
    return [];
  }
  return Object.values(valeur).flatMap(textesDe);
}

interface Lecture {
  readonly profondeur: number;
  readonly entreGuillemets: boolean;
}

function lireUnCaractere(lecture: Lecture, caractere: string): Lecture | null {
  if (caractere === '"') {
    return { ...lecture, entreGuillemets: !lecture.entreGuillemets };
  }
  if (lecture.entreGuillemets) {
    return lecture;
  }
  if (caractere === '(') {
    return { ...lecture, profondeur: lecture.profondeur + 1 };
  }
  if (caractere === ')') {
    return lecture.profondeur === 0
      ? null
      : { ...lecture, profondeur: lecture.profondeur - 1 };
  }
  return lecture.profondeur === 0 && /\s/u.test(caractere) ? null : lecture;
}

function formuleA(texte: string, debut: number): string {
  let lecture: Lecture | null = { profondeur: 0, entreGuillemets: false };
  let fin = debut;
  while (fin < texte.length) {
    lecture = lireUnCaractere(lecture, texte[fin]);
    if (lecture === null) {
      break;
    }
    fin += 1;
  }
  while (fin > debut && PONCTUATION_FINALE.includes(texte[fin - 1])) {
    fin -= 1;
  }
  return texte.slice(debut, fin);
}

function debutsDeFormule(texte: string): number[] {
  return [
    ...texte.matchAll(SIGNE_EGAL_DE_FORMULE),
    ...texte.matchAll(APPEL_DE_FONCTION),
  ]
    .map(({ index }) => index)
    .sort((a, b) => a - b);
}

export function formulesDuTexte(texte: string): string[] {
  const formules: string[] = [];
  let suite = 0;
  for (const index of debutsDeFormule(texte)) {
    if (index >= suite) {
      const formule = formuleA(texte, index);
      formules.push(formule);
      suite = index + formule.length;
    }
  }
  return formules;
}

export function formulesAltereesALaPublication(
  contenu: ContenuDeCours,
): string[] {
  return textesDe(contenu).flatMap((texte) => {
    const publie = typographier(texte);
    return formulesDuTexte(texte).filter(
      (formule) => FORMULE_ALTEREE.test(formule) || !publie.includes(formule),
    );
  });
}

export function formeFrancaise(valeur: number | string): string {
  if (typeof valeur === 'string') {
    return valeur;
  }
  const decimales = String(valeur).split('.').at(1)?.length ?? 0;
  return nombreFrancais(valeur, decimales);
}

function contientLaForme(texte: string, valeur: number | string): boolean {
  const forme = formeFrancaise(valeur).replaceAll(CARACTERES_SPECIAUX, '\\$&');
  return new RegExp(`(?<![\\d,])${forme}(?!\\d|,\\d| \\d{3}(?!\\d))`, 'u').test(
    texte.replaceAll(ESPACES_TYPOGRAPHIQUES, ' '),
  );
}

export function valeursAuCatalogue(
  cours: Cours,
  valeurs: readonly (number | string)[],
): string[] {
  return projeterCatalogue(cours)
    .ecrans.filter((ecran) => ecran.type !== 'ecran-verrouille')
    .flatMap((ecran) => {
      const texte = JSON.stringify(ecran);
      return valeurs
        .filter((valeur) => contientLaForme(texte, valeur))
        .map((valeur) => `${formeFrancaise(valeur)} dans ${ecran.id}`);
    });
}

export function valeursDevoileesParLesExplications(
  cours: Cours,
  valeurs: Readonly<Record<string, number | string>>,
): string[] {
  const ordre = cours.ecrans.flatMap((ecran) =>
    questionsDe(ecran).map((question) => question.id),
  );
  let posees = 0;
  return cours.ecrans.flatMap((ecran) => {
    posees += questionsDe(ecran).length;
    return (ecran.correctionSurPlace?.explications ?? []).flatMap(
      ({ reference, texte }) => {
        const rang = ordre.indexOf(reference);
        const ouvertes = ordre.slice(rang === -1 ? posees : rang + 1);
        return ouvertes
          .filter(
            (id) =>
              valeurs[id] !== undefined && contientLaForme(texte, valeurs[id]),
          )
          .map(
            (id) =>
              `${formeFrancaise(valeurs[id])} de ${id} dans ${ecran.id} (${reference})`,
          );
      },
    );
  });
}
