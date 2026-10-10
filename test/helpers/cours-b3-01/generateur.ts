import {
  creerRng,
  creerTirage,
  melanger,
  type Rng,
  type Tirage,
} from '../../../src/modules/formations/domain/cours/Aleatoire';
import { arrondirMoitieLoinDeZero } from 'portfolio-2025-partage/formule';
import {
  dateExcel,
  estJourOuvre,
  montantEnTexte,
  nbJoursOuvres,
  partiesDeDate,
  serieJourOuvre,
  type Valeur,
} from './excel';
import {
  texteDe,
  type Cellule,
  type Classeur,
  type Colonne,
  type JeuB301,
  type Ligne,
} from './modele';
import {
  ACTIVITES,
  AGENCES,
  CATEGORIES,
  COMMERCIAL_DES_REMISES,
  DELAIS_DU_RESEAU,
  DUPONT_DE_BORDEAUX,
  MOTIFS_DE_QUARANTAINE,
  NOMS_DE_FAMILLE,
  PRODUITS,
  PRODUITS_ABSENTS,
  REMISES_DU_COMMERCIAL,
  REMISES_DU_RESEAU,
  SAISONNALITE,
  TAILLES_DE_COMMANDE,
  type AgenceDuReseau,
  type Categorie,
  type ParametresDeCategorie,
  type ProduitDeCatalogue,
} from './referentiels';

export const GRAINE_B3_01 = 20_261_013;

const ECHELLE_DU_BUDGET = 5_600;
const PREMIER_JOUR = dateExcel(2025, 1, 2);
const DERNIER_JOUR = dateExcel(2026, 9, 30);
const DERNIERE_LIVRAISON = dateExcel(2026, 10, 9);
const DEBUT_DES_RETARDS = dateExcel(2026, 3, 1);
const FIN_DES_RUPTURES = dateExcel(2026, 8, 1);
const PREMIERE_DATE_D_ANCIENNETE = dateExcel(2012, 1, 1);
const DERNIERE_DATE_D_ANCIENNETE = dateExcel(2024, 12, 31);
const AGENCE_EN_RETARD = 'AG12';
const AGENCE_EN_BAISSE = 'AG06';
const AGENCE_DES_DUPONT = 'AG07';
const AGENCE_DES_REMISES = 'AG09';
const CATEGORIE_EN_BAISSE: Categorie = 'Informatique';
const BAISSE_DE_LA_CATEGORIE = 0.6;
const OBJECTIF_DE_CROISSANCE_2026 = 1.05;
const ECART_DES_OBJECTIFS_2025 = [0.94, 1.06] as const;
const PART_DES_RUPTURES = 0.08;
const PART_DU_COMMERCIAL_DES_REMISES = 0.45;
const PART_DES_NOUVEAUX_CLIENTS = 0.25;
const POIDS_DE_LA_VILLE_DE_L_AGENCE = 40;
const POIDS_D_UNE_AUTRE_VILLE = 20;
const CLIENTS_PAR_AGENCE = 50;
const PAIRES_DE_CLIENTS_EN_DOUBLE = 4;
const COMMERCIAUX_PAR_AGENCE = 3;
const PREMIER_NUMERO_DE_COMMANDE = 10_001;
const COMMANDE_A_TROIS_LIGNES = 'C-10234';
const LIGNES_DE_LA_COMMANDE_TEMOIN = 3;
const FACTEUR_DU_PRIX_ABERRANT = 10;
const TIRAGES_REFUSES_PAR_CASE = 40;

export const ANOMALIES_SEMEES = {
  F4: 24,
  S1: 12,
  S3: 6,
  F3: 46,
  F1: 310,
  F2: 180,
  F5: 40,
  H1: 9,
  H2: 14,
  H3: 11,
  S2: 8,
} as const;

type CodeAnomalie = keyof typeof ANOMALIES_SEMEES;
type CodeDeQuarantaine = keyof typeof MOTIFS_DE_QUARANTAINE;

interface Client {
  readonly cle: number;
  readonly raisonSociale: string;
  readonly ville: string;
  readonly secteur: string;
  readonly agence: AgenceDuReseau;
  readonly nouveau: boolean;
  readonly jumeauDe?: number;
}

interface ClientNumerote extends Client {
  readonly id: string;
}

interface Article {
  readonly produit: ProduitDeCatalogue;
  readonly quantite: number;
}

interface ArticleRemise extends Article {
  readonly remise: number;
}

interface Commande {
  readonly date: number;
  readonly agence: AgenceDuReseau;
  readonly client: ClientNumerote;
  readonly commercial: string;
  readonly delai: number;
  readonly articles: readonly ArticleRemise[];
  readonly rang: number;
}

type LigneDeCommande = {
  readonly n_commande: string;
  readonly date_commande: number;
  readonly date_livraison: number;
  readonly client_id: string;
  readonly ville: string;
  readonly agence_id: string;
  readonly commercial_id: string;
  readonly produit_id: string;
  readonly quantite: number;
  readonly prix_unitaire_ht: number;
  readonly remise: number;
  readonly ca_ht: number;
  readonly facturee: boolean;
};

interface Hasard {
  readonly rng: Rng;
  readonly tirage: Tirage;
}

function auHasard<T>({ rng }: Hasard, valeurs: readonly T[]): T {
  return valeurs[Math.floor(rng() * valeurs.length)];
}

function choixPondere<T>(
  { rng }: Hasard,
  options: readonly (readonly [T, number])[],
): T {
  const total = options.reduce((somme, [, poids]) => somme + poids, 0);
  let seuil = rng() * total;
  for (const [valeur, poids] of options) {
    seuil -= poids;
    if (seuil < 0) {
      return valeur;
    }
  }
  return options[options.length - 1][0];
}

function numero(prefixe: string, rang: number, chiffres: number): string {
  return `${prefixe}${String(rang).padStart(chiffres, '0')}`;
}

function commerciauxDe(agence: AgenceDuReseau): readonly string[] {
  const rang = AGENCES.indexOf(agence);
  return Array.from({ length: COMMERCIAUX_PAR_AGENCE }, (_, decalage) =>
    numero('C', rang * COMMERCIAUX_PAR_AGENCE + decalage + 1, 2),
  );
}

function moisDeLaPeriode(): readonly { annee: number; mois: number }[] {
  const debut = partiesDeDate(PREMIER_JOUR);
  const fin = partiesDeDate(DERNIER_JOUR);
  const periode: { annee: number; mois: number }[] = [];
  for (
    let annee = debut.annee, mois = debut.mois;
    annee < fin.annee || (annee === fin.annee && mois <= fin.mois);
    mois = (mois % 12) + 1, annee += mois === 1 ? 1 : 0
  ) {
    periode.push({ annee, mois });
  }
  return periode;
}

function joursOuvresDuMois(annee: number, mois: number): number[] {
  const jours: number[] = [];
  for (
    let jour = dateExcel(annee, mois, 1);
    jour < dateExcel(annee, mois + 1, 1);
    jour += 1
  ) {
    if (estJourOuvre(jour) && jour >= PREMIER_JOUR && jour <= DERNIER_JOUR) {
      jours.push(jour);
    }
  }
  return jours;
}

function genererClients(hasard: Hasard): readonly ClientNumerote[] {
  const raisons = melanger(
    NOMS_DE_FAMILLE.flatMap((nom) =>
      Object.keys(ACTIVITES).map((activite) => ({
        raisonSociale: `${nom} ${activite}`,
        secteur: ACTIVITES[activite],
      })),
    ),
    hasard.rng,
  );
  const agencesAJumeau = melanger(
    AGENCES.filter((agence) => agence.id !== AGENCE_DES_DUPONT),
    hasard.rng,
  ).slice(0, PAIRES_DE_CLIENTS_EN_DOUBLE);
  let compteur = 0;
  const clients = AGENCES.flatMap((agence) => {
    const villes = agence.villesDesClients.map(
      (ville, rang) =>
        [
          ville,
          rang === 0 ? POIDS_DE_LA_VILLE_DE_L_AGENCE : POIDS_D_UNE_AUTRE_VILLE,
        ] as const,
    );
    const deLAgence: Client[] = Array.from(
      { length: CLIENTS_PAR_AGENCE },
      (_, rang) => {
        const dupont =
          agence.id === AGENCE_DES_DUPONT
            ? DUPONT_DE_BORDEAUX.at(rang)
            : undefined;
        const identite = dupont ?? raisons.pop();
        if (identite === undefined) {
          throw new RangeError('Raisons sociales épuisées');
        }
        return {
          cle: compteur++,
          ...identite,
          ville:
            dupont === undefined ? choixPondere(hasard, villes) : agence.ville,
          agence,
          nouveau: hasard.rng() < PART_DES_NOUVEAUX_CLIENTS,
        };
      },
    );
    if (agencesAJumeau.includes(agence)) {
      const original = auHasard(hasard, deLAgence.slice(0, -1));
      deLAgence[deLAgence.length - 1] = {
        ...original,
        cle: compteur++,
        nouveau: true,
        jumeauDe: original.cle,
      };
    }
    return deLAgence;
  });
  return melanger(clients, hasard.rng).map((client, rang) => ({
    ...client,
    id: numero('CL', rang + 1, 3),
  }));
}

function facteurDuBudget(
  agence: AgenceDuReseau,
  annee: number,
  categorie: Categorie,
): number {
  if (annee < 2026) {
    return 1;
  }
  const baisse =
    agence.id === AGENCE_EN_BAISSE && categorie === CATEGORIE_EN_BAISSE
      ? BAISSE_DE_LA_CATEGORIE
      : 1;
  return agence.croissance2026 * baisse;
}

function genererArticles(
  hasard: Hasard,
  categorie: ParametresDeCategorie,
  budget: number,
): Article[] {
  const produits = PRODUITS.filter(
    (produit) => produit.categorie === categorie.categorie,
  );
  const articles: Article[] = [];
  let cumul = 0;
  for (let refus = 0; refus < TIRAGES_REFUSES_PAR_CASE; ) {
    const produit = auHasard(hasard, produits);
    const quantite = choixPondere(hasard, categorie.quantites);
    const montant = produit.prix * quantite;
    if (cumul + montant > budget) {
      refus += 1;
    } else {
      articles.push({ produit, quantite });
      cumul += montant;
    }
  }
  return articles;
}

function regrouperEnCommandes(
  hasard: Hasard,
  articles: readonly Article[],
): Article[][] {
  const restants = melanger(articles, hasard.rng);
  const groupes: Article[][] = [];
  while (restants.length > 0) {
    const taille = choixPondere(hasard, TAILLES_DE_COMMANDE);
    const groupe: Article[] = [];
    for (let rang = 0; rang < restants.length && groupe.length < taille; ) {
      if (
        groupe.some((article) => article.produit === restants[rang].produit)
      ) {
        rang += 1;
      } else {
        groupe.push(...restants.splice(rang, 1));
      }
    }
    groupes.push(groupe);
  }
  return groupes;
}

function remiseDe(hasard: Hasard, commercial: string, annee: number): number {
  return commercial === COMMERCIAL_DES_REMISES && annee === 2026
    ? auHasard(hasard, REMISES_DU_COMMERCIAL)
    : choixPondere(hasard, REMISES_DU_RESEAU);
}

function commercialDe(
  hasard: Hasard,
  agence: AgenceDuReseau,
  annee: number,
): string {
  const commerciaux = commerciauxDe(agence);
  if (agence.id === AGENCE_DES_REMISES && annee === 2026) {
    const autres = commerciaux.filter((id) => id !== COMMERCIAL_DES_REMISES);
    return hasard.rng() < PART_DU_COMMERCIAL_DES_REMISES
      ? COMMERCIAL_DES_REMISES
      : auHasard(hasard, autres);
  }
  return auHasard(hasard, commerciaux);
}

function delaiDe(hasard: Hasard, agence: AgenceDuReseau, date: number): number {
  if (agence.id !== AGENCE_EN_RETARD || date < DEBUT_DES_RETARDS) {
    return choixPondere(hasard, DELAIS_DU_RESEAU);
  }
  return date < FIN_DES_RUPTURES && hasard.rng() < PART_DES_RUPTURES
    ? hasard.tirage.entier(40, 60)
    : hasard.tirage.entier(6, 12);
}

function genererCommandes(
  hasard: Hasard,
  clients: readonly ClientNumerote[],
): Commande[] {
  const commandes: Commande[] = [];
  for (const { annee, mois } of moisDeLaPeriode()) {
    const jours = joursOuvresDuMois(annee, mois);
    for (const agence of AGENCES) {
      const budgetDuMois =
        ECHELLE_DU_BUDGET * agence.poids * SAISONNALITE[mois - 1];
      const articles = CATEGORIES.flatMap((categorie) =>
        genererArticles(
          hasard,
          categorie,
          budgetDuMois *
            categorie.partDuBudget *
            facteurDuBudget(agence, annee, categorie.categorie),
        ),
      );
      const clientsDeLAgence = clients.filter(
        (client) => client.agence === agence,
      );
      for (const groupe of regrouperEnCommandes(hasard, articles)) {
        const date = auHasard(hasard, jours);
        const commercial = commercialDe(hasard, agence, annee);
        commandes.push({
          date,
          agence,
          client: auHasard(hasard, clientsDeLAgence),
          commercial,
          delai: delaiDe(hasard, agence, date),
          articles: groupe.map((article) => ({
            ...article,
            remise: remiseDe(hasard, commercial, annee),
          })),
          rang: commandes.length,
        });
      }
    }
  }
  return commandes.sort(
    (a, b) =>
      a.date - b.date ||
      a.agence.id.localeCompare(b.agence.id) ||
      a.rang - b.rang,
  );
}

function ajusterLaCommandeTemoin(hasard: Hasard, commande: Commande): Commande {
  const articles = commande.articles.slice(0, LIGNES_DE_LA_COMMANDE_TEMOIN);
  const annee = partiesDeDate(commande.date).annee;
  while (articles.length < LIGNES_DE_LA_COMMANDE_TEMOIN) {
    const categorie = choixPondere(
      hasard,
      CATEGORIES.map(
        (parametres) => [parametres, parametres.partDuBudget] as const,
      ),
    );
    const produit = auHasard(
      hasard,
      PRODUITS.filter(
        (candidat) =>
          candidat.categorie === categorie.categorie &&
          !articles.some((article) => article.produit === candidat),
      ),
    );
    articles.push({
      produit,
      quantite: choixPondere(hasard, categorie.quantites),
      remise: remiseDe(hasard, commande.commercial, annee),
    });
  }
  return { ...commande, articles };
}

function lignesDe(commandes: readonly Commande[]): LigneDeCommande[] {
  return commandes.flatMap((commande, rang) => {
    const livraison = Math.min(
      serieJourOuvre(commande.date, commande.delai),
      DERNIERE_LIVRAISON,
    );
    return commande.articles.map((article) => ({
      n_commande: `C-${PREMIER_NUMERO_DE_COMMANDE + rang}`,
      date_commande: commande.date,
      date_livraison: livraison,
      client_id: commande.client.id,
      ville: commande.client.ville,
      agence_id: commande.agence.id,
      commercial_id: commande.commercial,
      produit_id: article.produit.id,
      quantite: article.quantite,
      prix_unitaire_ht: article.produit.prix,
      remise: article.remise,
      ca_ht: arrondirMoitieLoinDeZero(
        article.quantite * article.produit.prix * (1 - article.remise),
        2,
      ),
      facturee: livraison <= DERNIER_JOUR,
    }));
  });
}

function categorieDe(ligne: LigneDeCommande): Categorie | undefined {
  return PRODUITS.find((produit) => produit.id === ligne.produit_id)?.categorie;
}

const ELIGIBILITES: Readonly<
  Partial<Record<CodeAnomalie, (ligne: LigneDeCommande) => boolean>>
> = {
  F4: (ligne) =>
    ligne.remise > 0 &&
    arrondirMoitieLoinDeZero(ligne.quantite * ligne.prix_unitaire_ht, 2) -
      ligne.ca_ht >
      1,
  S1: (ligne) => {
    const { jour, mois } = partiesDeDate(ligne.date_commande);
    return jour <= 12 && jour !== mois;
  },
  S3: (ligne) => categorieDe(ligne) === 'Fournitures',
};

function choisirLesLignesSemees(
  hasard: Hasard,
  lignes: readonly LigneDeCommande[],
): ReadonlyMap<number, CodeAnomalie> {
  const candidates = melanger(
    lignes.flatMap((ligne, rang) =>
      ligne.n_commande === COMMANDE_A_TROIS_LIGNES ? [] : [rang],
    ),
    hasard.rng,
  );
  const semees = new Map<number, CodeAnomalie>();
  for (const [code, nombre] of Object.entries(ANOMALIES_SEMEES) as [
    CodeAnomalie,
    number,
  ][]) {
    const eligible = ELIGIBILITES[code] ?? (() => true);
    const retenues = candidates
      .filter((rang) => !semees.has(rang) && eligible(lignes[rang]))
      .slice(0, nombre);
    if (retenues.length < nombre) {
      throw new RangeError(`Pas assez de lignes pour l’anomalie ${code}`);
    }
    for (const rang of retenues) {
      semees.set(rang, code);
    }
  }
  return semees;
}

function deuxChiffres(nombre: number): string {
  return String(nombre).padStart(2, '0');
}

function semer(
  hasard: Hasard,
  code: CodeAnomalie,
  ligne: LigneDeCommande,
): Record<string, Valeur> {
  const brute: Record<string, Valeur> = { ...ligne };
  const { annee, mois, jour } = partiesDeDate(ligne.date_commande);
  const caAvec = (quantite: number, prix: number) =>
    arrondirMoitieLoinDeZero(quantite * prix * (1 - ligne.remise), 2);
  switch (code) {
    case 'F1':
      brute.ville = auHasard(hasard, [
        ligne.ville.toLocaleUpperCase('fr'),
        ligne.ville.toLocaleLowerCase('fr'),
        ` ${ligne.ville} `,
      ]);
      break;
    case 'F2':
      brute.ca_ht = montantEnTexte(ligne.ca_ht);
      break;
    case 'F4':
      brute.ca_ht = arrondirMoitieLoinDeZero(
        ligne.quantite * ligne.prix_unitaire_ht,
        2,
      );
      break;
    case 'F5':
      brute.date_commande = `${annee}-${deuxChiffres(mois)}-${deuxChiffres(jour)}`;
      break;
    case 'S1':
      brute.date_commande = `${deuxChiffres(mois)}/${deuxChiffres(jour)}/${deuxChiffres(annee % 100)}`;
      break;
    case 'H1':
      brute.produit_id = auHasard(hasard, PRODUITS_ABSENTS);
      break;
    case 'H2':
      brute.date_livraison = serieJourOuvre(
        ligne.date_commande,
        -hasard.tirage.entier(1, 8),
      );
      break;
    case 'H3':
      brute.commercial_id = null;
      break;
    case 'S2':
      brute.quantite = -hasard.tirage.entier(1, 3);
      brute.ca_ht = caAvec(brute.quantite, ligne.prix_unitaire_ht);
      break;
    case 'S3':
      brute.prix_unitaire_ht = arrondirMoitieLoinDeZero(
        ligne.prix_unitaire_ht * FACTEUR_DU_PRIX_ABERRANT,
        2,
      );
      brute.ca_ht = caAvec(ligne.quantite, brute.prix_unitaire_ht);
      break;
    case 'F3':
      break;
  }
  return brute;
}

function estEnQuarantaine(
  code: CodeAnomalie | undefined,
): code is CodeDeQuarantaine {
  return code !== undefined && Object.hasOwn(MOTIFS_DE_QUARANTAINE, code);
}

const COLONNES_DES_COMMANDES: readonly Colonne[] = [
  { nom: 'n_commande', format: 'texte' },
  { nom: 'date_commande', format: 'date' },
  { nom: 'date_livraison', format: 'date' },
  { nom: 'client_id', format: 'texte' },
  { nom: 'ville', format: 'texte' },
  { nom: 'agence_id', format: 'texte' },
  { nom: 'commercial_id', format: 'texte' },
  { nom: 'produit_id', format: 'texte' },
  { nom: 'quantite', format: 'entier' },
  { nom: 'prix_unitaire_ht', format: 'euros' },
  { nom: 'remise', format: 'pourcentage' },
  { nom: 'ca_ht', format: 'euros' },
  { nom: 'facturee', format: 'booleen' },
];

const COLONNES_DE_LA_REPRISE_2: readonly Colonne[] = [
  { nom: 'annee', format: 'entier' },
  { nom: 'region', format: 'texte' },
  { nom: 'categorie', format: 'texte' },
  { nom: 'cout', format: 'euros' },
  { nom: 'marge', format: 'euros' },
  { nom: 'delai_ouvre', format: 'entier' },
  { nom: 'date_promise', format: 'date' },
  { nom: 'en_retard', format: 'booleen' },
];

const COLONNES_DES_CLIENTS: readonly Colonne[] = [
  { nom: 'client_id', format: 'texte' },
  { nom: 'raison_sociale', format: 'texte' },
  { nom: 'ville', format: 'texte' },
  { nom: 'secteur', format: 'texte' },
  { nom: 'date_premiere_commande', format: 'date' },
];

function ongletsDeReference(
  hasard: Hasard,
  clients: readonly ClientNumerote[],
  lignes: readonly LigneDeCommande[],
  couts: ReadonlyMap<string, number>,
): {
  clients: Ligne[];
  produits: Ligne[];
  agences: Ligne[];
  objectifs: Ligne[];
} {
  const premieresCommandes = new Map<string, number>();
  for (const ligne of lignes) {
    premieresCommandes.set(
      ligne.client_id,
      Math.min(
        premieresCommandes.get(ligne.client_id) ?? Infinity,
        ligne.date_commande,
      ),
    );
  }
  const realise2025 = new Map<string, number>();
  for (const ligne of lignes) {
    const { annee, mois } = partiesDeDate(ligne.date_commande);
    const cle = `${ligne.agence_id}|${mois}`;
    if (annee === 2025) {
      realise2025.set(cle, (realise2025.get(cle) ?? 0) + ligne.ca_ht);
    }
  }
  return {
    clients: [...clients]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((client) => {
        const ancienne = serieJourOuvre(
          hasard.tirage.entier(
            PREMIERE_DATE_D_ANCIENNETE,
            DERNIERE_DATE_D_ANCIENNETE,
          ) - 1,
          1,
        );
        const premiere = premieresCommandes.get(client.id);
        return {
          client_id: client.id,
          raison_sociale: client.raisonSociale,
          ville: client.ville,
          secteur: client.secteur,
          date_premiere_commande:
            client.nouveau && premiere !== undefined ? premiere : ancienne,
        };
      }),
    produits: PRODUITS.map((produit) => ({
      produit_id: produit.id,
      libelle: produit.libelle,
      categorie: produit.categorie,
      prix_catalogue_ht: produit.prix,
      cout_unitaire: couts.get(produit.id) ?? 0,
    })),
    agences: AGENCES.map((agence) => ({
      agence_id: agence.id,
      ville: agence.ville,
      region: agence.region,
      responsable: agence.responsable,
    })),
    objectifs: AGENCES.flatMap((agence) =>
      moisDeLaPeriode().map(({ annee, mois }) => ({
        agence_id: agence.id,
        mois: dateExcel(annee, mois, 1),
        objectif_ca_ht: arrondirMoitieLoinDeZero(
          (realise2025.get(`${agence.id}|${mois}`) ?? 0) *
            (annee === 2026
              ? OBJECTIF_DE_CROISSANCE_2026
              : hasard.tirage.decimal(
                  ECART_DES_OBJECTIFS_2025[0],
                  ECART_DES_OBJECTIFS_2025[1],
                  0.01,
                )),
          -2,
        ),
      })),
    ),
  };
}

function colonnesCalculees(
  ligne: LigneDeCommande,
  rangDansLaFeuille: number,
  couts: ReadonlyMap<string, number>,
): Record<string, Cellule> {
  const r = rangDansLaFeuille;
  const agence = AGENCES.find((candidate) => candidate.id === ligne.agence_id);
  const cout = ligne.quantite * (couts.get(ligne.produit_id) ?? 0);
  const datePromise = serieJourOuvre(ligne.date_commande, 5);
  return {
    annee: {
      formule: `YEAR(B${r})`,
      resultat: partiesDeDate(ligne.date_commande).annee,
    },
    region: {
      formule: `INDEX(Agences!$C:$C,MATCH(F${r},Agences!$A:$A,0))`,
      resultat: agence?.region ?? '',
    },
    categorie: {
      formule: `INDEX(Produits!$C:$C,MATCH(H${r},Produits!$A:$A,0))`,
      resultat: categorieDe(ligne) ?? '',
    },
    cout: {
      formule: `I${r}*INDEX(Produits!$E:$E,MATCH(H${r},Produits!$A:$A,0))`,
      resultat: cout,
    },
    marge: { formule: `L${r}-Q${r}`, resultat: ligne.ca_ht - cout },
    delai_ouvre: {
      formule: `NETWORKDAYS(B${r},C${r})-1`,
      resultat: nbJoursOuvres(ligne.date_commande, ligne.date_livraison) - 1,
    },
    date_promise: { formule: `WORKDAY(B${r},5)`, resultat: datePromise },
    en_retard: {
      formule: `C${r}>T${r}`,
      resultat: ligne.date_livraison > datePromise,
    },
  };
}

export function genererJeuB301(graine: number): JeuB301 {
  const rng = creerRng(graine);
  const hasard: Hasard = { rng, tirage: creerTirage(rng) };
  const couts = new Map(
    PRODUITS.map((produit) => {
      const marge =
        (CATEGORIES.find((c) => c.categorie === produit.categorie)
          ?.tauxDeMarque ?? 0) + hasard.tirage.decimal(-0.05, 0.05, 0.01);
      return [
        produit.id,
        arrondirMoitieLoinDeZero(produit.prix * (1 - marge), 2),
      ] as const;
    }),
  );
  const clients = genererClients(hasard);
  const commandes = genererCommandes(hasard, clients);
  const rangTemoin =
    Number(COMMANDE_A_TROIS_LIGNES.slice(2)) - PREMIER_NUMERO_DE_COMMANDE;
  commandes[rangTemoin] = ajusterLaCommandeTemoin(
    hasard,
    commandes[rangTemoin],
  );
  const lignes = lignesDe(commandes);
  const semees = choisirLesLignesSemees(hasard, lignes);
  const reference = ongletsDeReference(hasard, clients, lignes, couts);

  const brutes: Ligne[] = [];
  const quarantaine: Ligne[] = [];
  lignes.forEach((ligne, rang) => {
    const code = semees.get(rang);
    const brute = code === undefined ? ligne : semer(hasard, code, ligne);
    brutes.push(...(code === 'F3' ? [brute, { ...brute }] : [brute]));
    if (estEnQuarantaine(code)) {
      quarantaine.push({ ...brute, motif: MOTIFS_DE_QUARANTAINE[code] });
    }
  });
  const saines = lignes.filter(
    (_, rang) => !estEnQuarantaine(semees.get(rang)),
  );
  const jumeaux = new Map(
    clients.flatMap((client) => {
      const original = clients.find(
        (candidat) => candidat.cle === client.jumeauDe,
      );
      return original === undefined
        ? []
        : [
            [client.id, original.id],
            [original.id, client.id],
          ];
    }),
  );
  const clientsSignales = reference.clients.map((client) => ({
    ...client,
    doublon_probable: jumeaux.get(texteDe(client, 'client_id')) ?? null,
  }));

  const referentiels: Classeur = {
    Produits: {
      colonnes: [
        { nom: 'produit_id', format: 'texte' },
        { nom: 'libelle', format: 'texte' },
        { nom: 'categorie', format: 'texte' },
        { nom: 'prix_catalogue_ht', format: 'euros' },
        { nom: 'cout_unitaire', format: 'euros' },
      ],
      lignes: reference.produits,
    },
    Agences: {
      colonnes: [
        { nom: 'agence_id', format: 'texte' },
        { nom: 'ville', format: 'texte' },
        { nom: 'region', format: 'texte' },
        { nom: 'responsable', format: 'texte' },
      ],
      lignes: reference.agences,
    },
    Objectifs: {
      colonnes: [
        { nom: 'agence_id', format: 'texte' },
        { nom: 'mois', format: 'mois' },
        { nom: 'objectif_ca_ht', format: 'euros' },
      ],
      lignes: reference.objectifs,
    },
  };
  const quarantaineEtClients: Classeur = {
    Quarantaine: {
      colonnes: [...COLONNES_DES_COMMANDES, { nom: 'motif', format: 'texte' }],
      lignes: quarantaine,
    },
    Clients: {
      colonnes: [
        ...COLONNES_DES_CLIENTS,
        { nom: 'doublon_probable', format: 'texte' },
      ],
      lignes: clientsSignales,
    },
  };
  return {
    brut: {
      Commandes: { colonnes: COLONNES_DES_COMMANDES, lignes: brutes },
      Clients: { colonnes: COLONNES_DES_CLIENTS, lignes: reference.clients },
      ...referentiels,
    },
    reprise1: {
      Commandes: { colonnes: COLONNES_DES_COMMANDES, lignes: saines },
      ...quarantaineEtClients,
      ...referentiels,
    },
    reprise2: {
      Commandes: {
        colonnes: [...COLONNES_DES_COMMANDES, ...COLONNES_DE_LA_REPRISE_2],
        lignes: saines.map((ligne, rang) => ({
          ...ligne,
          ...colonnesCalculees(ligne, rang + 2, couts),
        })),
      },
      ...quarantaineEtClients,
      ...referentiels,
    },
  };
}
