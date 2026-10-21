import { dansLesBornes } from '../../../../common/domain/nombres/dans-les-bornes';
import { nombreAffiche } from '../../../../common/domain/nombres/ecriture-francaise';
import type { Cours } from '../contrats/cours';
import type {
  LigneDeMachine,
  MachineCalculee,
  SortiesMachine,
  ValeurDeMachine,
} from '../contrats/donnees-publiques';
import { ProductionInvalideError } from '../errors/FormationErrors';
import { ecranParId } from './EcranServi';
import {
  type CurseurReglable,
  ECHANTILLONS_D_UNE_COURBE,
  jalons,
  plafondDu,
  positionsDuCurseur,
  valeurFinie,
} from './TraceServi';

const INTERVALLES_DU_TABLEAU = 6;
const DECIMALES_AFFICHEES = 2;
const MOTIF_CLE_GABARIT = /\{([^{}]+)\}/g;

type Reglages = Readonly<Record<string, number>>;

export interface MachineACalculer {
  readonly parametres: readonly CurseurReglable[];
  readonly calcul: string;
  readonly phrase: string;
  readonly etapes?: readonly { readonly calcul: string }[];
  readonly prereglages?: readonly { readonly valeurs: Reglages }[];
  readonly animation?: readonly Reglages[];
}

function caler(
  machine: MachineACalculer,
  curseur: CurseurReglable,
  valeur: number,
): number {
  const positions = positionsDuCurseur(curseur, machine.prereglages);
  const ecarts = positions.map((position) => Math.abs(position - valeur));
  return positions[ecarts.lastIndexOf(Math.min(...ecarts))];
}

function poser(
  machine: MachineACalculer,
  courantes: Reglages,
  reglages: Reglages,
): Reglages {
  return Object.fromEntries(
    machine.parametres.map((curseur) => [
      curseur.cle,
      Object.hasOwn(reglages, curseur.cle)
        ? caler(machine, curseur, reglages[curseur.cle])
        : courantes[curseur.cle],
    ]),
  );
}

function reglagesParDefaut(machine: MachineACalculer): Reglages {
  return Object.fromEntries(
    machine.parametres.map((curseur) => [
      curseur.cle,
      caler(machine, curseur, curseur.defaut),
    ]),
  );
}

function affichageDe(valeur: number | null): string {
  return nombreAffiche(valeur, DECIMALES_AFFICHEES);
}

function affichee(valeur: number | null): ValeurDeMachine {
  return { valeur, affichage: affichageDe(valeur) };
}

function lignesDuCurseur(
  machine: MachineACalculer,
  curseur: CurseurReglable,
  valeurs: Reglages,
): LigneDeMachine[] {
  const courante = valeurs[curseur.cle];
  return [
    ...new Set([
      ...jalons(curseur.min, plafondDu(curseur), INTERVALLES_DU_TABLEAU),
      courante,
    ]),
  ]
    .sort((gauche, droite) => gauche - droite)
    .map((valeur) => ({
      valeur: affichee(valeur),
      resultat: affichee(
        valeurFinie(machine.calcul, { ...valeurs, [curseur.cle]: valeur }),
      ),
      courante: valeur === courante,
    }));
}

function courbeDuCurseur(
  machine: MachineACalculer,
  curseur: CurseurReglable,
  valeurs: Reglages,
): { x: number; y: number | null }[] {
  return jalons(curseur.min, plafondDu(curseur), ECHANTILLONS_D_UNE_COURBE).map(
    (x) => ({
      x,
      y: valeurFinie(machine.calcul, { ...valeurs, [curseur.cle]: x }),
    }),
  );
}

function sortiesPosees(
  machine: MachineACalculer,
  valeurs: Reglages,
): SortiesMachine {
  const resultat = valeurFinie(machine.calcul, valeurs);
  const remplissage: Record<string, number | null> = { ...valeurs, resultat };
  return {
    valeurs,
    resultat: affichee(resultat),
    etapes: (machine.etapes ?? []).map(({ calcul }) =>
      affichee(valeurFinie(calcul, valeurs)),
    ),
    courbes: Object.fromEntries(
      machine.parametres.map((curseur) => [
        curseur.cle,
        courbeDuCurseur(machine, curseur, valeurs),
      ]),
    ),
    lignes: Object.fromEntries(
      machine.parametres.map((curseur) => [
        curseur.cle,
        lignesDuCurseur(machine, curseur, valeurs),
      ]),
    ),
    phrase: machine.phrase.replace(
      MOTIF_CLE_GABARIT,
      (correspondance, cle: string) =>
        Object.hasOwn(remplissage, cle)
          ? affichageDe(remplissage[cle])
          : correspondance,
    ),
  };
}

export function sortiesDeLaMachine(
  machine: MachineACalculer,
  reglages: Reglages,
): SortiesMachine {
  return sortiesPosees(
    machine,
    poser(machine, reglagesParDefaut(machine), reglages),
  );
}

export function machineDuCours(
  cours: Cours,
  ecranId: string,
): MachineACalculer | null {
  const ecran = ecranParId(cours, ecranId);
  return ecran?.brique === 'fp-concept4' ? ecran.proprietes : null;
}

export function refusDuReglage(
  parametres: readonly { cle: string; min: number; max: number }[],
  cle: string,
  valeur: number,
): string | null {
  const parametre = parametres.find((candidat) => candidat.cle === cle);
  if (parametre === undefined) {
    return `paramètre ${cle} absent de l’écran`;
  }
  return dansLesBornes(valeur, parametre)
    ? null
    : `réglage ${cle} hors de [${parametre.min} ; ${parametre.max}]`;
}

export function evaluerLaMachine(
  machine: MachineACalculer,
  ecranId: string,
  reglages: Reglages,
): SortiesMachine {
  for (const [cle, valeur] of Object.entries(reglages)) {
    const refus = refusDuReglage(machine.parametres, cle, valeur);
    if (refus !== null) {
      throw new ProductionInvalideError(ecranId, refus);
    }
  }
  return sortiesDeLaMachine(machine, reglages);
}

export function machineCalculee(machine: MachineACalculer): MachineCalculee {
  const depart = reglagesParDefaut(machine);
  const animation = (machine.animation ?? []).reduce<Reglages[]>(
    (etapes, etape) => [
      ...etapes,
      poser(machine, etapes.at(-1) ?? depart, etape),
    ],
    [],
  );
  const positions = [
    depart,
    ...(machine.prereglages ?? []).map(({ valeurs }) =>
      poser(machine, depart, valeurs),
    ),
    ...animation,
  ];
  const uniques = new Map(
    positions.map((valeurs) => [JSON.stringify(valeurs), valeurs]),
  );
  return {
    sorties: [...uniques.values()].map((valeurs) =>
      sortiesPosees(machine, valeurs),
    ),
  };
}
