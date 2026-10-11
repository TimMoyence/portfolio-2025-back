import type {
  Cours,
  Ecran,
} from '../../src/modules/formations/domain/contrats/cours';
import { cueillirSous } from '../../src/modules/formations/domain/cours/ArbreDeValeurs';
import { questionsDe } from '../../src/modules/formations/domain/cours/Cours';
import type { ContenuDeCours } from '../../src/modules/formations/domain/cours/CoursStocke';
import { projeterCatalogue } from '../../src/modules/formations/domain/cours/Diffusion';
import { tirer } from '../../src/modules/formations/domain/cours/Tirage';
import { typographier } from '../../src/modules/formations/domain/cours/Typographie';
import { nombreFrancais } from '../../src/common/domain/nombres/ecriture-francaise';
import { corrigeDeFeuille, ecranDuContenu } from './fiche-de-cours';
import { arrondi } from '../../src/common/domain/nombres/arrondi';

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

export function valeursDevoileesAvantLeurEcran(cours: Cours): string[] {
  const { solutions } = tirer(cours, 0);
  const ordre = cours.ecrans.map(({ id }) => id);
  const corrections = new Map(
    cours.ecrans.map(
      (ecran) =>
        [ecran.id, JSON.stringify(ecran.correctionSurPlace ?? {})] as const,
    ),
  );

  return cours.ecrans.flatMap((ecran) =>
    valeursASaisirDe(ecran, solutions).flatMap((valeur) => {
      const arrondie = arrondi(valeur, 2);
      return ordre
        .slice(0, ordre.indexOf(ecran.id))
        .filter((anterieur) =>
          contientLaForme(corrections.get(anterieur) ?? '', arrondie),
        )
        .map(
          (anterieur) =>
            `${formeFrancaise(arrondie)} de ${ecran.id} dans ${anterieur}`,
        );
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
const SIGNE_MOINS_TYPOGRAPHIQUE = /\u{2212}/gu;
const CARACTERES_SPECIAUX = /[.*+?^${}()|[\]\\]/g;

function textesDe(valeur: unknown): string[] {
  return cueillirSous('', valeur, (_cle, element) =>
    typeof element === 'string' ? [element] : null,
  );
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

function normaliser(texte: string): string {
  return texte
    .replaceAll(ESPACES_TYPOGRAPHIQUES, ' ')
    .replaceAll(SIGNE_MOINS_TYPOGRAPHIQUE, '-');
}

function zerosDeFinPermis(valeur: number | string): string {
  if (typeof valeur === 'string') {
    return '';
  }
  return Number.isInteger(valeur) ? '(?:,0+)?' : '0*';
}

const SEUIL_DES_MILLIERS = 1000;

function formesEcrites(valeur: number | string): string[] {
  const forme = normaliser(formeFrancaise(valeur));
  if (typeof valeur === 'string') {
    return [forme];
  }
  const sansEspaceDesMilliers =
    Math.abs(valeur) >= SEUIL_DES_MILLIERS ? [forme.replaceAll(' ', '')] : [];
  const sansSigne = valeur < 0 ? formesEcrites(-valeur) : [];
  return [forme, ...sansEspaceDesMilliers, ...sansSigne];
}

function contientLaForme(texte: string, valeur: number | string): boolean {
  const normalise = normaliser(texte);
  return formesEcrites(valeur).some((forme) =>
    new RegExp(
      `(?<![\\d,])${forme.replaceAll(CARACTERES_SPECIAUX, '\\$&')}${zerosDeFinPermis(valeur)}(?!\\d|,\\d| \\d{3}(?!\\d))`,
      'u',
    ).test(normalise),
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

interface ExplicationSituee {
  readonly ecran: string;
  readonly reference: string;
  readonly texte: string;
  readonly ouvertes: readonly string[];
  readonly suivantesDeLEcran: readonly string[];
}

function explicationsSituees(cours: Cours): ExplicationSituee[] {
  const ordre = cours.ecrans.flatMap((ecran) =>
    questionsDe(ecran).map((question) => question.id),
  );
  let posees = 0;
  return cours.ecrans.flatMap((ecran) => {
    const deLEcran = questionsDe(ecran).map((question) => question.id);
    posees += deLEcran.length;
    return (ecran.correctionSurPlace?.explications ?? []).map(
      ({ reference, texte }) => {
        const rang = ordre.indexOf(reference);
        const rangDansLEcran = deLEcran.indexOf(reference);
        return {
          ecran: ecran.id,
          reference,
          texte,
          ouvertes: ordre.slice(rang === -1 ? posees : rang + 1),
          suivantesDeLEcran:
            rangDansLEcran === -1 ? [] : deLEcran.slice(rangDansLEcran + 1),
        };
      },
    );
  });
}

function alertesParExplication(
  cours: Cours,
  alertesDe: (explication: ExplicationSituee) => string[],
): string[] {
  return explicationsSituees(cours).flatMap((explication) =>
    alertesDe(explication).map(
      (alerte) =>
        `${alerte} dans ${explication.ecran} (${explication.reference})`,
    ),
  );
}

export function valeursDevoileesParLesExplications(
  cours: Cours,
  valeurs: Readonly<Record<string, number | string>>,
): string[] {
  return alertesParExplication(cours, ({ texte, ouvertes }) =>
    ouvertes
      .filter(
        (id) =>
          valeurs[id] !== undefined && contientLaForme(texte, valeurs[id]),
      )
      .map((id) => `${formeFrancaise(valeurs[id])} de ${id}`),
  );
}

const SEUIL_D_UN_PIEGE_RECONNAISSABLE_DANS_L_ECRAN = 10;
const SEUIL_D_UN_PIEGE_RECONNAISSABLE_HORS_DE_L_ECRAN = 100;

type PiegesParQuestion = Readonly<
  Record<string, Readonly<Partial<Record<string, number>>>>
>;

function piegesReconnaissablesDe(
  pieges: PiegesParQuestion,
  question: string,
  seuil: number,
): [string, number][] {
  return Object.entries(pieges[question] ?? {}).flatMap(
    ([confusion, valeur]): [string, number][] =>
      valeur !== undefined &&
      (!Number.isInteger(valeur) || Math.abs(valeur) >= seuil)
        ? [[confusion, valeur]]
        : [],
  );
}

function confusionPartageeParUneSuivante(
  pieges: PiegesParQuestion,
  suivantes: readonly string[],
  confusion: string,
): boolean {
  return suivantes.some((id) => pieges[id]?.[confusion] !== undefined);
}

export function piegesPartagesDevoilesParLesExplications(
  cours: Cours,
  pieges: PiegesParQuestion,
): string[] {
  return alertesParExplication(
    cours,
    ({ reference, texte, suivantesDeLEcran }) =>
      piegesReconnaissablesDe(
        pieges,
        reference,
        SEUIL_D_UN_PIEGE_RECONNAISSABLE_DANS_L_ECRAN,
      )
        .filter(
          ([confusion, valeur]) =>
            confusionPartageeParUneSuivante(
              pieges,
              suivantesDeLEcran,
              confusion,
            ) && contientLaForme(texte, valeur),
        )
        .map(
          ([confusion, valeur]) => `${formeFrancaise(valeur)} (${confusion})`,
        ),
  );
}

function piegesDevoilesDansLeTexte(
  pieges: PiegesParQuestion,
  question: string,
  texte: string,
  seuil: number,
): string[] {
  return piegesReconnaissablesDe(pieges, question, seuil)
    .filter(([, valeur]) => contientLaForme(texte, valeur))
    .map(
      ([confusion, valeur]) =>
        `${formeFrancaise(valeur)} (${confusion}) de ${question}`,
    );
}

export function piegesDesQuestionsSuivantesDevoilesParLesExplications(
  cours: Cours,
  pieges: PiegesParQuestion,
): string[] {
  return alertesParExplication(
    cours,
    ({ texte, ouvertes, suivantesDeLEcran }) =>
      ouvertes.flatMap((id) =>
        piegesDevoilesDansLeTexte(
          pieges,
          id,
          texte,
          suivantesDeLEcran.includes(id)
            ? SEUIL_D_UN_PIEGE_RECONNAISSABLE_DANS_L_ECRAN
            : SEUIL_D_UN_PIEGE_RECONNAISSABLE_HORS_DE_L_ECRAN,
        ),
      ),
  );
}
