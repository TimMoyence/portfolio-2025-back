import type { Cours, Ecran, Question } from '../contrats/cours';
import type { EcranPublic, TirageDuCours } from '../contrats/tirage';
import { cueillirDansArbre, estObjet } from './ArbreDeValeurs';
import type { CorrigeProduction } from './Corrige';
import { questionsDe } from './Cours';
import { projeterCatalogue } from './Diffusion';

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
const TAILLE_D_UN_GROUPE = 3;
const LONGUEUR_D_EXTRAIT = 80;
const ESPACE_INSECABLE = String.fromCodePoint(0x00a0);
const ESPACE_FINE_INSECABLE = String.fromCodePoint(0x202f);
const SIGNE_MOINS = String.fromCodePoint(0x2212);
const CHIFFRE = /\d/;
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

function normaliser(texte: string): string {
  return texte
    .replaceAll(ESPACE_INSECABLE, ' ')
    .replaceAll(ESPACE_FINE_INSECABLE, ' ')
    .replaceAll(SIGNE_MOINS, '-');
}

function estChiffre(caractere: string): boolean {
  return caractere >= '0' && caractere <= '9';
}

function contientLaForme(texte: string, forme: string): boolean {
  const source = normaliser(texte);
  const cible = normaliser(forme);
  let depart = source.indexOf(cible);
  while (depart !== -1) {
    const avant = source.charAt(depart - 1);
    const apres = source.charAt(depart + cible.length);
    if (!estChiffre(avant) && avant !== ',' && !estChiffre(apres)) {
      return true;
    }
    depart = source.indexOf(cible, depart + 1);
  }
  return false;
}

function contientSansCasse(texte: string, segment: string): boolean {
  return normaliser(texte)
    .toLowerCase()
    .includes(normaliser(segment).toLowerCase());
}

function enFrancais(valeur: number, decimales: number): string {
  const [entier, fraction = ''] = Math.abs(valeur)
    .toFixed(decimales)
    .split('.');
  const groupes: string[] = [];
  for (let fin = entier.length; fin > 0; fin -= TAILLE_D_UN_GROUPE) {
    groupes.unshift(entier.slice(Math.max(0, fin - TAILLE_D_UN_GROUPE), fin));
  }
  const signe = valeur < 0 ? '-' : '';
  const decimal = fraction === '' ? '' : `,${fraction}`;
  return `${signe}${groupes.join(' ')}${decimal}`;
}

function decimalesDe(forme: string): number {
  const [, fraction = ''] = normaliser(forme).split(',');
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
  if (typeof valeur === 'string') {
    return [valeur];
  }
  if (Array.isArray(valeur)) {
    return valeur.flatMap((element: unknown) => chainesDe(element, exclue));
  }
  if (!estObjet(valeur)) {
    return [];
  }
  const propre = exclue !== null && valeur.id === exclue;
  return Object.entries(valeur)
    .filter(([cle]) => !(propre && CLES_DE_LA_QUESTION.includes(cle)))
    .flatMap(([, element]) => chainesDe(element, exclue));
}

function valeursDesGraphiques(valeur: unknown): number[] {
  return cueillirDansArbre(valeur, (cle, element) =>
    cle === 'values' && Array.isArray(element)
      ? element.filter((nombre): nombre is number => typeof nombre === 'number')
      : null,
  );
}

interface Portee {
  readonly rang: number;
  readonly limite: number;
  readonly exclue: string;
  readonly decimales?: number;
}

function textesDeLEcran(
  ecran: EcranPublic,
  exclue: string | null,
  decimales: number | undefined,
): string[] {
  const titre = ecran.titre === null ? [] : [ecran.titre];
  if (ecran.type === TYPE_D_ECRAN_VERROUILLE) {
    return titre;
  }
  const valeurs =
    decimales === undefined
      ? []
      : valeursDesGraphiques(ecran.donnees).map((valeur) =>
          enFrancais(valeur, decimales),
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
    return textesDeLEcran(ecran, exclue, portee.decimales).map((texte) => ({
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

function extrait(texte: string): string {
  return texte.length <= LONGUEUR_D_EXTRAIT
    ? texte
    : `${texte.slice(0, LONGUEUR_D_EXTRAIT)}…`;
}

function signaler(
  cible: QuestionPlacee,
  volet: string,
  indice: string,
  textes: readonly TextePublic[],
): readonly Manquement[] {
  return unParEcran(textes).map((texte) => ({
    ecran: texte.ecran,
    raison: `volet ${volet} : ${indice}, réponse de la question « ${cible.question.id} » (écran « ${cible.ecran.id} »), paraît dans un texte public de l'écran « ${texte.ecran} » : « ${extrait(texte.texte)} ».`,
  }));
}

function fuitesDeForme(
  contexte: Contexte,
  cible: QuestionPlacee,
  forme: string,
): readonly Manquement[] {
  const textes = textesVisibles(contexte, {
    rang: cible.rang,
    limite: cible.rang,
    exclue: cible.question.id,
    decimales: decimalesDe(forme),
  });
  return signaler(
    cible,
    'exact',
    `« ${forme} »`,
    textes.filter((texte) => contientLaForme(texte.texte, forme)),
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
      (valeur) =>
        chiffresSignificatifs(valeur) >= CHIFFRES_SIGNIFICATIFS_MINIMUM,
    );
  return [
    ...new Set(
      valeurs.flatMap((valeur) =>
        decimales.flatMap((precision) => [
          enFrancais(Math.abs(valeur), precision),
          enFrancais(Math.abs(valeur) * FACTEUR_DE_POURCENTAGE, precision),
        ]),
      ),
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
