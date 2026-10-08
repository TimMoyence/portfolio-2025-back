import type {
  HistoireB301,
  PiegesB301,
  ValeursAttenduesB301,
} from '../../../src/modules/formations/infrastructure/contenus/b3-01.donnees';
import {
  arrondi,
  comparerCommeExcel,
  dateExcel,
  dateval,
  mediane,
  montantTexteVersNombre,
  moyenne,
  nbJoursOuvres,
  nomPropre,
  partiesDeDate,
  serieJourOuvre,
  somme,
  supprEspace,
  type Valeur,
} from './excel';
import {
  nombreDe,
  ongletDe,
  texteDe,
  valeurDe,
  type JeuB301,
  type Ligne,
} from './modele';

const DEBUT_2025 = dateExcel(2025, 1, 1);
const FIN_SEPTEMBRE_2025 = dateExcel(2025, 9, 30);
const DEBUT_2026 = dateExcel(2026, 1, 1);
const FIN_SEPTEMBRE_2026 = dateExcel(2026, 9, 30);
const DELAI_PROMIS = 5;
const SEUIL_DE_REMISE = 0.15;
const COMMANDE_TEMOIN = 'C-10234';
const RENNES = 'AG06';
const NANTES = 'AG05';
const LILLE = 'AG01';
const MARSEILLE = 'AG09';
const STRASBOURG = 'AG12';
const INFORMATIQUE = 'Informatique';
const OUEST = 'Ouest';
const CRITERE_DE_DATE_SANS_ESPERLUETTE = 'DATE(2026;1;1)';
const REMISE_ECRITE_EN_POINTS = 15;
const LIGNES_LAISSEES_EN_QUARANTAINE_PAR_UNE_SUPPRESSION = 0;

interface Vente {
  readonly agence: string;
  readonly region: string;
  readonly categorie: string;
  readonly date: number;
  readonly livraison: number;
  readonly quantite: number;
  readonly prix: number;
  readonly remise: number;
  readonly ca: number;
  readonly coutUnitaire: number;
}

export interface IndicateursDAgence {
  readonly ca2025: number;
  readonly ca2026: number;
  readonly atteinte: number;
  readonly evolution: number;
  readonly tauxDeMarque2025: number;
  readonly tauxDeMarque2026: number;
  readonly delaiMedian2026: number;
}

const euros = (montant: number): number => arrondi(montant, 0);
const pourcent = (part: number): number => arrondi(part * 100, 1);

function cleExcel(valeur: Valeur): string {
  return typeof valeur === 'string'
    ? `t:${valeur.toLocaleLowerCase('fr')}`
    : `${typeof valeur}:${String(valeur)}`;
}

function distinctes(valeurs: readonly Valeur[]): number {
  return new Set(valeurs.map(cleExcel)).size;
}

function lignesUniques(lignes: readonly Ligne[]): Ligne[] {
  const vues = new Set<string>();
  return lignes.filter((ligne) => {
    const cle = Object.keys(ligne)
      .map((colonne) => cleExcel(valeurDe(ligne, colonne)))
      .join('|');
    const nouvelle = !vues.has(cle);
    vues.add(cle);
    return nouvelle;
  });
}

function ventesDe(jeu: JeuB301): Vente[] {
  const produits = new Map(
    ongletDe(jeu.reprise1, 'Produits').lignes.map((produit) => [
      texteDe(produit, 'produit_id'),
      produit,
    ]),
  );
  const regions = new Map(
    ongletDe(jeu.reprise1, 'Agences').lignes.map((agence) => [
      texteDe(agence, 'agence_id'),
      texteDe(agence, 'region'),
    ]),
  );
  return ongletDe(jeu.reprise1, 'Commandes').lignes.map((ligne) => {
    const produit = produits.get(texteDe(ligne, 'produit_id'));
    const agence = texteDe(ligne, 'agence_id');
    if (produit === undefined || !regions.has(agence)) {
      throw new RangeError('Ligne saine hors des référentiels');
    }
    return {
      agence,
      region: regions.get(agence) ?? '',
      categorie: texteDe(produit, 'categorie'),
      date: nombreDe(ligne, 'date_commande'),
      livraison: nombreDe(ligne, 'date_livraison'),
      quantite: nombreDe(ligne, 'quantite'),
      prix: nombreDe(ligne, 'prix_unitaire_ht'),
      remise: nombreDe(ligne, 'remise'),
      ca: nombreDe(ligne, 'ca_ht'),
      coutUnitaire: nombreDe(produit, 'cout_unitaire'),
    };
  });
}

function regionsTrouveesSansFigerLaTable(jeu: JeuB301): Vente[] {
  const rangsDesAgences = ongletDe(jeu.reprise1, 'Agences').lignes.map(
    (agence) => texteDe(agence, 'agence_id'),
  );
  return ventesDe(jeu).filter(
    (vente, rang) => rangsDesAgences.indexOf(vente.agence) >= rang,
  );
}

const en2025 = (vente: Vente): boolean =>
  partiesDeDate(vente.date).annee === 2025;
const jusquASeptembre2025 = (vente: Vente): boolean =>
  vente.date >= DEBUT_2025 && vente.date <= FIN_SEPTEMBRE_2025;
const en2026 = (vente: Vente): boolean =>
  vente.date >= DEBUT_2026 && vente.date <= FIN_SEPTEMBRE_2026;

const caDe = (ventes: readonly Vente[]): number =>
  somme(ventes.map((vente) => vente.ca));

const margeDe = (vente: Vente): number =>
  vente.quantite * (vente.prix * (1 - vente.remise) - vente.coutUnitaire);

const tauxDeMarque = (ventes: readonly Vente[]): number =>
  somme(ventes.map(margeDe)) / caDe(ventes);

const tauxDeMarge = (ventes: readonly Vente[]): number =>
  somme(ventes.map(margeDe)) /
  somme(ventes.map((vente) => vente.quantite * vente.coutUnitaire));

const moyenneDesTaux = (ventes: readonly Vente[]): number =>
  moyenne(
    ventes.map(
      (vente) => (vente.ca - vente.quantite * vente.coutUnitaire) / vente.ca,
    ),
  );

const delaiOuvre = (vente: Vente): number =>
  nbJoursOuvres(vente.date, vente.livraison) - 1;

function objectifsDe(
  jeu: JeuB301,
  agence: string,
  retenir: (mois: number) => boolean,
): number {
  return somme(
    ongletDe(jeu.reprise1, 'Objectifs')
      .lignes.filter(
        (objectif) =>
          texteDe(objectif, 'agence_id') === agence &&
          retenir(nombreDe(objectif, 'mois')),
      )
      .map((objectif) => nombreDe(objectif, 'objectif_ca_ht')),
  );
}

const moisDe2026 = (mois: number): boolean =>
  mois >= DEBUT_2026 && mois <= FIN_SEPTEMBRE_2026;

function filtrer(
  ventes: readonly Vente[],
  ...conditions: readonly ((vente: Vente) => boolean)[]
): Vente[] {
  return ventes.filter((vente) =>
    conditions.every((condition) => condition(vente)),
  );
}

const deLAgence =
  (agence: string) =>
  (vente: Vente): boolean =>
    vente.agence === agence;

export function indicateursParAgence(
  jeu: JeuB301,
): Readonly<Record<string, IndicateursDAgence>> {
  const ventes = ventesDe(jeu);
  const agences = [...new Set(ventes.map((vente) => vente.agence))].sort(
    (a, b) => a.localeCompare(b),
  );
  return Object.fromEntries(
    agences.map((agence) => {
      const siennes = filtrer(ventes, deLAgence(agence));
      const de2026 = filtrer(siennes, en2026);
      const jusquASeptembre = filtrer(siennes, jusquASeptembre2025);
      return [
        agence,
        {
          ca2025: caDe(filtrer(siennes, en2025)),
          ca2026: caDe(de2026),
          atteinte: caDe(de2026) / objectifsDe(jeu, agence, moisDe2026),
          evolution: caDe(de2026) / caDe(jusquASeptembre) - 1,
          tauxDeMarque2025: tauxDeMarque(jusquASeptembre),
          tauxDeMarque2026: tauxDeMarque(de2026),
          delaiMedian2026: mediane(de2026.map(delaiOuvre)),
        },
      ];
    }),
  );
}

function trimestreDe(date: number): string {
  const { annee, mois } = partiesDeDate(date);
  return `T${Math.ceil(mois / 3)} ${annee}`;
}

export function caParTrimestre(jeu: JeuB301): Readonly<Record<string, number>> {
  const trimestres: Record<string, number> = {};
  for (const vente of ventesDe(jeu)) {
    const trimestre = trimestreDe(vente.date);
    trimestres[trimestre] = (trimestres[trimestre] ?? 0) + vente.ca;
  }
  return trimestres;
}

function montantDe(valeur: Valeur): Valeur {
  return typeof valeur === 'string' ? montantTexteVersNombre(valeur) : valeur;
}

function estAVerifier(ligne: Ligne, convertirLesDates: boolean): boolean {
  const commande = valeurDe(ligne, 'date_commande');
  const dateDeCommande =
    convertirLesDates && typeof commande === 'string'
      ? dateval(commande)
      : commande;
  return (
    comparerCommeExcel(valeurDe(ligne, 'date_livraison'), dateDeCommande) < 0 ||
    comparerCommeExcel(valeurDe(ligne, 'quantite'), 0) <= 0 ||
    comparerCommeExcel(valeurDe(ligne, 'commercial_id'), '') === 0
  );
}

function valeursDeLActe1(jeu: JeuB301) {
  const brutes = ongletDe(jeu.brut, 'Commandes').lignes;
  const uniques = lignesUniques(brutes);
  const colonne = (lignes: readonly Ligne[], nom: string): Valeur[] =>
    lignes.map((ligne) => valeurDe(ligne, nom));
  const villes = colonne(uniques, 'ville');
  const lignesDeLaCommandeTemoin = brutes.filter(
    (ligne) => valeurDe(ligne, 'n_commande') === COMMANDE_TEMOIN,
  );
  return {
    attendues: {
      'b3-01-a1-lignes-commande': lignesDeLaCommandeTemoin.length,
      'b3-01-a1-lignes-uniques': uniques.length,
      'b3-01-a1-ca-total': euros(
        somme(colonne(uniques, 'ca_ht').map(montantDe)),
      ),
      'b3-01-a1-villes': distinctes(
        villes.map((ville) => nomPropre(supprEspace(String(ville)))),
      ),
      'b3-01-a1-a-verifier': uniques.filter((ligne) =>
        estAVerifier(ligne, false),
      ).length,
    },
    pieges: {
      'b3-01-a1-lignes-commande': {
        'commandes-comptees-pour-lignes': distinctes(
          colonne(lignesDeLaCommandeTemoin, 'n_commande'),
        ),
      },
      'b3-01-a1-lignes-uniques': {
        'doublons-supprimes-sur-une-colonne': distinctes(
          colonne(brutes, 'n_commande'),
        ),
      },
      'b3-01-a1-ca-total': {
        'texte-pris-pour-nombre': euros(somme(colonne(uniques, 'ca_ht'))),
      },
      'b3-01-a1-villes': { 'espaces-non-supprimes': distinctes(villes) },
      'b3-01-a1-a-verifier': {
        'suspect-corrige-sans-validation': uniques.filter((ligne) =>
          estAVerifier(ligne, true),
        ).length,
      },
    },
  };
}

function valeursDesActes2Et3(jeu: JeuB301) {
  const ventes = ventesDe(jeu);
  const indicateurs = indicateursParAgence(jeu);
  const de2026 = filtrer(ventes, en2026);
  const deRennes2026 = filtrer(de2026, deLAgence(RENNES));
  const informatiqueDeRennes = filtrer(
    ventes,
    deLAgence(RENNES),
    (vente) => vente.categorie === INFORMATIQUE,
  );
  const informatiqueDeRennes2026 = filtrer(informatiqueDeRennes, en2026);
  const deLOuest = (vente: Vente): boolean => vente.region === OUEST;
  const delaisDeStrasbourg = filtrer(de2026, deLAgence(STRASBOURG));
  const deMarseille2026 = filtrer(de2026, deLAgence(MARSEILLE));
  const trimestres = Object.entries(caParTrimestre(jeu)).sort(
    ([, a], [, b]) => b - a,
  );
  const sousLesObjectifs = (retenir: (mois: number) => boolean) =>
    Object.entries(indicateurs).filter(
      ([agence, { ca2026 }]) => ca2026 < objectifsDe(jeu, agence, retenir),
    ).length;
  const toutesLesLignesDObjectif = (): boolean => true;
  const caJusquASeptembre2025 = caDe(filtrer(ventes, jusquASeptembre2025));
  return {
    attendues: {
      'b3-01-a2-ca-rennes-info': euros(caDe(informatiqueDeRennes2026)),
      'b3-01-a2-remises-marseille': filtrer(
        ventes,
        deLAgence(MARSEILLE),
        (vente) => vente.remise > SEUIL_DE_REMISE,
      ).length,
      'b3-01-a2-ca-ouest': euros(caDe(filtrer(de2026, deLOuest))),
      'b3-01-a2-delai-strasbourg': mediane(delaisDeStrasbourg.map(delaiOuvre)),
      'b3-01-a2-retards': filtrer(
        de2026,
        (vente) => vente.livraison > serieJourOuvre(vente.date, DELAI_PROMIS),
      ).length,
      'b3-01-a2-taux-marge': pourcent(tauxDeMarque(de2026)),
      'b3-01-a2-part-info-rennes': pourcent(
        caDe(informatiqueDeRennes2026) / caDe(deRennes2026),
      ),
      'b3-01-a2-meilleur-trimestre': trimestres[0][0],
      'b3-01-a3-agences-sous-objectif': sousLesObjectifs(moisDe2026),
      'b3-01-a3-atteinte-rennes': pourcent(indicateurs[RENNES].atteinte),
      'b3-01-a3-ca-2026': euros(caDe(de2026)),
      'b3-01-a3-evolution': pourcent(caDe(de2026) / caJusquASeptembre2025 - 1),
      'b3-01-a3-marge-marseille': pourcent(tauxDeMarque(deMarseille2026)),
      'b3-01-a3-quarantaine': ongletDe(jeu.reprise1, 'Quarantaine').lignes
        .length,
    },
    pieges: {
      'b3-01-a2-ca-rennes-info': {
        'critere-mal-ecrit': euros(
          caDe(
            filtrer(
              informatiqueDeRennes,
              (vente) =>
                comparerCommeExcel(
                  vente.date,
                  CRITERE_DE_DATE_SANS_ESPERLUETTE,
                ) >= 0,
            ),
          ),
        ),
        'periode-mal-delimitee': euros(caDe(informatiqueDeRennes)),
      },
      'b3-01-a2-remises-marseille': {
        'critere-mal-ecrit': filtrer(
          ventes,
          deLAgence(MARSEILLE),
          (vente) => vente.remise > REMISE_ECRITE_EN_POINTS,
        ).length,
      },
      'b3-01-a2-ca-ouest': {
        'plage-recherche-non-figee': euros(
          caDe(filtrer(regionsTrouveesSansFigerLaTable(jeu), deLOuest, en2026)),
        ),
        'periode-mal-delimitee': euros(caDe(filtrer(ventes, deLOuest))),
      },
      'b3-01-a2-delai-strasbourg': {
        'jours-calendaires-pour-ouvres': mediane(
          delaisDeStrasbourg.map((vente) => vente.livraison - vente.date),
        ),
        'valeur-extreme-ignoree': arrondi(
          moyenne(delaisDeStrasbourg.map(delaiOuvre)),
          0,
        ),
      },
      'b3-01-a2-retards': {
        'jours-calendaires-pour-ouvres': filtrer(
          de2026,
          (vente) => vente.livraison > vente.date + DELAI_PROMIS,
        ).length,
      },
      'b3-01-a2-taux-marge': {
        'moyenne-simple-des-taux': pourcent(moyenneDesTaux(de2026)),
        'marque-confondue-avec-marge': pourcent(tauxDeMarge(de2026)),
      },
      'b3-01-a2-part-info-rennes': {
        'pourcentage-du-mauvais-total': pourcent(
          caDe(informatiqueDeRennes2026) / caDe(de2026),
        ),
      },
      'b3-01-a3-agences-sous-objectif': {
        'objectif-annuel-pour-cumul': sousLesObjectifs(
          toutesLesLignesDObjectif,
        ),
      },
      'b3-01-a3-atteinte-rennes': {
        'objectif-annuel-pour-cumul': pourcent(
          indicateurs[RENNES].ca2026 /
            objectifsDe(jeu, RENNES, toutesLesLignesDObjectif),
        ),
      },
      'b3-01-a3-ca-2026': { 'periode-mal-delimitee': euros(caDe(ventes)) },
      'b3-01-a3-evolution': {
        'evolution-sur-annee-pleine': pourcent(
          caDe(de2026) / caDe(filtrer(ventes, en2025)) - 1,
        ),
      },
      'b3-01-a3-marge-marseille': {
        'moyenne-simple-des-taux': pourcent(moyenneDesTaux(deMarseille2026)),
        'marque-confondue-avec-marge': pourcent(tauxDeMarge(deMarseille2026)),
      },
      'b3-01-a3-quarantaine': {
        'suppression-au-lieu-de-signalement':
          LIGNES_LAISSEES_EN_QUARANTAINE_PAR_UNE_SUPPRESSION,
      },
    },
  };
}

function histoiresDe(jeu: JeuB301): Readonly<Record<HistoireB301, number>> {
  const ventes = ventesDe(jeu);
  const indicateurs = indicateursParAgence(jeu);
  const informatiqueDeRennes = filtrer(
    ventes,
    deLAgence(RENNES),
    (vente) => vente.categorie === INFORMATIQUE,
  );
  return {
    'ca-2025-rennes': arrondi(indicateurs[RENNES].ca2025, -2),
    'ca-2025-nantes': arrondi(indicateurs[NANTES].ca2025, -2),
    'taux-de-marge-marseille-2025': pourcent(
      indicateurs[MARSEILLE].tauxDeMarque2025,
    ),
    'evolution-informatique-rennes': pourcent(
      caDe(filtrer(informatiqueDeRennes, en2026)) /
        caDe(filtrer(informatiqueDeRennes, jusquASeptembre2025)) -
        1,
    ),
    'evolution-lille': pourcent(indicateurs[LILLE].evolution),
    'delai-median-strasbourg-2025': mediane(
      filtrer(ventes, deLAgence(STRASBOURG), en2025).map(delaiOuvre),
    ),
    'delai-median-reseau-2026': mediane(
      filtrer(ventes, en2026, (vente) => vente.agence !== STRASBOURG).map(
        delaiOuvre,
      ),
    ),
  };
}

export function calculerValeursB301(jeu: JeuB301): {
  readonly attendues: ValeursAttenduesB301;
  readonly pieges: PiegesB301;
  readonly histoires: Readonly<Record<HistoireB301, number>>;
} {
  const acte1 = valeursDeLActe1(jeu);
  const actes2Et3 = valeursDesActes2Et3(jeu);
  return {
    attendues: { ...acte1.attendues, ...actes2Et3.attendues },
    pieges: { ...acte1.pieges, ...actes2Et3.pieges },
    histoires: histoiresDe(jeu),
  };
}
