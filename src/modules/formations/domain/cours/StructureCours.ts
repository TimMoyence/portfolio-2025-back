import type { Cours, Derogation, Ecran } from './Cours';
import { estInteractif, questionsDuCours } from './Cours';

export const REGLES_STRUCTURE = [
  'exposition-continue',
  'ratio-interaction',
  'ouverture-cloture',
  'duree-ecran',
  'duree-cours',
  'reference-inconnue',
  'reference-circulaire',
] as const;

export type RegleStructure = (typeof REGLES_STRUCTURE)[number];

export interface ViolationStructure {
  readonly regle: RegleStructure | 'derogation-sans-justification';
  readonly ecran: string | null;
  readonly raison: string;
}

interface Manquement {
  readonly ecran: string | null;
  readonly raison: string;
}

const EXPOSITION_MAXIMALE_MINUTES = 6;
const RATIO_INTERACTION_MINIMAL = 0.3;
const TOLERANCE_DUREE_ANNONCEE = 0.05;
const BRIQUE_OUVERTURE = 'fp-recall';
const BRIQUE_CLOTURE = 'fp-exit';
const PREFIXE_REFERENCE = 'ref:';
const DIACRITIQUES = /\p{M}/gu;

function nomEcran(ecran: Ecran, rang: number): string {
  return ecran.id !== '' ? ecran.id : `#${rang}`;
}

function estDureePositive(minutes: number): boolean {
  return Number.isFinite(minutes) && minutes > 0;
}

function minutesDe(ecran: Ecran): number {
  return estDureePositive(ecran.dureeMinutes) ? ecran.dureeMinutes : 0;
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

function controlerExposition(cours: Cours): readonly Manquement[] {
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

function controlerRatio(cours: Cours): readonly Manquement[] {
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

function controlerOuvertureCloture(cours: Cours): readonly Manquement[] {
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

function controlerDureeEcran(cours: Cours): readonly Manquement[] {
  return cours.ecrans.flatMap((ecran, rang) => {
    if (estDureePositive(ecran.dureeMinutes)) {
      return [];
    }
    const identifiant = nomEcran(ecran, rang);
    return [
      {
        ecran: identifiant,
        raison: `l'écran « ${identifiant} » annonce une durée de « ${ecran.dureeMinutes} » : une durée doit être un nombre strictement positif.`,
      },
    ];
  });
}

function controlerDureeCours(cours: Cours): readonly Manquement[] {
  const annoncee = cours.dureeMinutes;
  if (!estDureePositive(annoncee)) {
    return [
      {
        ecran: null,
        raison: `le cours annonce une durée de « ${annoncee} » : une durée annoncée doit être un nombre strictement positif.`,
      },
    ];
  }
  const declarees = cours.ecrans.reduce(
    (total, ecran) => total + minutesDe(ecran),
    0,
  );
  const ecart = Math.abs(declarees - annoncee);
  const tolerance = annoncee * TOLERANCE_DUREE_ANNONCEE;
  if (ecart <= tolerance) {
    return [];
  }
  return [
    {
      ecran: null,
      raison: `${declarees} min déclarées par les écrans pour ${annoncee} min annoncées : l'écart de ${ecart} min dépasse la tolérance de ${tolerance} min.`,
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
  absence: string,
): string {
  const voisin = voisinIndistinct(identifiant, connus);
  if (voisin === null) {
    return `${sujet} « ${identifiant} » ${absence}`;
  }
  return `${sujet} « ${identifiant} » est un identifiant distinct de « ${voisin} » : la casse et les accents ne sont jamais rapprochés en silence.`;
}

function estTableau(valeur: unknown): valeur is readonly unknown[] {
  return Array.isArray(valeur);
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
  if (estTableau(valeur)) {
    return valeur.flatMap((element) => referencesDansValeur(element));
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

function controlerReferences(cours: Cours): readonly Manquement[] {
  const connus = identifiantsConnus(cours);
  const references = [
    ...referencesEcrans(cours),
    ...referencesRemediations(cours),
  ];
  return references
    .filter((reference) => !connus.has(reference.cible))
    .map((reference) => ({
      ecran: reference.ecran,
      raison: raisonIntrouvable(
        sujetDe(reference),
        reference.cible,
        connus,
        "qui n'est déclaré par aucun écran ni aucune question de ce cours.",
      ),
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

function controlerCycles(cours: Cours): readonly Manquement[] {
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

interface Regle {
  readonly id: RegleStructure;
  readonly controler: (cours: Cours) => readonly Manquement[];
}

const REGLES: readonly Regle[] = [
  { id: 'exposition-continue', controler: controlerExposition },
  { id: 'ratio-interaction', controler: controlerRatio },
  { id: 'ouverture-cloture', controler: controlerOuvertureCloture },
  { id: 'duree-ecran', controler: controlerDureeEcran },
  { id: 'duree-cours', controler: controlerDureeCours },
  { id: 'reference-inconnue', controler: controlerReferences },
  { id: 'reference-circulaire', controler: controlerCycles },
];

function executer(regle: Regle, cours: Cours): readonly ViolationStructure[] {
  return regle.controler(cours).map((manquement) => ({
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

export function verifierStructure(cours: Cours): readonly ViolationStructure[] {
  const violations = REGLES.flatMap((regle) => executer(regle, cours));
  return appliquerDerogations(violations, cours.derogations);
}
