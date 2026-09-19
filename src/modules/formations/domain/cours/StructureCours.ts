import type { Cours, Ecran } from '../contrats/cours';
import type { TirageDuCours } from '../contrats/tirage';
import { estInteractif, questionsDe, questionsDuCours } from './Cours';
import {
  controlerConfidentialite,
  type Manquement,
} from './GardeConfidentialite';
import { slugOption } from './QuestionStockee';
import { tirer } from './Tirage';

export const REGLES_STRUCTURE = [
  'exposition-continue',
  'ratio-interaction',
  'ouverture-cloture',
  'duree-ecran',
  'duree-cours',
  'reference-inconnue',
  'reference-circulaire',
  'notes-formateur',
  'atelier-questions-fermees',
  'confidentialite',
  'catalogue-sans-question',
  'media-sans-licence',
  'options-neutres',
] as const;

type RegleStructure = (typeof REGLES_STRUCTURE)[number];

export interface ViolationStructure {
  readonly regle: RegleStructure | 'derogation-sans-justification';
  readonly ecran: string | null;
  readonly raison: string;
}

export interface Derogation {
  readonly regle: RegleStructure;
  readonly ecran?: string;
  readonly raison: string;
}

interface Analyse {
  readonly cours: Cours;
  readonly tirage: TirageDuCours;
}

const GRAINE_DE_CONTROLE = 0;
const EXPOSITION_MAXIMALE_MINUTES = 6;
const RATIO_INTERACTION_MINIMAL = 0.3;
const BRIQUE_OUVERTURE = 'fp-recall';
const BRIQUE_CLOTURE = 'fp-exit';
const PREFIXE_REFERENCE = 'ref:';
const DIACRITIQUES = /\p{M}/gu;
const RUBRIQUES_DES_NOTES = [
  'Action',
  'Observé',
  'Attendu',
  'Contrôle',
  'Transition',
] as const;
const DUREE_MINIMALE_D_ATELIER = 8;
const DUREE_MAXIMALE_D_ATELIER = 15;
const TYPES_DE_QUESTION_FERMEE: readonly string[] = [
  'vote',
  'numeric',
  'classement',
];
const CLES_DE_MEDIA: readonly string[] = [
  'image',
  'bgImage',
  'src',
  'srcPoste',
  'poster',
];

function nomEcran(ecran: Ecran, rang: number): string {
  return ecran.id !== '' ? ecran.id : `#${rang}`;
}

function estDureeValide(minutes: number): boolean {
  return Number.isInteger(minutes) && minutes > 0;
}

function minutesDe(ecran: Ecran): number {
  return estDureeValide(ecran.dureeMinutes) ? ecran.dureeMinutes : 0;
}

function enFrancais(part: number): string {
  return part.toFixed(2).replace('.', ',');
}

function verdictDuBloc(
  bloc: readonly string[],
  cumul: number,
): readonly Manquement[] {
  if (cumul <= EXPOSITION_MAXIMALE_MINUTES) {
    return [];
  }
  const nommes = bloc.map((nom) => `« ${nom} »`).join(', ');
  return [
    {
      ecran: bloc[0],
      raison: `${cumul} min d'exposition d'affilée sur ${bloc.length} écran(s) (${nommes}) sans une seule interaction : le plafond est de ${EXPOSITION_MAXIMALE_MINUTES} min.`,
    },
  ];
}

interface EtatExposition {
  readonly manquements: readonly Manquement[];
  readonly bloc: readonly string[];
  readonly cumul: number;
}

function etapeExposition(
  etat: EtatExposition,
  ecran: Ecran,
  rang: number,
): EtatExposition {
  if (estInteractif(ecran)) {
    return {
      manquements: [
        ...etat.manquements,
        ...verdictDuBloc(etat.bloc, etat.cumul),
      ],
      bloc: [],
      cumul: 0,
    };
  }
  return {
    manquements: etat.manquements,
    bloc: [...etat.bloc, nomEcran(ecran, rang)],
    cumul: etat.cumul + minutesDe(ecran),
  };
}

function controlerExposition({ cours }: Analyse): readonly Manquement[] {
  if (questionsDuCours(cours).length === 0) {
    return [];
  }
  const etatInitial: EtatExposition = { manquements: [], bloc: [], cumul: 0 };
  const etatFinal = cours.ecrans.reduce(
    (etat, ecran, rang) => etapeExposition(etat, ecran, rang),
    etatInitial,
  );
  return [
    ...etatFinal.manquements,
    ...verdictDuBloc(etatFinal.bloc, etatFinal.cumul),
  ];
}

function controlerRatio({ cours }: Analyse): readonly Manquement[] {
  if (questionsDuCours(cours).length === 0) {
    return [];
  }
  const interaction = cours.ecrans
    .filter((ecran) => estInteractif(ecran))
    .reduce((total, ecran) => total + minutesDe(ecran), 0);
  const exposition = cours.ecrans
    .filter((ecran) => !estInteractif(ecran))
    .reduce((total, ecran) => total + minutesDe(ecran), 0);
  if (interaction + exposition === 0) {
    return [
      {
        ecran: null,
        raison: `le cours totalise 0 minute déclarée sur ${cours.ecrans.length} écran(s) : le ratio d'interaction n'a rien à mesurer.`,
      },
    ];
  }
  if (
    exposition === 0 ||
    interaction / exposition >= RATIO_INTERACTION_MINIMAL
  ) {
    return [];
  }
  return [
    {
      ecran: null,
      raison: `${interaction} min d'écrans interactifs pour ${exposition} min d'exposition, soit un ratio de ${enFrancais(interaction / exposition)} : le plancher est de ${enFrancais(RATIO_INTERACTION_MINIMAL)}.`,
    },
  ];
}

function controlerOuverture(premier: Ecran): readonly Manquement[] {
  if (premier.brique === BRIQUE_OUVERTURE) {
    return [];
  }
  const identifiant = nomEcran(premier, 0);
  return [
    {
      ecran: identifiant,
      raison: `le cours ouvre sur « ${identifiant} » de type « ${premier.brique} » : un cours ouvre par un rappel espacé (« ${BRIQUE_OUVERTURE} »), qui rouvre la mémoire avant d'y ajouter.`,
    },
  ];
}

function controlerCloture(dernier: Ecran, rang: number): readonly Manquement[] {
  if (dernier.brique === BRIQUE_CLOTURE) {
    return [];
  }
  const identifiant = nomEcran(dernier, rang);
  return [
    {
      ecran: identifiant,
      raison: `le cours se clôt sur « ${identifiant} » de type « ${dernier.brique} » : un cours clôt par un exit ticket (« ${BRIQUE_CLOTURE} »), sans quoi la séance finit sans rien mesurer.`,
    },
  ];
}

function controlerOuvertureCloture({ cours }: Analyse): readonly Manquement[] {
  if (questionsDuCours(cours).length === 0) {
    return [];
  }
  const [premier] = cours.ecrans;
  const rangDernier = cours.ecrans.length - 1;
  const dernier = cours.ecrans[rangDernier];
  return [
    ...controlerOuverture(premier),
    ...controlerCloture(dernier, rangDernier),
  ];
}

function controlerDureeEcran({ cours }: Analyse): readonly Manquement[] {
  return cours.ecrans.flatMap((ecran, rang) => {
    if (estDureeValide(ecran.dureeMinutes)) {
      return [];
    }
    const identifiant = nomEcran(ecran, rang);
    return [
      {
        ecran: identifiant,
        raison: `l'écran « ${identifiant} » annonce une durée de « ${ecran.dureeMinutes} » : une durée doit être un nombre entier de minutes strictement positif.`,
      },
    ];
  });
}

function controlerDureeCours({ cours }: Analyse): readonly Manquement[] {
  const annoncee = cours.dureeMinutes;
  if (!estDureeValide(annoncee)) {
    return [
      {
        ecran: null,
        raison: `le cours annonce une durée de « ${annoncee} » : une durée annoncée doit être un nombre entier de minutes strictement positif.`,
      },
    ];
  }
  const declarees = cours.ecrans.reduce(
    (total, ecran) => total + minutesDe(ecran),
    0,
  );
  if (declarees === annoncee) {
    return [];
  }
  return [
    {
      ecran: null,
      raison: `${declarees} min déclarées par les écrans pour ${annoncee} min annoncées : la somme des écrans doit égaler la durée annoncée.`,
    },
  ];
}

function normaliser(identifiant: string): string {
  return identifiant.normalize('NFD').replace(DIACRITIQUES, '').toLowerCase();
}

function voisinIndistinct(
  identifiant: string,
  connus: ReadonlySet<string>,
): string | null {
  const cible = normaliser(identifiant);
  for (const connu of connus) {
    if (connu !== identifiant && normaliser(connu) === cible) {
      return connu;
    }
  }
  return null;
}

function raisonIntrouvable(
  sujet: string,
  identifiant: string,
  connus: ReadonlySet<string>,
): string {
  const voisin = voisinIndistinct(identifiant, connus);
  if (voisin === null) {
    return `${sujet} « ${identifiant} » qui n'est déclaré par aucun écran ni aucune question de ce cours.`;
  }
  return `${sujet} « ${identifiant} » est un identifiant distinct de « ${voisin} » : la casse et les accents ne sont jamais rapprochés en silence.`;
}

function estObjet(
  valeur: unknown,
): valeur is Readonly<Record<string, unknown>> {
  return (
    typeof valeur === 'object' && valeur !== null && !Array.isArray(valeur)
  );
}

function referencesDansValeur(valeur: unknown): readonly string[] {
  if (typeof valeur === 'string') {
    return valeur.startsWith(PREFIXE_REFERENCE)
      ? [valeur.slice(PREFIXE_REFERENCE.length)]
      : [];
  }
  if (Array.isArray(valeur)) {
    return valeur.flatMap((element: unknown) => referencesDansValeur(element));
  }
  if (estObjet(valeur)) {
    return Object.values(valeur).flatMap((element) =>
      referencesDansValeur(element),
    );
  }
  return [];
}

function proprietesDe(ecran: Ecran): unknown {
  return 'proprietes' in ecran ? ecran.proprietes : undefined;
}

interface CibleReferencee {
  readonly ecran: string | null;
  readonly cible: string;
}

function referencesEcrans(cours: Cours): readonly CibleReferencee[] {
  return cours.ecrans.flatMap((ecran, rang) => {
    const identifiant = nomEcran(ecran, rang);
    return referencesDansValeur(proprietesDe(ecran)).map((cible) => ({
      ecran: identifiant,
      cible,
    }));
  });
}

function referencesRemediations(cours: Cours): readonly CibleReferencee[] {
  return Object.values(cours.remediations).map((cible) => ({
    ecran: null,
    cible,
  }));
}

function identifiantsConnus(cours: Cours): ReadonlySet<string> {
  const idsEcrans = cours.ecrans.map((ecran, rang) => nomEcran(ecran, rang));
  const idsQuestions = questionsDuCours(cours).map((question) => question.id);
  return new Set([...idsEcrans, ...idsQuestions]);
}

function sujetDe(cible: CibleReferencee): string {
  return cible.ecran === null
    ? 'la remédiation renvoie vers'
    : `l'écran « ${cible.ecran} » renvoie vers`;
}

function controlerReferences({ cours }: Analyse): readonly Manquement[] {
  const connus = identifiantsConnus(cours);
  const references = [
    ...referencesEcrans(cours),
    ...referencesRemediations(cours),
  ];
  return references
    .filter((reference) => !connus.has(reference.cible))
    .map((reference) => ({
      ecran: reference.ecran,
      raison: raisonIntrouvable(sujetDe(reference), reference.cible, connus),
    }));
}

function aretes(
  cours: Cours,
  connus: ReadonlySet<string>,
): ReadonlyMap<string, readonly string[]> {
  const sortantes = new Map<string, string[]>(
    cours.ecrans.map((ecran, rang) => [nomEcran(ecran, rang), []]),
  );
  for (const reference of referencesEcrans(cours)) {
    if (
      reference.ecran !== null &&
      connus.has(reference.cible) &&
      sortantes.has(reference.ecran)
    ) {
      sortantes.get(reference.ecran)?.push(reference.cible);
    }
  }
  return sortantes;
}

type EtatSommet = 'en-cours' | 'clos';

function explorer(
  depart: string,
  sortantes: ReadonlyMap<string, readonly string[]>,
  etats: Map<string, EtatSommet>,
  chemin: string[],
  cycles: Manquement[],
): void {
  etats.set(depart, 'en-cours');
  chemin.push(depart);
  for (const cible of sortantes.get(depart) ?? []) {
    if (etats.get(cible) === 'en-cours') {
      const debut = chemin.indexOf(cible);
      const boucle = [...chemin.slice(debut), cible].join(' → ');
      cycles.push({
        ecran: cible,
        raison: `le cycle de références « ${boucle} » se referme sur lui-même : une référence circulaire ne se résout jamais.`,
      });
    } else if (etats.get(cible) !== 'clos') {
      explorer(cible, sortantes, etats, chemin, cycles);
    }
  }
  chemin.pop();
  etats.set(depart, 'clos');
}

function controlerCycles({ cours }: Analyse): readonly Manquement[] {
  const connus = identifiantsConnus(cours);
  const sortantes = aretes(cours, connus);
  const etats = new Map<string, EtatSommet>();
  const cycles: Manquement[] = [];
  for (const noeud of sortantes.keys()) {
    if (!etats.has(noeud)) {
      explorer(noeud, sortantes, etats, [], cycles);
    }
  }
  return cycles;
}

function rubriquesManquantes(notes: string): readonly string[] {
  const lignes = notes.split('\n').map((ligne) => ligne.trim());
  return RUBRIQUES_DES_NOTES.filter((rubrique) => {
    const entete = `${rubrique} :`;
    return !lignes.some(
      (ligne) =>
        ligne.startsWith(entete) && ligne.slice(entete.length).trim() !== '',
    );
  });
}

function controlerNotes({ cours }: Analyse): readonly Manquement[] {
  return cours.ecrans.flatMap((ecran, rang) => {
    const manquantes = rubriquesManquantes(ecran.notes);
    if (manquantes.length === 0) {
      return [];
    }
    return [
      {
        ecran: nomEcran(ecran, rang),
        raison: `les notes du formateur n'ont pas de rubrique « ${manquantes.join(' », « ')} » renseignée : chaque écran porte les cinq rubriques Action, Observé, Attendu, Contrôle et Transition.`,
      },
    ];
  });
}

function estExempteDAtelier(
  ecran: Ecran,
  rang: number,
  dernier: number,
): boolean {
  return (
    (rang === 0 && ecran.brique === BRIQUE_OUVERTURE) ||
    (rang === dernier && ecran.brique === BRIQUE_CLOTURE)
  );
}

function controlerAteliers({ cours }: Analyse): readonly Manquement[] {
  const dernier = cours.ecrans.length - 1;
  return cours.ecrans.flatMap((ecran, rang) => {
    const fermees = questionsDe(ecran).filter(
      (question) =>
        question.noteCompte && TYPES_DE_QUESTION_FERMEE.includes(question.type),
    );
    const duree = ecran.dureeMinutes;
    if (
      fermees.length === 0 ||
      estExempteDAtelier(ecran, rang, dernier) ||
      (duree >= DUREE_MINIMALE_D_ATELIER && duree <= DUREE_MAXIMALE_D_ATELIER)
    ) {
      return [];
    }
    return [
      {
        ecran: nomEcran(ecran, rang),
        raison: `${fermees.length} question(s) fermée(s) notée(s) sur un écran de ${duree} min : un atelier noté dure de ${DUREE_MINIMALE_D_ATELIER} à ${DUREE_MAXIMALE_D_ATELIER} min, hors rappel d'ouverture et billet de clôture.`,
      },
    ];
  });
}

function controlerCatalogue({ cours }: Analyse): readonly Manquement[] {
  return cours.ecrans.flatMap((ecran, rang) =>
    ecran.diffusion === 'catalogue' && estInteractif(ecran)
      ? [
          {
            ecran: nomEcran(ecran, rang),
            raison: `l'écran interactif « ${nomEcran(ecran, rang)} » est en diffusion catalogue : une activité n'est servie qu'en séance.`,
          },
        ]
      : [],
  );
}

function mediasDe(valeur: unknown): readonly string[] {
  if (Array.isArray(valeur)) {
    return valeur.flatMap((element: unknown) => mediasDe(element));
  }
  if (!estObjet(valeur)) {
    return [];
  }
  return Object.entries(valeur).flatMap(([cle, element]) =>
    CLES_DE_MEDIA.includes(cle) && typeof element === 'string'
      ? [element]
      : mediasDe(element),
  );
}

function controlerMedias({ cours, tirage }: Analyse): readonly Manquement[] {
  const catalogues = new Set(cours.medias.flatMap((media) => media.chemins));
  return tirage.sujet.ecrans.flatMap((ecran) =>
    mediasDe(ecran.donnees)
      .filter((media) => !catalogues.has(media))
      .map((media) => ({
        ecran: ecran.id,
        raison: `le média « ${media} » n'est pas au catalogue des médias du cours : page source, auteur, date et licence y sont obligatoires.`,
      })),
  );
}

function ecranDesQuestions(cours: Cours): ReadonlyMap<string, string> {
  return new Map(
    cours.ecrans.flatMap((ecran, rang) =>
      questionsDe(ecran).map((question) => [
        question.id,
        nomEcran(ecran, rang),
      ]),
    ),
  );
}

function controlerOptions({ cours, tirage }: Analyse): readonly Manquement[] {
  const ecrans = ecranDesQuestions(cours);
  return Object.entries(tirage.libellesOptions).flatMap(
    ([questionId, libelles]) =>
      Object.entries(libelles)
        .filter(([id, libelle]) => id !== slugOption(libelle))
        .map(([id, libelle]) => ({
          ecran: ecrans.get(questionId) ?? null,
          raison: `l'option « ${libelle} » de la question « ${questionId} » porte l'identifiant « ${id} » au lieu de « ${slugOption(libelle)} ».`,
        })),
  );
}

interface Regle {
  readonly id: RegleStructure;
  readonly controler: (analyse: Analyse) => readonly Manquement[];
}

const REGLES: readonly Regle[] = [
  { id: 'exposition-continue', controler: controlerExposition },
  { id: 'ratio-interaction', controler: controlerRatio },
  { id: 'ouverture-cloture', controler: controlerOuvertureCloture },
  { id: 'duree-ecran', controler: controlerDureeEcran },
  { id: 'duree-cours', controler: controlerDureeCours },
  { id: 'reference-inconnue', controler: controlerReferences },
  { id: 'reference-circulaire', controler: controlerCycles },
  { id: 'notes-formateur', controler: controlerNotes },
  { id: 'atelier-questions-fermees', controler: controlerAteliers },
  {
    id: 'confidentialite',
    controler: ({ cours, tirage }) => controlerConfidentialite(cours, tirage),
  },
  { id: 'catalogue-sans-question', controler: controlerCatalogue },
  { id: 'media-sans-licence', controler: controlerMedias },
  { id: 'options-neutres', controler: controlerOptions },
];

function executer(
  regle: Regle,
  analyse: Analyse,
): readonly ViolationStructure[] {
  return regle.controler(analyse).map((manquement) => ({
    regle: regle.id,
    ecran: manquement.ecran,
    raison: manquement.raison,
  }));
}

function estJustifiee(derogation: Derogation): boolean {
  return derogation.raison.trim() !== '';
}

function estVisee(
  violation: ViolationStructure,
  derogation: Derogation,
): boolean {
  if (violation.regle !== derogation.regle) {
    return false;
  }
  return derogation.ecran === undefined || violation.ecran === derogation.ecran;
}

function signalerDerogation(derogation: Derogation): ViolationStructure {
  return {
    regle: 'derogation-sans-justification',
    ecran: derogation.ecran ?? null,
    raison: `la dérogation à la règle « ${derogation.regle} » ne porte aucune justification écrite : elle ne lève rien.`,
  };
}

function appliquerDerogations(
  violations: readonly ViolationStructure[],
  derogations: readonly Derogation[],
): readonly ViolationStructure[] {
  const recevables = derogations.filter(estJustifiee);
  const signalees = derogations
    .filter((derogation) => !estJustifiee(derogation))
    .map(signalerDerogation);
  const restantes = violations.filter(
    (violation) =>
      !recevables.some((derogation) => estVisee(violation, derogation)),
  );
  return [...restantes, ...signalees];
}

export function verifierStructure(
  cours: Cours,
  derogations: readonly Derogation[] = [],
): readonly ViolationStructure[] {
  const analyse: Analyse = { cours, tirage: tirer(cours, GRAINE_DE_CONTROLE) };
  const violations = REGLES.flatMap((regle) => executer(regle, analyse));
  return appliquerDerogations(violations, derogations);
}
