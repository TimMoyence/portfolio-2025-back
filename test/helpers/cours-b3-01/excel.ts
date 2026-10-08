export type Valeur = number | string | boolean | null;

const ORIGINE_DES_DATES = Date.UTC(1899, 11, 30);
const MILLISECONDES_PAR_JOUR = 86_400_000;
const JOURS_PAR_SEMAINE = 7;
const RANG_DU_SAMEDI = 0;
const RANG_DU_DIMANCHE = 1;
const CHIFFRES_SIGNIFICATIFS = 15;
const PIVOT_DES_ANNEES_A_DEUX_CHIFFRES = 30;
const DATE_ISO = /^(\d{4})-(\d{2})-(\d{2})$/;
const DATE_FRANCAISE = /^(\d{2})\/(\d{2})\/(\d{2}|\d{4})$/;
const ERREUR_DE_VALEUR = '#VALEUR!';

export function dateExcel(annee: number, mois: number, jour: number): number {
  return Math.round(
    (Date.UTC(annee, mois - 1, jour) - ORIGINE_DES_DATES) /
      MILLISECONDES_PAR_JOUR,
  );
}

export function partiesDeDate(serie: number): {
  readonly annee: number;
  readonly mois: number;
  readonly jour: number;
} {
  const date = new Date(ORIGINE_DES_DATES + serie * MILLISECONDES_PAR_JOUR);
  return {
    annee: date.getUTCFullYear(),
    mois: date.getUTCMonth() + 1,
    jour: date.getUTCDate(),
  };
}

export function estJourOuvre(serie: number): boolean {
  const rang = serie % JOURS_PAR_SEMAINE;
  return rang !== RANG_DU_SAMEDI && rang !== RANG_DU_DIMANCHE;
}

export function nbJoursOuvres(debut: number, fin: number): number {
  if (fin < debut) {
    return -nbJoursOuvres(fin, debut);
  }
  let total = 0;
  for (let jour = debut; jour <= fin; jour += 1) {
    total += estJourOuvre(jour) ? 1 : 0;
  }
  return total;
}

export function serieJourOuvre(debut: number, jours: number): number {
  const pas = Math.sign(jours);
  let jour = debut;
  for (let restants = Math.abs(jours); restants > 0; ) {
    jour += pas;
    restants -= estJourOuvre(jour) ? 1 : 0;
  }
  return jour;
}

function nombres(valeurs: readonly Valeur[]): number[] {
  return valeurs.filter((valeur) => typeof valeur === 'number');
}

export function somme(valeurs: readonly Valeur[]): number {
  return nombres(valeurs).reduce((total, valeur) => total + valeur, 0);
}

export function moyenne(valeurs: readonly Valeur[]): number {
  const retenues = nombres(valeurs);
  if (retenues.length === 0) {
    throw new RangeError('#DIV/0!');
  }
  return somme(retenues) / retenues.length;
}

export function mediane(valeurs: readonly Valeur[]): number {
  const triees = nombres(valeurs).sort((a, b) => a - b);
  if (triees.length === 0) {
    throw new RangeError('#NOMBRE!');
  }
  const milieu = Math.floor(triees.length / 2);
  return triees.length % 2 === 1
    ? triees[milieu]
    : (triees[milieu - 1] + triees[milieu]) / 2;
}

export function arrondi(valeur: number, decimales: number): number {
  const echelle = Number(
    (Math.abs(valeur) * 10 ** decimales).toPrecision(CHIFFRES_SIGNIFICATIFS),
  );
  const entier = Math.floor(echelle + 0.5);
  if (entier === 0) {
    return 0;
  }
  const absolu =
    decimales >= 0 ? entier / 10 ** decimales : entier * 10 ** -decimales;
  return valeur < 0 ? -absolu : absolu;
}

type ValeurPleine = Exclude<Valeur, null>;

const VIDES_PAR_TYPE: Readonly<Partial<Record<string, ValeurPleine>>> = {
  string: '',
  boolean: false,
};

function videEnFaceDe(autre: Valeur): ValeurPleine {
  return VIDES_PAR_TYPE[typeof autre] ?? 0;
}

function rangDeType(valeur: ValeurPleine): number {
  if (typeof valeur === 'number') {
    return 0;
  }
  return typeof valeur === 'string' ? 1 : 2;
}

export function comparerCommeExcel(a: Valeur, b: Valeur): number {
  const gauche = a ?? videEnFaceDe(b);
  const droite = b ?? videEnFaceDe(a);
  const ecartDeType = rangDeType(gauche) - rangDeType(droite);
  if (ecartDeType !== 0) {
    return ecartDeType;
  }
  if (typeof gauche === 'string' && typeof droite === 'string') {
    return gauche.localeCompare(droite, 'fr', { sensitivity: 'accent' });
  }
  return Number(gauche) - Number(droite);
}

export function supprEspace(texte: string): string {
  return texte
    .split(' ')
    .filter((mot) => mot !== '')
    .join(' ');
}

export function nomPropre(texte: string): string {
  let apresUneLettre = false;
  return Array.from(texte, (caractere) => {
    const estUneLettre = /\p{L}/u.test(caractere);
    const resultat = apresUneLettre
      ? caractere.toLocaleLowerCase('fr')
      : caractere.toLocaleUpperCase('fr');
    apresUneLettre = estUneLettre;
    return resultat;
  }).join('');
}

export function montantEnTexte(montant: number): string {
  const [entier, centimes] = Math.abs(montant).toFixed(2).split('.');
  const groupes: string[] = [];
  for (let fin = entier.length; fin > 0; fin -= 3) {
    groupes.unshift(entier.slice(Math.max(0, fin - 3), fin));
  }
  return `${montant < 0 ? '-' : ''}${groupes.join(' ')},${centimes} €`;
}

export function montantTexteVersNombre(texte: string): number {
  const nettoye = texte.replaceAll(' €', '').replaceAll(' ', '');
  if (!/^-?\d+(,\d+)?$/.test(nettoye)) {
    throw new TypeError(ERREUR_DE_VALEUR);
  }
  return Number(nettoye.replace(',', '.'));
}

function anneeSurQuatreChiffres(annee: number): number {
  return annee < PIVOT_DES_ANNEES_A_DEUX_CHIFFRES ? 2000 + annee : 1900 + annee;
}

function anneeLue(annee: string): number {
  return annee.length === 4
    ? Number(annee)
    : anneeSurQuatreChiffres(Number(annee));
}

function dateExistante(annee: number, mois: number, jour: number): number {
  const serie = dateExcel(annee, mois, jour);
  const lue = partiesDeDate(serie);
  if (lue.annee !== annee || lue.mois !== mois || lue.jour !== jour) {
    throw new TypeError(ERREUR_DE_VALEUR);
  }
  return serie;
}

export function dateval(texte: string): number {
  const iso = DATE_ISO.exec(texte);
  if (iso !== null) {
    return dateExistante(Number(iso[1]), Number(iso[2]), Number(iso[3]));
  }
  const francaise = DATE_FRANCAISE.exec(texte);
  if (francaise !== null) {
    return dateExistante(
      anneeLue(francaise[3]),
      Number(francaise[2]),
      Number(francaise[1]),
    );
  }
  throw new TypeError(ERREUR_DE_VALEUR);
}
