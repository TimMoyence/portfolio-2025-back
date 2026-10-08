import {
  arrondi,
  dateExcel,
  dateval,
  estJourOuvre,
  mediane,
  nbJoursOuvres,
  nomPropre,
  partiesDeDate,
  supprEspace,
} from '../../../../../test/helpers/cours-b3-01/excel';
import {
  lignesDesValeursAttendues,
  lireConception,
} from '../../../../../test/helpers/conception-de-cours';
import {
  ANOMALIES_SEMEES,
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

const commandesSaines = ongletDe(jeu.reprise1, 'Commandes').lignes;
const categories = new Map(
  ongletDe(jeu.reprise1, 'Produits').lignes.map((produit) => [
    texteDe(produit, 'produit_id'),
    texteDe(produit, 'categorie'),
  ]),
);
const periodeDe = (ligne: Ligne) =>
  partiesDeDate(nombreDe(ligne, 'date_commande'));
const categorieDe = (ligne: Ligne): string =>
  categories.get(texteDe(ligne, 'produit_id')) ?? '';
const delaiOuvreDe = (ligne: Ligne): number =>
  nbJoursOuvres(
    nombreDe(ligne, 'date_commande'),
    nombreDe(ligne, 'date_livraison'),
  ) - 1;
const lignesDe = (agence: string, annee: number): Ligne[] =>
  commandesSaines.filter(
    (ligne) =>
      texteDe(ligne, 'agence_id') === agence &&
      periodeDe(ligne).annee === annee &&
      periodeDe(ligne).mois <= 9,
  );
const distinctesCommeExcel = (textes: readonly string[]): number =>
  new Set(textes.map((texte) => texte.toLocaleUpperCase('fr'))).size;
const sansCode = (cellule: string): string => cellule.replaceAll('`', '');
const valeurDuDocument = (cellule: string): number | string => {
  const nombre = Number(
    cellule.replaceAll(/\s/gu, '').replace(',', '.').replace('−', '-'),
  );
  return Number.isNaN(nombre) ? cellule : nombre;
};

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

  it('ne doit l’écart des villes brutes qu’aux espaces, le comptage d’Excel ignorant la casse', () => {
    const villes = lignesUniques.map((ligne) => texteDe(ligne, 'ville'));
    const piege = PIEGES_B3_01['b3-01-a1-villes']['espaces-non-supprimes'];

    expect(distinctesCommeExcel(villes)).toBe(piege);
    expect(distinctesCommeExcel(villes.map(nomPropre))).toBe(piege);
    expect(distinctesCommeExcel(villes.map(supprEspace))).toBe(
      VALEURS_B3_01['b3-01-a1-villes'],
    );
  });

  it('porte au brut les deux cellules que cite l’exemple A1-12 : E783 entourée d’espaces, L2971 en texte', () => {
    const aLaLigne = (rang: number): Ligne => commandesBrutes[rang - 2];

    expect(valeurDe(aLaLigne(783), 'ville')).toBe(' Bordeaux ');
    expect(valeurDe(aLaLigne(2971), 'ca_ht')).toBe('1 150,00 €');
  });

  it('porte au brut la date que citent A1-13 et A1-14 : B3785 « 08/04/26 », commande C-11481, en ligne 3741 de la copie dédoublonnée, lue le 8 avril par DATEVAL, livrée le 7 août 2026', () => {
    const ligne = commandesBrutes[3785 - 2];

    expect(valeurDe(ligne, 'n_commande')).toBe('C-11481');
    expect(lignesUniques.indexOf(ligne) + 2).toBe(3741);
    expect(valeurDe(ligne, 'date_commande')).toBe('08/04/26');
    expect(dateval('08/04/26')).toBe(dateExcel(2026, 4, 8));
    expect(valeurDe(ligne, 'date_livraison')).toBe(dateExcel(2026, 8, 7));
  });

  it('porte au brut la date ISO que cite A1-11 : B2884 « 2026-03-17 », commande C-11121, lue le 17 mars par DATEVAL', () => {
    const ligne = commandesBrutes[2884 - 2];

    expect(valeurDe(ligne, 'n_commande')).toBe('C-11121');
    expect(valeurDe(ligne, 'date_commande')).toBe('2026-03-17');
    expect(dateval('2026-03-17')).toBe(dateExcel(2026, 3, 17));
  });

  it('ne donne 10 caractères qu’aux dates ISO : =SI(NBCAR(B2)=10;DATEVAL(B2);B2) laisse en texte les dates d’un autre système', () => {
    const dates = commandesBrutes.map((ligne) =>
      valeurDe(ligne, 'date_commande'),
    );
    const isoDe = (date: unknown): boolean =>
      typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/u.test(date);

    expect(
      dates.filter((date) => String(date).length === 10 && !isoDe(date)),
    ).toEqual([]);
    expect(dates.filter(isoDe).length).toBeGreaterThanOrEqual(
      ANOMALIES_SEMEES.F5,
    );
    expect(
      dates.filter((date) => typeof date === 'string' && !isoDe(date)).length,
    ).toBeGreaterThanOrEqual(ANOMALIES_SEMEES.S1);
  });

  it('ne laisse trouver sans $ qu’une ligne de l’Ouest, commandée en 2025', () => {
    const agences = ongletDe(jeu.reprise1, 'Agences').lignes;
    const rangs = agences.map((agence) => texteDe(agence, 'agence_id'));
    const ouest = new Set(
      agences
        .filter((agence) => texteDe(agence, 'region') === 'Ouest')
        .map((agence) => texteDe(agence, 'agence_id')),
    );
    const trouveesDansLOuest = commandesSaines.filter(
      (ligne, rang) =>
        rangs.indexOf(texteDe(ligne, 'agence_id')) >= rang &&
        ouest.has(texteDe(ligne, 'agence_id')),
    );

    expect(trouveesDansLOuest.map((ligne) => periodeDe(ligne).annee)).toEqual([
      2025,
    ]);
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

    it('fait chuter le taux de marque de Marseille plus que partout ailleurs, au-dessus de son objectif', () => {
      expect(
        extreme(
          (a) =>
            indicateurs[a].tauxDeMarque2026 - indicateurs[a].tauxDeMarque2025,
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

    it('fait croître Lille dans chacune de ses catégories, pas sur une seule', () => {
      const caParCategorie = (annee: number): Record<string, number> => {
        const totaux: Record<string, number> = {};
        for (const ligne of lignesDe('AG01', annee)) {
          totaux[categorieDe(ligne)] =
            (totaux[categorieDe(ligne)] ?? 0) + nombreDe(ligne, 'ca_ht');
        }
        return totaux;
      };
      const avant = caParCategorie(2025);
      const apres = caParCategorie(2026);

      expect(new Set(Object.keys(apres))).toEqual(new Set(Object.keys(avant)));
      for (const categorie of Object.keys(avant)) {
        expect(apres[categorie] / avant[categorie]).toBeGreaterThan(1.1);
      }
    });

    it('fait décrocher Strasbourg en mars 2026 dans toutes ses catégories, ruptures d’avril à juillet livrées environ deux mois plus tard', () => {
      const de2026 = lignesDe('AG12', 2026);
      const medianeDe = (lignes: readonly Ligne[]): number =>
        mediane(lignes.map(delaiOuvreDe));
      const depuisMars = de2026.filter((ligne) => periodeDe(ligne).mois >= 3);
      const ruptures = de2026.filter((ligne) => delaiOuvreDe(ligne) > 30);

      expect(
        medianeDe(de2026.filter((ligne) => periodeDe(ligne).mois < 3)),
      ).toBeLessThanOrEqual(5);
      for (const categorie of new Set(depuisMars.map(categorieDe))) {
        expect(
          medianeDe(
            depuisMars.filter((ligne) => categorieDe(ligne) === categorie),
          ),
        ).toBeGreaterThanOrEqual(6);
      }
      expect(new Set(ruptures.map((ligne) => periodeDe(ligne).mois))).toEqual(
        new Set([4, 5, 6, 7]),
      );
      for (const ligne of ruptures) {
        const joursCalendaires =
          nombreDe(ligne, 'date_livraison') - nombreDe(ligne, 'date_commande');
        expect(joursCalendaires).toBeGreaterThanOrEqual(50);
        expect(joursCalendaires).toBeLessThanOrEqual(75);
      }
    });
  });

  it('détache le meilleur trimestre du deuxième d’au moins 2 %', () => {
    const [premier, deuxieme] = Object.values(caParTrimestre(jeu)).sort(
      (a, b) => b - a,
    );
    expect(premier / deuxieme).toBeGreaterThan(1.02);
  });

  describe('pièges du vote sur le meilleur trimestre', () => {
    const ECART_MINIMAL_D_UN_PIEGE = 1.01;

    function classement(
      ca: Readonly<Record<string, number>>,
    ): readonly (readonly [string, number])[] {
      return Object.entries(ca).sort(([, a], [, b]) => b - a);
    }

    it('met le T2 2026 en tête quand le filtre annee reste sur 2026', () => {
      const [[premier, caPremier], [, caDeuxieme]] = classement(
        Object.fromEntries(
          Object.entries(caParTrimestre(jeu)).filter(([trimestre]) =>
            trimestre.endsWith(' 2026'),
          ),
        ),
      );

      expect(premier).toBe('T2 2026');
      expect(caPremier / caDeuxieme).toBeGreaterThan(ECART_MINIMAL_D_UN_PIEGE);
    });

    it('met le deuxième trimestre en tête quand les trimestres sont groupés sans les années', () => {
      const sansLesAnnees: Record<string, number> = {};
      for (const [trimestre, ca] of Object.entries(caParTrimestre(jeu))) {
        const seul = trimestre.split(' ')[0];
        sansLesAnnees[seul] = (sansLesAnnees[seul] ?? 0) + ca;
      }
      const [[premier, caPremier], [, caDeuxieme]] = classement(sansLesAnnees);

      expect(premier).toBe('T2');
      expect(caPremier / caDeuxieme).toBeGreaterThan(ECART_MINIMAL_D_UN_PIEGE);
    });
  });

  it('recalcule les valeurs attendues, les pièges et les histoires à partir de la seule graine', () => {
    expect(calculerValeursB301(jeu)).toEqual({
      attendues: VALEURS_B3_01,
      pieges: PIEGES_B3_01,
      histoires: HISTOIRES_B3_01,
    });
  });

  it('reporte au § 5.1 de la conception chaque valeur attendue et chaque piège, à sa valeur', () => {
    const lignes = lignesDesValeursAttendues(
      lireConception('cours-b3-01-conception.md'),
    );
    const valeurs = lignes
      .filter((cellules) => cellules.length === 3)
      .map(([question, , valeur]) => [
        sansCode(question),
        valeurDuDocument(valeur),
      ]);
    const pieges = lignes
      .filter((cellules) => cellules.length === 4)
      .map(([question, confusion, , valeur]) => [
        `${sansCode(question)} › ${sansCode(confusion)}`,
        valeurDuDocument(valeur),
      ]);

    expect(Object.fromEntries(valeurs)).toEqual(VALEURS_B3_01);
    expect(pieges).toHaveLength(
      Object.values(PIEGES_B3_01).flatMap((parConfusion) =>
        Object.keys(parConfusion),
      ).length,
    );
    expect(Object.fromEntries(pieges)).toEqual(
      Object.fromEntries(
        Object.entries(PIEGES_B3_01).flatMap(([question, parConfusion]) =>
          Object.entries(parConfusion).map(([confusion, piege]) => [
            `${question} › ${confusion}`,
            piege,
          ]),
        ),
      ),
    );
  });

  it.each(QUESTIONS_CHIFFREES_B3_01)(
    'donne à %s au moins un piège, écarté de la bonne réponse de plus que la tolérance',
    (question) => {
      const pieges = Object.values(PIEGES_B3_01[question] ?? {});
      expect(pieges.length).toBeGreaterThan(0);
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
