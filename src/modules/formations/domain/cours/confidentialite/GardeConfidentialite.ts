import { auMillionieme } from '../../../../../common/domain/nombres/arrondi';
import {
  ecrituresEnPourcentage,
  nombreFrancais,
  nombreSansArrondi,
} from '../../../../../common/domain/nombres/ecriture-francaise';
import { sansEspacesNiMoinsTypographiques } from '../../../../../common/domain/texte/nettoyage/sans-espaces-typographiques';
import { tronquer } from '../../../../../common/domain/texte/formats/tronquer';
import type { Cours, Ecran, Question } from '../../contrats/cours';
import type { EcranPublic, TirageDuCours } from '../../contrats/tirage';
import { estObjet } from '../../../../../common/domain/objets/est-objet';
import { sansLesCles } from '../../../../../common/domain/objets/sans-les-cles';
import { cueillirDansArbre, cueillirSous } from './ArbreDeValeurs';
import type { CorrigeProduction } from '../correction/Corrige';
import { questionsDe } from '../structure/Cours';
import { projeterCatalogue } from '../diffusion/Diffusion';
import { lireNombreSaisi } from '../formule/Formule';

export interface Manquement {
  readonly ecran: string | null;
  readonly raison: string;
}

const CLES_DE_LA_QUESTION: readonly string[] = [
  'enonce',
  'question',
  'options',
];
const DECIMALES_DES_ATTENDUS: readonly number[] = [2, 4, 6];
const DECIMALES_D_UNE_FEUILLE: readonly number[] = [4, 6];
const FACTEUR_DE_POURCENTAGE = 100;
const CHIFFRES_SIGNIFICATIFS_MINIMUM = 3;
const LONGUEUR_D_EXTRAIT = 80;
const CHIFFRE = /\d/;
const SUITE_D_UN_ENTIER = /^(?:\d|,\d| \d{3}(?!\d))/u;
const FIN_DE_GROUPE_DE_MILLIERS = /^\d{3}(?!\d)/u;
const DEBUT_DE_GROUPE_DE_MILLIERS = /(?:^|[^\d,])\d{1,3} $/u;
const LONGUEUR_D_UN_DEBUT_DE_GROUPE = 5;
const NOMBRE_ET_SON_UNITE = /^[+−-]?\s?(\d+(?:\s\d{3})*(?:,\d+)?)[^\d:;,(]*$/u;
const NOMBRE_EN_POURCENTAGE = /\d\s?%/u;
const MARQUES_DE_CONCLUSION = ['soit', '=', '≈', 'environ'] as const;
const PARENTHESE_FINALE = /\s\([^()]*\)$/u;
const POINT_FINAL = /\s?[.!?;:…]$/u;
const DEBUT_D_UNITE = /^\s?[\p{L}€$£%]/u;
const PREMIER_MOT = /^\s(\p{L}+)/u;
const MOTS_DE_LIAISON: ReadonlySet<string> = new Set(
  'de des du et ou à au aux en la le les un une sur par pour soit donc car avec sans environ puis'.split(
    ' ',
  ),
);
const TYPE_D_ECRAN_VERROUILLE = 'ecran-verrouille';

interface Contexte {
  readonly sujet: readonly EcranPublic[];
  readonly catalogue: readonly EcranPublic[];
  readonly tirage: TirageDuCours;
}

interface QuestionPlacee {
  readonly question: Question;
  readonly ecran: Ecran;
  readonly rang: number;
}

interface TextePublic {
  readonly ecran: string;
  readonly texte: string;
}

function estChiffre(caractere: string): boolean {
  return caractere >= '0' && caractere <= '9';
}

function prolongeLeNombre(forme: string, suite: string): boolean {
  if (!estChiffre(forme.slice(-1))) {
    return false;
  }
  return forme.includes(',')
    ? estChiffre(suite.replace(/^0+/u, '').charAt(0))
    : SUITE_D_UN_ENTIER.test(suite.replace(/^,0+(?=\D|$)/u, '.'));
}

function precedeLeNombre(forme: string, avant: string): boolean {
  const dernier = avant.slice(-1);
  return (
    estChiffre(dernier) ||
    dernier === ',' ||
    (DEBUT_DE_GROUPE_DE_MILLIERS.test(avant) &&
      FIN_DE_GROUPE_DE_MILLIERS.test(forme))
  );
}

export function contientLaForme(
  texte: string,
  forme: string,
  suiteAdmise: (suite: string) => boolean = () => true,
): boolean {
  const source = sansEspacesNiMoinsTypographiques(texte);
  const cible = sansEspacesNiMoinsTypographiques(forme);
  let depart = source.indexOf(cible);
  while (depart !== -1) {
    const avant = source.slice(
      Math.max(0, depart - LONGUEUR_D_UN_DEBUT_DE_GROUPE),
      depart,
    );
    const suite = source.slice(depart + cible.length);
    if (
      !precedeLeNombre(cible, avant) &&
      !prolongeLeNombre(cible, suite) &&
      suiteAdmise(suite)
    ) {
      return true;
    }
    depart = source.indexOf(cible, depart + 1);
  }
  return false;
}

function contientSansCasse(texte: string, segment: string): boolean {
  return sansEspacesNiMoinsTypographiques(texte)
    .toLowerCase()
    .includes(sansEspacesNiMoinsTypographiques(segment).toLowerCase());
}

function decimalesDe(forme: string): number {
  const [, fraction = ''] = sansEspacesNiMoinsTypographiques(forme).split(',');
  let longueur = 0;
  while (estChiffre(fraction.charAt(longueur))) {
    longueur += 1;
  }
  return longueur;
}

function chiffresSignificatifs(valeur: number): number {
  const chiffres = String(Math.abs(valeur)).replace('.', '');
  let debut = 0;
  while (chiffres.charAt(debut) === '0') {
    debut += 1;
  }
  let fin = chiffres.length;
  while (fin > debut && chiffres.charAt(fin - 1) === '0') {
    fin -= 1;
  }
  return fin - debut;
}

function chainesDe(valeur: unknown, exclue: string | null): string[] {
  const retenir = (
    _cle: string,
    element: unknown,
  ): readonly string[] | null => {
    if (typeof element === 'string') {
      return [element];
    }
    if (exclue !== null && estObjet(element) && element.id === exclue) {
      return cueillirDansArbre(
        sansLesCles(element, CLES_DE_LA_QUESTION),
        retenir,
      );
    }
    return null;
  };
  return cueillirSous('donnees', valeur, retenir);
}

const CLES_DES_NOMBRES_DES_GRAPHIQUES: readonly string[] = [
  'x',
  'y',
  'slope',
  'intercept',
  'probabilite',
  'produit',
];

function nombresDe(elements: readonly unknown[]): number[] {
  return elements.filter(
    (nombre): nombre is number => typeof nombre === 'number',
  );
}

function valeursDesGraphiques(valeur: unknown): number[] {
  return cueillirDansArbre(valeur, (cle, element) => {
    if (cle === 'values' && Array.isArray(element)) {
      return nombresDe(element);
    }
    return CLES_DES_NOMBRES_DES_GRAPHIQUES.includes(cle)
      ? nombresDe([element])
      : null;
  });
}

interface Portee {
  readonly rang: number;
  readonly limite: number;
  readonly exclue: string;
  readonly decimales?: number;
  readonly enPourcentage?: boolean;
}

function textesDeLEcran(
  ecran: EcranPublic,
  exclue: string | null,
  portee: Portee,
): string[] {
  const titre = ecran.titre === null ? [] : [ecran.titre];
  if (ecran.type === TYPE_D_ECRAN_VERROUILLE) {
    return titre;
  }
  const { decimales } = portee;
  const facteurs = portee.enPourcentage ? [1, FACTEUR_DE_POURCENTAGE] : [1];
  const valeurs =
    decimales === undefined
      ? []
      : valeursDesGraphiques(ecran.donnees).flatMap((valeur) =>
          facteurs.map((facteur) =>
            nombreFrancais(valeur * facteur, decimales),
          ),
        );
  return [...titre, ...chainesDe(ecran.donnees, exclue), ...valeurs];
}

function textesVisibles(
  contexte: Contexte,
  portee: Portee,
): readonly TextePublic[] {
  return contexte.sujet.flatMap((servi, position) => {
    const ecran =
      position <= portee.limite ? servi : contexte.catalogue[position];
    const exclue = position === portee.rang ? portee.exclue : null;
    return textesDeLEcran(ecran, exclue, portee).map((texte) => ({
      ecran: ecran.id,
      texte,
    }));
  });
}

function unParEcran(textes: readonly TextePublic[]): readonly TextePublic[] {
  const premiers = new Map<string, TextePublic>();
  for (const texte of textes) {
    if (!premiers.has(texte.ecran)) {
      premiers.set(texte.ecran, texte);
    }
  }
  return [...premiers.values()];
}

function signaler(
  cible: QuestionPlacee,
  volet: string,
  indice: string,
  textes: readonly TextePublic[],
): readonly Manquement[] {
  return unParEcran(textes).map((texte) => ({
    ecran: texte.ecran,
    raison: `volet ${volet} : ${indice}, réponse de la question « ${cible.question.id} » (écran « ${cible.ecran.id} »), paraît dans un texte public de l'écran « ${texte.ecran} » : « ${tronquer(texte.texte, LONGUEUR_D_EXTRAIT)} ».`,
  }));
}

const formeLue = (forme: string): string =>
  sansEspacesNiMoinsTypographiques(forme).trimEnd().replace(POINT_FINAL, '');

function conclusionDe(ecrite: string): string {
  const sansParenthese = ecrite.replace(PARENTHESE_FINALE, '');
  const enMinuscules = sansParenthese.toLowerCase();
  const fin = Math.max(
    ...MARQUES_DE_CONCLUSION.map((marque) => {
      const debut = enMinuscules.lastIndexOf(marque);
      return debut === -1 ? -1 : debut + marque.length;
    }),
  );
  return sansParenthese.slice(Math.max(fin, 0)).trim();
}

function nombreLu(forme: string): string | undefined {
  const ecrite = formeLue(forme);
  return [ecrite, conclusionDe(ecrite)].find((texte) =>
    NOMBRE_ET_SON_UNITE.test(texte),
  );
}

const nombreDeLaReponse = (forme: string): string | undefined =>
  NOMBRE_ET_SON_UNITE.exec(nombreLu(forme) ?? '')?.[1];

function estEnPourcentage(forme: string): boolean {
  const lu = nombreLu(forme);
  return lu === undefined
    ? formeLue(forme).endsWith('%')
    : NOMBRE_EN_POURCENTAGE.test(lu);
}

interface FormeCherchee {
  readonly ecrite: string;
  readonly suiteAdmise?: (suite: string) => boolean;
}

const sansUniteQuiSuit = (suite: string): boolean =>
  !DEBUT_D_UNITE.test(suite) ||
  MOTS_DE_LIAISON.has(PREMIER_MOT.exec(suite)?.[1] ?? '');

const uniteDeLaQuestion = (contexte: Contexte, questionId: string): unknown =>
  cueillirDansArbre(contexte.sujet, (_, noeud) =>
    estObjet(noeud) && noeud.id === questionId && 'unite' in noeud
      ? [noeud.unite]
      : null,
  )[0];

function autreEcriture(
  valeur: number,
  enPourcentage: boolean,
): readonly FormeCherchee[] {
  if (enPourcentage) {
    return [
      {
        ecrite: nombreSansArrondi(
          auMillionieme(valeur / FACTEUR_DE_POURCENTAGE),
        ),
        suiteAdmise: sansUniteQuiSuit,
      },
    ];
  }
  return Math.abs(valeur) < 1
    ? ecrituresEnPourcentage(valeur).map((ecrite) => ({ ecrite }))
    : [];
}

function formesDeLaReponse(
  forme: string,
  enPourcentage: boolean,
): readonly FormeCherchee[] {
  const nombre = nombreDeLaReponse(forme);
  const valeur = nombre === undefined ? null : lireNombreSaisi(nombre);
  return nombre !== undefined &&
    valeur !== null &&
    chiffresSignificatifs(valeur) >= CHIFFRES_SIGNIFICATIFS_MINIMUM
    ? [
        ...[forme, nombre, nombreSansArrondi(valeur)].map((ecrite) => ({
          ecrite,
        })),
        ...autreEcriture(valeur, enPourcentage),
      ]
    : [{ ecrite: forme }];
}

function fuitesDeForme(
  contexte: Contexte,
  cible: QuestionPlacee,
  forme: string,
): readonly Manquement[] {
  const enPourcentage =
    estEnPourcentage(forme) ||
    uniteDeLaQuestion(contexte, cible.question.id) === '%';
  const textes = textesVisibles(contexte, {
    rang: cible.rang,
    limite: cible.rang,
    exclue: cible.question.id,
    decimales: decimalesDe(nombreDeLaReponse(forme) ?? forme),
    enPourcentage,
  });
  const formes =
    cible.ecran.brique === 'fp-spaced'
      ? [{ ecrite: forme }]
      : formesDeLaReponse(forme, enPourcentage);
  return signaler(
    cible,
    'exact',
    `« ${forme} »`,
    textes.filter((texte) =>
      formes.some(({ ecrite, suiteAdmise }) =>
        contientLaForme(texte.texte, ecrite, suiteAdmise),
      ),
    ),
  );
}

function libelleDeLaBonne(contexte: Contexte, questionId: string): string {
  const bonne = String(contexte.tirage.solutions[questionId].valeur);
  return contexte.tirage.libellesOptions[questionId][bonne];
}

function fuitesDeSegments(
  contexte: Contexte,
  cible: QuestionPlacee,
  segments: readonly string[],
): readonly Manquement[] {
  const textes = textesVisibles(contexte, {
    rang: cible.rang,
    limite: cible.rang - 1,
    exclue: cible.question.id,
  });
  return signaler(
    cible,
    'segments',
    `les segments « ${segments.join(' », « ')} »`,
    textes.filter((texte) =>
      segments.every((segment) => contientSansCasse(texte.texte, segment)),
    ),
  );
}

function fuitesDuVote(
  contexte: Contexte,
  cible: QuestionPlacee,
  segments: readonly string[],
): readonly Manquement[] {
  const avecSegments =
    cible.question.noteCompte &&
    cible.ecran.brique !== 'fp-spaced' &&
    segments.length > 0;
  return [
    ...fuitesDeForme(
      contexte,
      cible,
      libelleDeLaBonne(contexte, cible.question.id),
    ),
    ...(avecSegments ? fuitesDeSegments(contexte, cible, segments) : []),
  ];
}

function formesDesAttendus(corrige: CorrigeProduction): readonly string[] {
  if (corrige.type === 'classement') {
    return corrige.attendus.map((attendu) => attendu.justification);
  }
  if (corrige.type !== 'tableau' && corrige.type !== 'feuille') {
    return [];
  }
  const decimales =
    corrige.type === 'feuille'
      ? DECIMALES_D_UNE_FEUILLE
      : DECIMALES_DES_ATTENDUS;
  const valeurs = corrige.attendus
    .map((attendu) => attendu.valeur)
    .filter(
      (valeur): valeur is number =>
        typeof valeur === 'number' &&
        chiffresSignificatifs(valeur) >= CHIFFRES_SIGNIFICATIFS_MINIMUM,
    );
  return [
    ...new Set(
      valeurs.flatMap((valeur) => {
        const part = Math.abs(valeur);
        const pourcentage = part * FACTEUR_DE_POURCENTAGE;
        return [
          ...decimales.flatMap((precision) => [
            nombreFrancais(part, precision),
            nombreFrancais(pourcentage, precision),
          ]),
          ...(corrige.type === 'feuille'
            ? [part, pourcentage]
                .map(auMillionieme)
                .filter((nombre) => !Number.isInteger(nombre))
                .map(nombreSansArrondi)
            : []),
        ];
      }),
    ),
  ];
}

function fuitesDesAttendus(
  contexte: Contexte,
  cible: QuestionPlacee,
  corrige: CorrigeProduction,
): readonly Manquement[] {
  const formes = formesDesAttendus(corrige);
  if (formes.length === 0) {
    return [];
  }
  const textes = textesVisibles(contexte, {
    rang: cible.rang,
    limite: cible.rang,
    exclue: cible.question.id,
  });
  return signaler(
    cible,
    'exact',
    'un attendu de la production',
    textes.filter((texte) =>
      formes.some((forme) => contientLaForme(texte.texte, forme)),
    ),
  );
}

function fuitesDeLaQuestion(
  contexte: Contexte,
  cible: QuestionPlacee,
): readonly Manquement[] {
  const question = cible.question;
  switch (question.type) {
    case 'numeric':
      return question.formePubliee === undefined
        ? []
        : fuitesDeForme(contexte, cible, question.formePubliee);
    case 'vote':
      return fuitesDuVote(contexte, cible, question.segments ?? []);
    case 'enigme':
      return question.corrige.type === 'enigme' &&
        question.corrige.solution.type === 'nombre'
        ? fuitesDeForme(contexte, cible, question.corrige.solution.formePubliee)
        : [];
    case 'feuille':
    case 'tableau':
    case 'classement':
      return fuitesDesAttendus(contexte, cible, question.corrige);
    default:
      return question satisfies never;
  }
}

function indicesChiffres(cours: Cours): readonly Manquement[] {
  return cours.ecrans.flatMap((ecran) =>
    ecran.brique === 'fp-escape'
      ? ecran.proprietes.parcours.enigmes
          .filter((enigme) => CHIFFRE.test(enigme.indice))
          .map((enigme) => ({
            ecran: ecran.id,
            raison: `l'indice de l'énigme « ${enigme.id} » contient un chiffre : « ${enigme.indice} ». Un indice décrit une démarche, jamais une valeur.`,
          }))
      : [],
  );
}

export function controlerConfidentialite(
  cours: Cours,
  tirage: TirageDuCours,
): readonly Manquement[] {
  const contexte: Contexte = {
    sujet: tirage.sujet.ecrans,
    catalogue: projeterCatalogue(cours).ecrans,
    tirage,
  };
  const placees = cours.ecrans.flatMap((ecran, rang) =>
    questionsDe(ecran).map((question) => ({ question, ecran, rang })),
  );
  return [
    ...placees.flatMap((cible) => fuitesDeLaQuestion(contexte, cible)),
    ...indicesChiffres(cours),
  ];
}
