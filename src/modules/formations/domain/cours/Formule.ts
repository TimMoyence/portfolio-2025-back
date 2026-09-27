export type CodeErreur = '#REF!' | '#DIV/0!' | '#NOM?' | '#VALEUR!';

export interface ResultatFormule {
  readonly valeur: number | null;
  readonly erreur: CodeErreur | null;
}

export interface Feuille {
  readonly lignes: number;
  readonly colonnes: number;
  readonly cellules: Readonly<Record<string, string>>;
}

export interface OptionsEvaluation {
  readonly budgetNoeuds: number;
}

export const LONGUEUR_MAX_FORMULE = 200;
export const PROFONDEUR_MAX = 64;
export const NOMBRE_MAX_CELLULES = 2000;

export class FeuilleHorsLimitesError extends Error {
  constructor(raison: string) {
    super(`Feuille hors des limites du moteur de formules : ${raison}`);
    this.name = 'FeuilleHorsLimitesError';
  }
}

interface Reference {
  readonly ligne: number;
  readonly colonne: number;
  readonly ligneFixe: boolean;
  readonly colonneFixe: boolean;
}

type GenreJeton =
  | 'nombre'
  | 'reference'
  | 'nom'
  | 'operateur'
  | 'comparaison'
  | 'ouvrante'
  | 'fermante'
  | 'separateur'
  | 'deuxpoints';

interface Jeton {
  readonly genre: GenreJeton;
  readonly texte: string;
}

type Noeud =
  | { readonly genre: 'litteral'; readonly valeur: number }
  | { readonly genre: 'cellule'; readonly reference: Reference }
  | {
      readonly genre: 'plage';
      readonly debut: Reference;
      readonly fin: Reference;
    }
  | { readonly genre: 'variable'; readonly nom: string }
  | {
      readonly genre: 'unaire';
      readonly signe: number;
      readonly operande: Noeud;
    }
  | {
      readonly genre: 'binaire';
      readonly operateur: string;
      readonly gauche: Noeud;
      readonly droite: Noeud;
    }
  | {
      readonly genre: 'appel';
      readonly nom: string;
      readonly arguments: readonly Noeud[];
    };

type Contenu =
  | { readonly genre: 'vide' }
  | { readonly genre: 'nombre'; readonly valeur: number }
  | { readonly genre: 'texte' }
  | { readonly genre: 'formule'; readonly source: string };

const TEXTE_IGNORE: ReadonlySet<Contenu['genre']> = new Set(['texte']);
const TEXTE_ET_VIDES_IGNORES: ReadonlySet<Contenu['genre']> = new Set([
  'texte',
  'vide',
]);

class ErreurFormule extends Error {
  constructor(readonly code: CodeErreur) {
    super(code);
  }
}

const OPTIONS_PAR_DEFAUT: OptionsEvaluation = { budgetNoeuds: 20_000 };
const MARQUE = '=';
const MOTIF_NOMBRE = /^(?:\d+(?:[.,]\d*)?|[.,]\d+)/;
const MOTIF_REFERENCE = /^(\$?)([A-Za-z]{1,3})(\$?)(\d{1,7})(?![A-Za-z\d])/;
const MOTIF_NOM = /^[A-Za-z]+/;
const MOTIF_ESPACE = /^\s+/;
const MOTIF_NOMBRE_SAISI = /^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/;
const COMPARAISONS = ['<=', '>=', '<>', '<', '>', '='] as const;
const OPERATEURS: ReadonlySet<string> = new Set(['+', '-', '*', '/', '^']);
const ADDITIFS: ReadonlySet<string> = new Set(['+', '-']);
const MULTIPLICATIFS: ReadonlySet<string> = new Set(['*', '/']);
const PUISSANCES: ReadonlySet<string> = new Set(['^']);
const PONCTUATION: Readonly<Record<string, GenreJeton | undefined>> = {
  '(': 'ouvrante',
  ')': 'fermante',
  ';': 'separateur',
  ':': 'deuxpoints',
};
const FONCTIONS_MULTIPLES: ReadonlySet<string> = new Set(['SOMME', 'MOYENNE']);
const FONCTIONS_BINAIRES: ReadonlySet<string> = new Set([
  'ARRONDI',
  'PUISSANCE',
]);
const FONCTIONS_STATISTIQUES: ReadonlySet<string> = new Set([
  'MIN',
  'MAX',
  'NB',
  'MEDIANE',
  'ECARTYPEP',
  'ECARTYPE',
]);
const NOM_CONDITION = 'SI';
const NOM_QUARTILE = 'QUARTILE';
const RANG_MAX_QUARTILE = 4;
const ALPHABET = 26;
const CODE_A = 'A'.charCodeAt(0);
const PRECISION_DECIMALE = 15;
const DECIMALES_EXPRESSION = 6;
const ERREUR_VALEUR: CodeErreur = '#VALEUR!';
const ERREUR_REFERENCE: CodeErreur = '#REF!';
const ERREUR_DIVISION: CodeErreur = '#DIV/0!';
const ERREUR_NOM: CodeErreur = '#NOM?';

const REFUS: Readonly<Record<CodeErreur, ErreurFormule>> = {
  '#REF!': new ErreurFormule(ERREUR_REFERENCE),
  '#DIV/0!': new ErreurFormule(ERREUR_DIVISION),
  '#NOM?': new ErreurFormule(ERREUR_NOM),
  '#VALEUR!': new ErreurFormule(ERREUR_VALEUR),
};

function refuser(code: CodeErreur): never {
  throw REFUS[code];
}

function lettreColonne(colonne: number): string {
  let reste = colonne;
  let lettres = '';
  do {
    lettres = String.fromCharCode(CODE_A + (reste % ALPHABET)) + lettres;
    reste = Math.floor(reste / ALPHABET) - 1;
  } while (reste >= 0);
  return lettres;
}

function nomCellule(ligne: number, colonne: number): string {
  return `${lettreColonne(colonne)}${ligne + 1}`;
}

function indexColonne(lettres: string): number {
  return [...lettres.toUpperCase()].reduce(
    (cumul, lettre) => cumul * ALPHABET + (lettre.charCodeAt(0) - CODE_A + 1),
    0,
  );
}

function lireReference(texte: string): Reference {
  const trouve = MOTIF_REFERENCE.exec(texte);
  if (trouve === null || trouve[0] !== texte) {
    refuser(ERREUR_VALEUR);
  }
  return {
    ligne: Number(trouve[4]) - 1,
    colonne: indexColonne(trouve[2]) - 1,
    ligneFixe: trouve[3] === '$',
    colonneFixe: trouve[1] === '$',
  };
}

function lireNombre(brut: string): number {
  const compact = brut.trim().replace(',', '.');
  return MOTIF_NOMBRE_SAISI.test(compact) ? Number(compact) : Number.NaN;
}

function jetonSuivant(reste: string): Jeton {
  const nombre = MOTIF_NOMBRE.exec(reste);
  if (nombre !== null) {
    return { genre: 'nombre', texte: nombre[0] };
  }
  const reference = MOTIF_REFERENCE.exec(reste);
  if (reference !== null) {
    return { genre: 'reference', texte: reference[0] };
  }
  const nom = MOTIF_NOM.exec(reste);
  if (nom !== null) {
    return { genre: 'nom', texte: nom[0] };
  }
  const comparaison = COMPARAISONS.find((signe) => reste.startsWith(signe));
  if (comparaison !== undefined) {
    return { genre: 'comparaison', texte: comparaison };
  }
  const premier = reste.charAt(0);
  if (OPERATEURS.has(premier)) {
    return { genre: 'operateur', texte: premier };
  }
  const ponctuation = PONCTUATION[premier];
  if (ponctuation === undefined) {
    refuser(ERREUR_VALEUR);
  }
  return { genre: ponctuation, texte: premier };
}

function decouper(source: string): Jeton[] {
  if (source.length > LONGUEUR_MAX_FORMULE) {
    refuser(ERREUR_VALEUR);
  }
  const jetons: Jeton[] = [];
  let reste = source;
  while (reste.length > 0) {
    const espace = MOTIF_ESPACE.exec(reste);
    if (espace !== null) {
      reste = reste.slice(espace[0].length);
      continue;
    }
    const jeton = jetonSuivant(reste);
    jetons.push(jeton);
    reste = reste.slice(jeton.texte.length);
  }
  return jetons;
}

class Analyseur {
  private position = 0;
  private profondeur = 0;

  constructor(private readonly jetons: readonly Jeton[]) {}

  analyser(): Noeud {
    const racine = this.comparaison();
    if (this.position !== this.jetons.length) {
      refuser(ERREUR_VALEUR);
    }
    return racine;
  }

  private courant(): Jeton | null {
    return this.jetons[this.position] ?? null;
  }

  private avancer(): Jeton {
    const jeton = this.courant();
    if (jeton === null) {
      refuser(ERREUR_VALEUR);
    }
    this.position += 1;
    return jeton;
  }

  private consommer(genre: GenreJeton): void {
    if (this.avancer().genre !== genre) {
      refuser(ERREUR_VALEUR);
    }
  }

  private descendre<T>(niveau: () => T): T {
    this.profondeur += 1;
    if (this.profondeur > PROFONDEUR_MAX) {
      refuser(ERREUR_VALEUR);
    }
    const resultat = niveau();
    this.profondeur -= 1;
    return resultat;
  }

  private comparaison(): Noeud {
    const gauche = this.somme();
    const jeton = this.courant();
    if (jeton === null || jeton.genre !== 'comparaison') {
      return gauche;
    }
    this.position += 1;
    return {
      genre: 'binaire',
      operateur: jeton.texte,
      gauche,
      droite: this.somme(),
    };
  }

  private somme(): Noeud {
    return this.suite(ADDITIFS, () => this.produit());
  }

  private produit(): Noeud {
    return this.suite(MULTIPLICATIFS, () => this.puissance());
  }

  private puissance(): Noeud {
    return this.suite(PUISSANCES, () => this.unaire());
  }

  private suite(signes: ReadonlySet<string>, niveau: () => Noeud): Noeud {
    let gauche = niveau();
    let jeton = this.courant();
    while (
      jeton !== null &&
      jeton.genre === 'operateur' &&
      signes.has(jeton.texte)
    ) {
      this.position += 1;
      gauche = {
        genre: 'binaire',
        operateur: jeton.texte,
        gauche,
        droite: niveau(),
      };
      jeton = this.courant();
    }
    return gauche;
  }

  private unaire(): Noeud {
    const jeton = this.courant();
    if (
      jeton !== null &&
      jeton.genre === 'operateur' &&
      ADDITIFS.has(jeton.texte)
    ) {
      this.position += 1;
      return this.descendre<Noeud>(() => ({
        genre: 'unaire',
        signe: jeton.texte === '-' ? -1 : 1,
        operande: this.unaire(),
      }));
    }
    return this.primaire();
  }

  private primaire(): Noeud {
    const jeton = this.avancer();
    if (jeton.genre === 'nombre') {
      return {
        genre: 'litteral',
        valeur: Number(jeton.texte.replace(',', '.')),
      };
    }
    if (jeton.genre === 'ouvrante') {
      return this.descendre<Noeud>(() => {
        const interne = this.comparaison();
        this.consommer('fermante');
        return interne;
      });
    }
    if (jeton.genre === 'reference') {
      return this.celluleOuPlage(jeton);
    }
    if (jeton.genre === 'nom') {
      return this.courant()?.genre === 'ouvrante'
        ? this.descendre<Noeud>(() => this.appel(jeton.texte))
        : { genre: 'variable', nom: jeton.texte };
    }
    return refuser(ERREUR_VALEUR);
  }

  private celluleOuPlage(jeton: Jeton): Noeud {
    const debut = lireReference(jeton.texte);
    if (this.courant()?.genre !== 'deuxpoints') {
      return { genre: 'cellule', reference: debut };
    }
    this.position += 1;
    const fin = this.avancer();
    if (fin.genre !== 'reference') {
      refuser(ERREUR_VALEUR);
    }
    return { genre: 'plage', debut, fin: lireReference(fin.texte) };
  }

  private appel(nom: string): Noeud {
    this.position += 1;
    const parametres: Noeud[] = [];
    if (this.courant()?.genre === 'fermante') {
      this.position += 1;
      return { genre: 'appel', nom: nom.toUpperCase(), arguments: parametres };
    }
    parametres.push(this.comparaison());
    while (this.courant()?.genre === 'separateur') {
      this.position += 1;
      parametres.push(this.comparaison());
    }
    this.consommer('fermante');
    return { genre: 'appel', nom: nom.toUpperCase(), arguments: parametres };
  }
}

function analyser(source: string): Noeud {
  return new Analyseur(decouper(source)).analyser();
}

function sourceDeFormule(brut: string): string | null {
  const debut = brut.trimStart();
  return debut.startsWith(MARQUE) ? debut.slice(MARQUE.length) : null;
}

function lireContenu(brut: string): Contenu {
  if (brut.trim().length === 0) {
    return { genre: 'vide' };
  }
  const source = sourceDeFormule(brut);
  if (source !== null) {
    return { genre: 'formule', source };
  }
  const nombre = lireNombre(brut);
  return Number.isNaN(nombre)
    ? { genre: 'texte' }
    : { genre: 'nombre', valeur: nombre };
}

function sansZeroNegatif(valeur: number): number {
  return valeur === 0 ? 0 : valeur;
}

function arrondirMoitieLoinDeZero(valeur: number, decimales: number): number {
  const facteur = 10 ** Math.trunc(decimales);
  const decale = Number(
    (Math.abs(valeur) * facteur).toPrecision(PRECISION_DECIMALE),
  );
  const arrondi = (Math.sign(valeur) * Math.round(decale)) / facteur;
  return sansZeroNegatif(Number(arrondi.toPrecision(PRECISION_DECIMALE)));
}

function comparer(operateur: string, gauche: number, droite: number): number {
  const vrai =
    (operateur === '=' && gauche === droite) ||
    (operateur === '<>' && gauche !== droite) ||
    (operateur === '<' && gauche < droite) ||
    (operateur === '<=' && gauche <= droite) ||
    (operateur === '>' && gauche > droite) ||
    (operateur === '>=' && gauche >= droite);
  return vrai ? 1 : 0;
}

function appliquer(operateur: string, gauche: number, droite: number): number {
  if (operateur === '+') {
    return gauche + droite;
  }
  if (operateur === '-') {
    return gauche - droite;
  }
  if (operateur === '*') {
    return gauche * droite;
  }
  if (operateur === '/') {
    return droite === 0 ? refuser(ERREUR_DIVISION) : gauche / droite;
  }
  if (operateur === '^') {
    return gauche ** droite;
  }
  return comparer(operateur, gauche, droite);
}

function quantile(valeurs: readonly number[], part: number): number {
  if (valeurs.length === 0) {
    refuser(ERREUR_VALEUR);
  }
  const triees = [...valeurs].sort((gauche, droite) => gauche - droite);
  const position = (triees.length - 1) * part;
  const bas = Math.floor(position);
  const haut = Math.min(bas + 1, triees.length - 1);
  return triees[bas] + (position - bas) * (triees[haut] - triees[bas]);
}

function ecartType(valeurs: readonly number[], degresPerdus: number): number {
  const diviseur = valeurs.length - degresPerdus;
  if (diviseur <= 0) {
    refuser(ERREUR_DIVISION);
  }
  const moyenne =
    valeurs.reduce((cumul, valeur) => cumul + valeur, 0) / valeurs.length;
  const carres = valeurs.reduce(
    (cumul, valeur) => cumul + (valeur - moyenne) ** 2,
    0,
  );
  return Math.sqrt(carres / diviseur);
}

function statistique(nom: string, valeurs: readonly number[]): number {
  switch (nom) {
    case 'MIN':
      return valeurs.length === 0 ? 0 : Math.min(...valeurs);
    case 'MAX':
      return valeurs.length === 0 ? 0 : Math.max(...valeurs);
    case 'NB':
      return valeurs.length;
    case 'MEDIANE':
      return quantile(valeurs, 1 / 2);
    case 'ECARTYPEP':
      return ecartType(valeurs, 0);
    default:
      return ecartType(valeurs, 1);
  }
}

function fini(valeur: number): number {
  return Number.isFinite(valeur)
    ? sansZeroNegatif(valeur)
    : refuser(ERREUR_VALEUR);
}

function echec(cause: unknown): ResultatFormule {
  return {
    valeur: null,
    erreur: cause instanceof ErreurFormule ? cause.code : ERREUR_VALEUR,
  };
}

function estEntierPositif(valeur: number): boolean {
  return Number.isSafeInteger(valeur) && valeur >= 0;
}

function exigerFeuilleRecevable(feuille: Feuille): void {
  if (
    !estEntierPositif(feuille.lignes) ||
    !estEntierPositif(feuille.colonnes)
  ) {
    throw new FeuilleHorsLimitesError(
      'la grille doit être un couple d’entiers positifs',
    );
  }
  const nombre = Object.keys(feuille.cellules).length;
  if (nombre > NOMBRE_MAX_CELLULES) {
    throw new FeuilleHorsLimitesError(
      `${nombre} cellules pour ${NOMBRE_MAX_CELLULES} au plus`,
    );
  }
}

class Evaluation {
  private restant: number;
  private readonly contenus: ReadonlyMap<string, string>;
  private readonly memoire = new Map<string, ResultatFormule>();
  private readonly arbres = new Map<string, Noeud>();
  private readonly enCours = new Set<string>();

  constructor(
    private readonly feuille: Feuille | null,
    private readonly variables: Readonly<Record<string, number>>,
    options: OptionsEvaluation,
  ) {
    this.restant = options.budgetNoeuds;
    this.contenus = new Map(
      Object.entries(feuille?.cellules ?? {}).map(([nom, contenu]) => [
        nom.toUpperCase(),
        String(contenu),
      ]),
    );
  }

  nomsRemplis(): string[] {
    return [...this.contenus.entries()]
      .filter(([, contenu]) => contenu.trim().length > 0)
      .map(([nom]) => nom);
  }

  resultatDe(nom: string): ResultatFormule {
    const connu = this.memoire.get(nom);
    if (connu !== undefined) {
      return connu;
    }
    if (this.enCours.has(nom)) {
      return { valeur: null, erreur: ERREUR_REFERENCE };
    }
    this.enCours.add(nom);
    let resultat: ResultatFormule;
    try {
      this.depenser();
      resultat = { valeur: this.valeurDuContenu(nom), erreur: null };
    } catch (cause) {
      resultat = echec(cause);
    }
    this.enCours.delete(nom);
    this.memoire.set(nom, resultat);
    return resultat;
  }

  expression(noeud: Noeud): number {
    return fini(this.calculer(noeud));
  }

  private depenser(): void {
    this.restant -= 1;
    if (this.restant < 0) {
      refuser(ERREUR_VALEUR);
    }
  }

  private valeurDuContenu(nom: string): number {
    const contenu = lireContenu(this.contenus.get(nom) ?? '');
    if (contenu.genre === 'vide') {
      return 0;
    }
    if (contenu.genre === 'nombre') {
      return contenu.valeur;
    }
    if (contenu.genre === 'texte') {
      return refuser(ERREUR_VALEUR);
    }
    return fini(this.calculer(this.arbreDe(contenu.source)));
  }

  private arbreDe(source: string): Noeud {
    const connu = this.arbres.get(source);
    if (connu !== undefined) {
      return connu;
    }
    const arbre = analyser(source);
    this.arbres.set(source, arbre);
    return arbre;
  }

  private exigerDansLaGrille(reference: Reference): string {
    const feuille = this.feuille;
    if (
      feuille === null ||
      reference.ligne < 0 ||
      reference.colonne < 0 ||
      reference.ligne >= feuille.lignes ||
      reference.colonne >= feuille.colonnes
    ) {
      return refuser(ERREUR_REFERENCE);
    }
    return nomCellule(reference.ligne, reference.colonne);
  }

  private valeurCellule(reference: Reference): number {
    const resultat = this.resultatDe(this.exigerDansLaGrille(reference));
    return resultat.erreur === null && resultat.valeur !== null
      ? resultat.valeur
      : refuser(resultat.erreur ?? ERREUR_VALEUR);
  }

  private valeursDeLaPlage(
    noeud: Extract<Noeud, { genre: 'plage' }>,
    ignorees: ReadonlySet<Contenu['genre']> = TEXTE_IGNORE,
  ): number[] {
    const { debut, fin } = noeud;
    this.exigerDansLaGrille(debut);
    this.exigerDansLaGrille(fin);
    const valeurs: number[] = [];
    for (
      let ligne = Math.min(debut.ligne, fin.ligne);
      ligne <= Math.max(debut.ligne, fin.ligne);
      ligne += 1
    ) {
      for (
        let colonne = Math.min(debut.colonne, fin.colonne);
        colonne <= Math.max(debut.colonne, fin.colonne);
        colonne += 1
      ) {
        this.depenser();
        const nom = nomCellule(ligne, colonne);
        if (!ignorees.has(lireContenu(this.contenus.get(nom) ?? '').genre)) {
          valeurs.push(
            this.valeurCellule({
              ligne,
              colonne,
              ligneFixe: false,
              colonneFixe: false,
            }),
          );
        }
      }
    }
    return valeurs;
  }

  private etendre(noeud: Noeud): number[] {
    return noeud.genre === 'plage'
      ? this.valeursDeLaPlage(noeud)
      : [this.calculer(noeud)];
  }

  private serie(parametres: readonly Noeud[]): number[] {
    return parametres.flatMap((argument) =>
      argument.genre === 'plage'
        ? this.valeursDeLaPlage(argument, TEXTE_ET_VIDES_IGNORES)
        : [this.calculer(argument)],
    );
  }

  private quartile(parametres: readonly Noeud[]): number {
    if (parametres.length !== 2) {
      refuser(ERREUR_VALEUR);
    }
    const rang = Math.trunc(this.calculer(parametres[1]));
    if (rang < 0 || rang > RANG_MAX_QUARTILE) {
      refuser(ERREUR_VALEUR);
    }
    return quantile(this.serie([parametres[0]]), rang / RANG_MAX_QUARTILE);
  }

  private condition(parametres: readonly Noeud[]): number {
    if (parametres.length !== 2 && parametres.length !== 3) {
      refuser(ERREUR_VALEUR);
    }
    const testee = this.calculer(parametres[0]);
    if (testee !== 0) {
      return this.calculer(parametres[1]);
    }
    return parametres.length === 3 ? this.calculer(parametres[2]) : 0;
  }

  private agreger(nom: string, parametres: readonly Noeud[]): number {
    const valeurs = parametres.flatMap((argument) => this.etendre(argument));
    const somme = valeurs.reduce((cumul, valeur) => cumul + valeur, 0);
    if (nom === 'SOMME') {
      return somme;
    }
    return valeurs.length === 0
      ? refuser(ERREUR_DIVISION)
      : somme / valeurs.length;
  }

  private binaireNommee(nom: string, parametres: readonly Noeud[]): number {
    if (parametres.length !== 2) {
      refuser(ERREUR_VALEUR);
    }
    const [premier, second] = parametres.map((argument) =>
      this.calculer(argument),
    );
    return nom === 'ARRONDI'
      ? arrondirMoitieLoinDeZero(premier, second)
      : premier ** second;
  }

  private appeler(noeud: Extract<Noeud, { genre: 'appel' }>): number {
    if (noeud.nom === NOM_CONDITION) {
      return this.condition(noeud.arguments);
    }
    if (FONCTIONS_MULTIPLES.has(noeud.nom)) {
      return this.agreger(noeud.nom, noeud.arguments);
    }
    if (FONCTIONS_BINAIRES.has(noeud.nom)) {
      return this.binaireNommee(noeud.nom, noeud.arguments);
    }
    if (FONCTIONS_STATISTIQUES.has(noeud.nom)) {
      return statistique(noeud.nom, this.serie(noeud.arguments));
    }
    if (noeud.nom === NOM_QUARTILE) {
      return this.quartile(noeud.arguments);
    }
    return refuser(ERREUR_NOM);
  }

  private calculer(noeud: Noeud): number {
    this.depenser();
    switch (noeud.genre) {
      case 'litteral':
        return noeud.valeur;
      case 'variable':
        return Object.hasOwn(this.variables, noeud.nom)
          ? this.variables[noeud.nom]
          : refuser(ERREUR_NOM);
      case 'cellule':
        return this.valeurCellule(noeud.reference);
      case 'plage':
        return refuser(ERREUR_VALEUR);
      case 'unaire':
        return noeud.signe * this.calculer(noeud.operande);
      case 'binaire':
        return appliquer(
          noeud.operateur,
          this.calculer(noeud.gauche),
          this.calculer(noeud.droite),
        );
      case 'appel':
        return this.appeler(noeud);
    }
  }
}

function referenceDeCellule(nom: string): Reference | null {
  try {
    return lireReference(nom.trim());
  } catch {
    return null;
  }
}

export function evaluerFeuille(
  feuille: Feuille,
  options: OptionsEvaluation = OPTIONS_PAR_DEFAUT,
): ReadonlyMap<string, ResultatFormule> {
  exigerFeuilleRecevable(feuille);
  const evaluation = new Evaluation(feuille, {}, options);
  return new Map(
    evaluation.nomsRemplis().map((nom) => [nom, evaluation.resultatDe(nom)]),
  );
}

export function evaluerCellule(
  feuille: Feuille,
  nom: string,
  options: OptionsEvaluation = OPTIONS_PAR_DEFAUT,
): ResultatFormule {
  exigerFeuilleRecevable(feuille);
  const reference = referenceDeCellule(nom);
  if (
    reference === null ||
    reference.ligne >= feuille.lignes ||
    reference.colonne >= feuille.colonnes
  ) {
    return { valeur: null, erreur: ERREUR_REFERENCE };
  }
  return new Evaluation(feuille, {}, options).resultatDe(
    nomCellule(reference.ligne, reference.colonne),
  );
}

export function evaluerExpression(
  expression: string,
  variables: Readonly<Record<string, number>>,
  options: OptionsEvaluation = OPTIONS_PAR_DEFAUT,
): ResultatFormule {
  try {
    const source = sourceDeFormule(expression) ?? expression;
    const valeur = new Evaluation(null, variables, options).expression(
      analyser(source),
    );
    return {
      valeur: sansZeroNegatif(Number(valeur.toFixed(DECIMALES_EXPRESSION))),
      erreur: null,
    };
  } catch (cause) {
    return echec(cause);
  }
}

function formeRelative(reference: Reference, origine: Reference): string {
  const ecart = (
    axe: 'R' | 'C',
    fixe: boolean,
    cible: number,
    depart: number,
  ): string => {
    if (fixe) {
      return `${axe}${cible + 1}`;
    }
    const delta = cible - depart;
    return delta === 0 ? axe : `${axe}[${delta}]`;
  };
  return (
    ecart('R', reference.ligneFixe, reference.ligne, origine.ligne) +
    ecart('C', reference.colonneFixe, reference.colonne, origine.colonne)
  );
}

export interface SurfaceFormule {
  readonly references: readonly string[];
  readonly litteraux: readonly number[];
}

export function surfaceDeFormule(formule: string): SurfaceFormule | null {
  const source = sourceDeFormule(formule);
  if (source === null) {
    return null;
  }
  try {
    const jetons = decouper(source);
    new Analyseur(jetons).analyser();
    return {
      references: jetons
        .filter((jeton) => jeton.genre === 'reference')
        .map((jeton) => jeton.texte.replaceAll('$', '').toUpperCase()),
      litteraux: jetons
        .filter((jeton) => jeton.genre === 'nombre')
        .map((jeton) => Number(jeton.texte.replace(',', '.'))),
    };
  } catch {
    return null;
  }
}

export function formeR1C1(formule: string, cellule: string): string | null {
  const source = sourceDeFormule(formule);
  const origine = referenceDeCellule(cellule);
  if (source === null || origine === null) {
    return null;
  }
  try {
    const jetons = decouper(source);
    new Analyseur(jetons).analyser();
    const corps = jetons
      .map((jeton) =>
        jeton.genre === 'reference'
          ? formeRelative(lireReference(jeton.texte), origine)
          : jeton.texte,
      )
      .join('');
    return `${MARQUE}${corps}`;
  } catch {
    return null;
  }
}
