import { borner } from '../../../../common/domain/nombres/borner';
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
import { evaluerExpression } from './Formule';
import {
  type CurseurReglable,
  ECHANTILLONS_D_UNE_COURBE,
  jalons,
} from './TraceServi';

const INTERVALLES_DU_TABLEAU = 6;
const DECIMALES_AFFICHEES = 2;
const PRECISION_D_UN_CRAN = 1e9;
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

function plafondDu(curseur: CurseurReglable): number {
  return Math.max(curseur.max, curseur.min);
}

function caler(curseur: CurseurReglable, valeur: number): number {
  const borne = borner(valeur, curseur.min, plafondDu(curseur));
  if (curseur.pas <= 0) {
    return borne;
  }
  const cale =
    curseur.min + Math.round((borne - curseur.min) / curseur.pas) * curseur.pas;
  return borner(
    Math.round(cale * PRECISION_D_UN_CRAN) / PRECISION_D_UN_CRAN,
    curseur.min,
    plafondDu(curseur),
  );
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
        ? caler(curseur, reglages[curseur.cle])
        : courantes[curseur.cle],
    ]),
  );
}

function reglagesParDefaut(machine: MachineACalculer): Reglages {
  return Object.fromEntries(
    machine.parametres.map((curseur) => [
      curseur.cle,
      caler(curseur, curseur.defaut),
    ]),
  );
}

function valeurFinie(calcul: string, valeurs: Reglages): number | null {
  const { valeur } = evaluerExpression(calcul, valeurs);
  return valeur !== null && Number.isFinite(valeur) ? valeur : null;
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
