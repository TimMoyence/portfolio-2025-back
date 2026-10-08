import {
  arrondi,
  dateExcel,
  estJourOuvre,
  nomPropre,
  supprEspace,
} from '../../../../../test/helpers/cours-b3-01/excel';
import {
  GRAINE_B3_01,
  genererJeuB301,
} from '../../../../../test/helpers/cours-b3-01/generateur';
import {
  nombreDe,
  ongletDe,
  texteDe,
  valeurDe,
  type Ligne,
} from '../../../../../test/helpers/cours-b3-01/modele';
import {
  caParTrimestre,
  calculerValeursB301,
  indicateursParAgence,
} from '../../../../../test/helpers/cours-b3-01/valeurs';
import {
  HISTOIRES_B3_01,
  PIEGES_B3_01,
  QUESTIONS_CHIFFREES_B3_01,
  TOLERANCES_B3_01,
  VALEURS_B3_01,
} from './b3-01.donnees';

const jeu = genererJeuB301(GRAINE_B3_01);
const commandesBrutes = ongletDe(jeu.brut, 'Commandes').lignes;
const prixCatalogue = new Map(
  ongletDe(jeu.brut, 'Produits').lignes.map((produit) => [
    texteDe(produit, 'produit_id'),
    nombreDe(produit, 'prix_catalogue_ht'),
  ]),
);

const cleDeLigne = (ligne: Ligne): string =>
  JSON.stringify(Object.values(ligne));
const occurrences = new Map<string, number>();
const lignesUniques: Ligne[] = [];
for (const ligne of commandesBrutes) {
  const cle = cleDeLigne(ligne);
  if (!occurrences.has(cle)) {
    lignesUniques.push(ligne);
  }
  occurrences.set(cle, (occurrences.get(cle) ?? 0) + 1);
}

function nombresOuNull(ligne: Ligne, colonnes: readonly string[]) {
  const valeurs = colonnes.map((colonne) => valeurDe(ligne, colonne));
  return valeurs.every((valeur) => typeof valeur === 'number') ? valeurs : null;
}

const DETECTEURS: Readonly<Record<string, (ligne: Ligne) => boolean>> = {
  F1: (ligne) => {
    const ville = valeurDe(ligne, 'ville');
    return typeof ville === 'string' && ville !== nomPropre(supprEspace(ville));
  },
  F2: (ligne) => typeof valeurDe(ligne, 'ca_ht') === 'string',
  F4: (ligne) => {
    const nombres = nombresOuNull(ligne, [
      'quantite',
      'prix_unitaire_ht',
      'remise',
      'ca_ht',
    ]);
    if (nombres === null) {
      return false;
    }
    const [quantite, prix, remise, ca] = nombres;
    return Math.abs(ca - arrondi(quantite * prix * (1 - remise), 2)) > 1;
  },
  F5: (ligne) =>
    /^\d{4}-\d{2}-\d{2}$/.test(String(valeurDe(ligne, 'date_commande'))),
  H1: (ligne) => !prixCatalogue.has(texteDe(ligne, 'produit_id')),
  H2: (ligne) => {
    const dates = nombresOuNull(ligne, ['date_commande', 'date_livraison']);
    return dates !== null && dates[1] < dates[0];
  },
  H3: (ligne) => valeurDe(ligne, 'commercial_id') === null,
  S1: (ligne) =>
    /^\d{2}\/\d{2}\/\d{2}$/.test(String(valeurDe(ligne, 'date_commande'))),
  S2: (ligne) => nombreDe(ligne, 'quantite') < 0,
  S3: (ligne) => {
    const prix = prixCatalogue.get(texteDe(ligne, 'produit_id'));
    return (
      prix !== undefined &&
      valeurDe(ligne, 'prix_unitaire_ht') === arrondi(10 * prix, 2)
    );
  },
};

const anomaliesDe = (ligne: Ligne): string[] =>
  Object.keys(DETECTEURS).filter((code) => DETECTEURS[code](ligne));

const PREMIER_JOUR = dateExcel(2025, 1, 2);
const DERNIER_JOUR = dateExcel(2026, 9, 30);

describe('jeu Norvane du B3-01', () => {
  it('reproduit le même jeu à partir de la même graine', () => {
    expect(genererJeuB301(GRAINE_B3_01)).toEqual(jeu);
  });

  it('range les onglets et les colonnes du classeur brut comme le § 4.2', () => {
    const colonnes = Object.fromEntries(
      Object.entries(jeu.brut).map(([nom, onglet]) => [
        nom,
        onglet.colonnes.map((colonne) => colonne.nom),
      ]),
    );
    expect(colonnes).toEqual({
      Commandes: [
        'n_commande',
        'date_commande',
        'date_livraison',
        'client_id',
        'ville',
        'agence_id',
        'commercial_id',
        'produit_id',
        'quantite',
        'prix_unitaire_ht',
        'remise',
        'ca_ht',
        'facturee',
      ],
      Clients: [
        'client_id',
        'raison_sociale',
        'ville',
        'secteur',
        'date_premiere_commande',
      ],
      Produits: [
        'produit_id',
        'libelle',
        'categorie',
        'prix_catalogue_ht',
        'cout_unitaire',
      ],
      Agences: ['agence_id', 'ville', 'region', 'responsable'],
      Objectifs: ['agence_id', 'mois', 'objectif_ca_ht'],
    });
  });

  it('compte 600 clients, 40 produits, 12 agences, 252 objectifs et environ 4 000 lignes', () => {
    expect(ongletDe(jeu.brut, 'Clients').lignes).toHaveLength(600);
    expect(ongletDe(jeu.brut, 'Produits').lignes).toHaveLength(40);
    expect(ongletDe(jeu.brut, 'Agences').lignes).toHaveLength(12);
    expect(ongletDe(jeu.brut, 'Objectifs').lignes).toHaveLength(252);
    expect(commandesBrutes.length).toBeGreaterThanOrEqual(3800);
    expect(commandesBrutes.length).toBeLessThanOrEqual(4200);
  });

  it.each([
    ['F1', 310],
    ['F2', 180],
    ['F4', 24],
    ['F5', 40],
    ['H1', 9],
    ['H2', 14],
    ['H3', 11],
    ['S1', 12],
    ['S2', 8],
    ['S3', 6],
  ])('sème l’anomalie %s sur %d lignes', (code, lignes) => {
    expect(
      lignesUniques.filter((ligne) => DETECTEURS[code](ligne)),
    ).toHaveLength(lignes);
  });

  it('exporte 46 lignes deux fois, sans autre anomalie sur les lignes doublonnées', () => {
    const doublonnees = lignesUniques.filter(
      (ligne) => occurrences.get(cleDeLigne(ligne)) === 2,
    );
    expect(commandesBrutes.length - lignesUniques.length).toBe(46);
    expect(doublonnees).toHaveLength(46);
    expect(doublonnees.filter((ligne) => anomaliesDe(ligne).length)).toEqual(
      [],
    );
  });

  it('sème au plus une anomalie par ligne, 660 lignes touchées en tout', () => {
    expect(
      lignesUniques.filter((ligne) => anomaliesDe(ligne).length > 1),
    ).toEqual([]);
    const touchees = lignesUniques.filter(
      (ligne) => anomaliesDe(ligne).length === 1,
    ).length;
    expect(touchees + 46).toBe(660);
    expect((touchees + 46) / lignesUniques.length).toBeGreaterThan(0.13);
    expect((touchees + 46) / lignesUniques.length).toBeLessThan(0.18);
  });

  it('ne date les commandes saines que des jours ouvrés du 2 janvier 2025 au 30 septembre 2026', () => {
    const dates = ongletDe(jeu.reprise1, 'Commandes').lignes.map((ligne) =>
      nombreDe(ligne, 'date_commande'),
    );
    expect(dates.filter((date) => !estJourOuvre(date))).toEqual([]);
    expect(Math.min(...dates)).toBe(PREMIER_JOUR);
    expect(Math.max(...dates)).toBeLessThanOrEqual(DERNIER_JOUR);
  });

  it('tient la commande C-10234, le contrôle à 85 lignes et la quarantaine à 60 lignes', () => {
    expect(
      commandesBrutes.filter(
        (ligne) => valeurDe(ligne, 'n_commande') === 'C-10234',
      ),
    ).toHaveLength(3);
    expect(VALEURS_B3_01['b3-01-a1-lignes-commande']).toBe(3);
    expect(VALEURS_B3_01['b3-01-a1-a-verifier']).toBe(85);
    expect(VALEURS_B3_01['b3-01-a3-quarantaine']).toBe(60);
  });

  it('sème quatre paires de clients en double et deux Dupont distincts à Bordeaux', () => {
    const clients = ongletDe(jeu.brut, 'Clients').lignes;
    const parNomEtVille = new Map<string, number>();
    for (const client of clients) {
      const cle = `${texteDe(client, 'raison_sociale')}|${texteDe(client, 'ville')}`;
      parNomEtVille.set(cle, (parNomEtVille.get(cle) ?? 0) + 1);
    }
    expect([...parNomEtVille.values()].filter((n) => n === 2)).toHaveLength(4);
    expect([...parNomEtVille.values()].filter((n) => n > 2)).toEqual([]);
    const dupont = clients.filter(
      (client) =>
        texteDe(client, 'raison_sociale').startsWith('Dupont') &&
        texteDe(client, 'ville') === 'Bordeaux',
    );
    expect(
      new Set(dupont.map((client) => texteDe(client, 'raison_sociale'))).size,
    ).toBe(2);
  });

  it('écrit des villes que NOMPROPRE et SUPPRESPACE laissent intactes', () => {
    const villes = new Set(
      ongletDe(jeu.reprise1, 'Commandes').lignes.map((ligne) =>
        texteDe(ligne, 'ville'),
      ),
    );
    expect(villes.size).toBe(VALEURS_B3_01['b3-01-a1-villes']);
    for (const ville of villes) {
      expect(nomPropre(supprEspace(ville.toLocaleUpperCase('fr')))).toBe(ville);
    }
  });

  describe('les quatre histoires du § 4.4', () => {
    const indicateurs = indicateursParAgence(jeu);
    const agences = Object.keys(indicateurs);
    const extreme = (
      lire: (agence: string) => number,
      sens: 'max' | 'min',
    ): string =>
      [...agences].sort((a, b) =>
        sens === 'max' ? lire(b) - lire(a) : lire(a) - lire(b),
      )[0];

    it('met Rennes au plus bas taux d’atteinte et Lille à la plus forte évolution', () => {
      expect(extreme((a) => indicateurs[a].atteinte, 'min')).toBe('AG06');
      expect(extreme((a) => indicateurs[a].evolution, 'max')).toBe('AG01');
    });

    it('fait chuter le taux de marge de Marseille plus que partout ailleurs, au-dessus de son objectif', () => {
      expect(
        extreme(
          (a) =>
            indicateurs[a].tauxDeMarge2026 - indicateurs[a].tauxDeMarge2025,
          'min',
        ),
      ).toBe('AG09');
      expect(indicateurs.AG09.atteinte).toBeGreaterThan(1);
    });

    it('donne à Strasbourg le délai médian le plus long en 2026', () => {
      expect(extreme((a) => indicateurs[a].delaiMedian2026, 'max')).toBe(
        'AG12',
      );
    });

    it('laisse entre deux et cinq agences sous l’objectif', () => {
      const sousObjectif = agences.filter((a) => indicateurs[a].atteinte < 1);
      expect(sousObjectif.length).toBeGreaterThanOrEqual(2);
      expect(sousObjectif.length).toBeLessThanOrEqual(5);
    });

    it('donne à Nantes en 2025 entre 1,05 et 1,3 fois le CA de Rennes', () => {
      const rapport = indicateurs.AG05.ca2025 / indicateurs.AG06.ca2025;
      expect(rapport).toBeGreaterThan(1.05);
      expect(rapport).toBeLessThan(1.3);
    });

    it('fait baisser l’informatique de Rennes de 30 à 50 %', () => {
      expect(HISTOIRES_B3_01['evolution-informatique-rennes']).toBeLessThan(
        -30,
      );
      expect(HISTOIRES_B3_01['evolution-informatique-rennes']).toBeGreaterThan(
        -50,
      );
    });
  });

  it('détache le meilleur trimestre du deuxième d’au moins 2 %', () => {
    const [premier, deuxieme] = Object.values(caParTrimestre(jeu)).sort(
      (a, b) => b - a,
    );
    expect(premier / deuxieme).toBeGreaterThan(1.02);
  });

  it('recalcule les valeurs attendues, les pièges et les histoires à partir de la seule graine', () => {
    expect(calculerValeursB301(jeu)).toEqual({
      attendues: VALEURS_B3_01,
      pieges: PIEGES_B3_01,
      histoires: HISTOIRES_B3_01,
    });
  });

  it.each(QUESTIONS_CHIFFREES_B3_01)(
    'écarte chaque piège de %s de la bonne réponse de plus que la tolérance',
    (question) => {
      const pieges = Object.values(PIEGES_B3_01[question] ?? {});
      for (const piege of pieges) {
        expect(Math.abs(piege - VALEURS_B3_01[question])).toBeGreaterThan(
          TOLERANCES_B3_01[question],
        );
      }
      expect(new Set(pieges).size).toBe(pieges.length);
    },
  );

  it('écarte la moyenne des délais de Strasbourg de la médiane d’au moins un jour', () => {
    expect(
      Math.abs(
        (PIEGES_B3_01['b3-01-a2-delai-strasbourg']?.[
          'valeur-extreme-ignoree'
        ] ?? 0) - VALEURS_B3_01['b3-01-a2-delai-strasbourg'],
      ),
    ).toBeGreaterThanOrEqual(1);
  });
});
