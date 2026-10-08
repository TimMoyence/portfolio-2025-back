import { buildCoursDuContenu } from '../../../../../test/factories/contenus-de-cours.factory';
import {
  lireConception,
  piecesJointesDuDocument,
} from '../../../../../test/helpers/conception-de-cours';
import * as fiche from '../../../../../test/helpers/fiche-de-cours';
import * as feuille from '../../../../../test/helpers/feuille-de-cours';
import {
  formulesAltereesALaPublication,
  valeursAuCatalogue,
  valeursDevoileesAvantLeurEcran,
  valeursDevoileesParLesExplications,
} from '../../../../../test/helpers/relecture-de-cours';
import { questionsDuCours } from '../../domain/cours/Cours';
import { tirer } from '../../domain/cours/Tirage';
import { COURS_B3_01 } from './b3-01.cours';
import {
  CLASSEURS_B3_01,
  HISTOIRES_B3_01,
  PIEGES_B3_01,
  QUESTIONS_CHIFFREES_B3_01,
  TOLERANCES_B3_01,
  VALEURS_B3_01,
} from './b3-01.donnees';

const COURS = buildCoursDuContenu(COURS_B3_01);
const DOCUMENT = lireConception('cours-b3-01-conception.md');
const VALEURS: Readonly<Record<string, number | string>> = Object.fromEntries(
  Object.entries(VALEURS_B3_01),
);
const SEUIL_D_UNE_VALEUR_RECONNAISSABLE = 10;
const UNITES_ARRONDIES = new Set(['€', '%']);
const ESPACES_TYPOGRAPHIQUES = /[\u{A0}\u{202F}]/gu;

interface NumeriqueStockee {
  readonly id: string;
  readonly enonce: string;
  readonly unite: string | null;
}

function numeriquesStockees(): NumeriqueStockee[] {
  return COURS_B3_01.ecrans.flatMap(({ proprietes }) =>
    'questions' in proprietes
      ? proprietes.questions.flatMap((question) =>
          question.type === 'numeric' ? [question] : [],
        )
      : [],
  );
}

function valeursReconnaissables(): (number | string)[] {
  return Object.values(VALEURS).filter(
    (valeur) =>
      typeof valeur === 'string' ||
      valeur >= SEUIL_D_UNE_VALEUR_RECONNAISSABLE ||
      !Number.isInteger(valeur),
  );
}

function texteDe(screenId: string): string {
  return feuille
    .texteDeLEcran(COURS_B3_01, screenId)
    .replaceAll(ESPACES_TYPOGRAPHIQUES, ' ');
}

function questionsDe(screenId: string) {
  const { proprietes } = fiche.ecranDuContenu(COURS_B3_01, screenId);
  return 'questions' in proprietes ? proprietes.questions : [];
}

function libellesDuVote(id: string): string[] {
  return Object.values(tirer(COURS, 0).libellesOptions[id]);
}

function explicationsDe(screenId: string): string[] {
  const ecran = COURS.ecrans.find((candidat) => candidat.id === screenId);
  return (ecran?.correctionSurPlace?.explications ?? []).map((explication) =>
    explication.texte.replaceAll(ESPACES_TYPOGRAPHIQUES, ' '),
  );
}

fiche.decrireLaFicheDuCours('B3-01', COURS, {
  conception: 'cours-b3-01-conception.md',
  ecrans: 40,
  dureeMinutes: 180,
  minutesParActe: [56, 60, 64, 0, 0, 0],
  rythme: { expositionContinueMax: 6, interactives: 142, exposition: 38 },
  ateliersNotes: [
    'A1-07 (4)',
    'A1-08 (4)',
    'A1-13 (5)',
    'A1-14 (12)',
    'A2-04 (10)',
    'A2-07 (10)',
    'A2-11 (14)',
    'A3-04 (4)',
    'A3-05 (8)',
    'A3-09 (15)',
  ],
  noteesParType: [4, 18, 3, 0, 0],
  enigmes: 0,
  rappels: 0,
  remediations: 26,
  options: 12,
  catalogue: [
    'A1-02',
    'A1-03',
    'A1-05',
    'A1-06',
    'A1-10',
    'A1-11',
    'A2-02',
    'A2-03',
    'A2-06',
    'A2-09',
    'A3-01',
    'A3-03',
    'A3-07',
    'A3-11',
  ],
  gabarit: 'b3',
  corrigesSurPlace: [
    'B3-01-A1-07-TRI-COLONNES',
    'B3-01-A1-08-ATELIER-GRANULARITE',
    'B3-01-A1-13-TRI-ANOMALIES',
    'B3-01-A1-14-ATELIER-NETTOYAGE',
    'B3-01-A2-04-ATELIER-RECHERCHE',
    'B3-01-A2-07-ATELIER-DELAIS-MARGE',
    'B3-01-A2-11-ATELIER-TCD',
    'B3-01-A3-04-TRI-GRAPHIQUES',
    'B3-01-A3-05-ATELIER-GRAPHIQUES',
    'B3-01-A3-09-ATELIER-DASHBOARD',
    'B3-01-A3-10-RECOMMANDATIONS',
  ],
});

describe('B3-01 — valeurs servies face au jeu Norvane', () => {
  it('sert les dix-huit valeurs attendues et leurs pièges, dans l’ordre du § 5.1', () => {
    fiche.attendreLesNumeriques(
      COURS,
      Object.fromEntries(
        QUESTIONS_CHIFFREES_B3_01.map((id) => [
          id,
          [VALEURS_B3_01[id], ...Object.values(PIEGES_B3_01[id])],
        ]),
      ),
    );
  });

  it('tolère l’euro près pour un montant, le dixième de point pour un taux, rien pour un comptage', () => {
    expect(
      Object.fromEntries(
        questionsDuCours(COURS).flatMap((question) =>
          question.type === 'numeric'
            ? [[question.id, question.tolerance]]
            : [],
        ),
      ),
    ).toEqual(
      Object.fromEntries(
        QUESTIONS_CHIFFREES_B3_01.map((id) => [
          id,
          { type: 'absolue', valeur: TOLERANCES_B3_01[id] },
        ]),
      ),
    );
  });

  it('fait voter le meilleur trimestre sur le trimestre du jeu', () => {
    const id = 'b3-01-a2-meilleur-trimestre';
    const { solutions, libellesOptions } = tirer(COURS, 0);

    expect(libellesOptions[id][String(solutions[id].valeur)]).toBe(
      VALEURS_B3_01[id],
    );
  });

  it('montre au graphique trompeur le CA 2025 de Rennes et de Nantes, sur un axe tronqué', () => {
    const { labels, series, axisRanges } = feuille.proprietesV2(
      COURS_B3_01,
      'B3-01-A3-01-GRAPHIQUE-TROMPEUR',
    );
    const rennes = HISTOIRES_B3_01['ca-2025-rennes'];

    expect(labels).toEqual(['Rennes', 'Nantes']);
    expect(series).toMatchObject([
      { values: [rennes, HISTOIRES_B3_01['ca-2025-nantes']] },
    ]);
    expect(axisRanges).toEqual([[expect.any(Number), expect.any(Number)]]);
    const [[debut]] = axisRanges as [[number, number]];
    expect(debut).toBeGreaterThan(0);
    expect(debut).toBeLessThan(rennes);
  });

  it('dévoile aux recommandations les quatre histoires du § 4.4, chiffrées', () => {
    const textes = explicationsDe('B3-01-A3-10-RECOMMANDATIONS');
    const histoires = [
      [
        feuille.enFrancais(VALEURS_B3_01['b3-01-a3-marge-marseille'], 1),
        feuille.enFrancais(HISTOIRES_B3_01['taux-de-marge-marseille-2025'], 1),
      ],
      [
        feuille.enFrancais(VALEURS_B3_01['b3-01-a3-atteinte-rennes'], 1),
        feuille.enFrancais(
          -HISTOIRES_B3_01['evolution-informatique-rennes'],
          1,
        ),
      ],
      [feuille.enFrancais(HISTOIRES_B3_01['evolution-lille'], 1)],
      [
        `${VALEURS_B3_01['b3-01-a2-delai-strasbourg']} jours ouvrés`,
        `contre ${HISTOIRES_B3_01['delai-median-strasbourg-2025']}`,
      ],
    ];

    expect(textes).toHaveLength(histoires.length);
    histoires.forEach((formes, rang) => {
      for (const forme of formes) {
        expect(textes[rang]).toContain(forme);
      }
    });
  });
});

describe('B3-01 — pièces jointes du § 8.2', () => {
  it('joint chaque classeur à son écran, dans la diffusion prévue', () => {
    const jointes = COURS.ecrans.flatMap((ecran) =>
      ecran.pieceJointe === undefined
        ? []
        : [
            {
              ecran: ecran.id.slice(6, 11),
              diffusion: ecran.diffusion,
              fichier: ecran.pieceJointe.fichier,
            },
          ],
    );
    const attendues = piecesJointesDuDocument(DOCUMENT);

    expect(jointes.map(({ fichier }) => fichier)).toEqual(
      Object.values(CLASSEURS_B3_01),
    );
    expect(
      jointes.map(({ ecran, diffusion }) => ({ ecran, diffusion })),
    ).toEqual(attendues.map(({ ecran, diffusion }) => ({ ecran, diffusion })));
    attendues.forEach(({ motif }, rang) => {
      expect(jointes[rang].fichier.split('/').at(-1)).toMatch(motif);
    });
  });
});

describe('B3-01 — gardes de la relecture', () => {
  it('V1 · sert chaque formule telle qu’Excel l’accepte, sans espace ajoutée par la typographie', () => {
    expect(formulesAltereesALaPublication(COURS_B3_01)).toEqual([]);
  });

  it('V4 · annonce dans chaque énoncé numérique l’arrondi et le symbole à omettre, ou le nombre entier', () => {
    const fautifs = numeriquesStockees()
      .filter(({ enonce, unite }) =>
        UNITES_ARRONDIES.has(unite ?? '')
          ? !enonce.includes('sans le symbole') || !enonce.includes('arrondi')
          : !enonce.includes('nombre entier'),
      )
      .map(({ id }) => id);

    expect(numeriquesStockees()).toHaveLength(QUESTIONS_CHIFFREES_B3_01.length);
    expect(fautifs).toEqual([]);
  });

  it('ne sert au catalogue aucune valeur attendue reconnaissable', () => {
    expect(valeursAuCatalogue(COURS, valeursReconnaissables())).toEqual([]);
  });

  it('ne dévoile dans aucune explication la valeur d’une question encore ouverte', () => {
    expect(valeursDevoileesParLesExplications(COURS, VALEURS)).toEqual([]);
  });

  it('ne dévoile dans aucune correction sur place une valeur décimale d’un écran suivant', () => {
    expect(valeursDevoileesAvantLeurEcran(COURS_B3_01, COURS)).toEqual([]);
  });

  it('écrit les colonnes du classeur où elles sont : ville en E, produit_id en H, ca_ht en L', () => {
    const textes = [
      'B3-01-A1-12-EXEMPLE-NETTOYAGE',
      'B3-01-A2-03-COURS-CHERCHER-AGREGER',
    ]
      .map((ecran) => feuille.texteDeLEcran(COURS_B3_01, ecran))
      .join(' ');

    expect(textes).toContain('=NOMPROPRE(SUPPRESPACE(E2))');
    expect(textes).toContain('SUBSTITUE(L2;');
    expect(textes).toContain('EQUIV(H2;Produits!$A$2:$A$41;0)');
  });

  it('V4 · ne pose sur une question en nombre entier que des pièges entiers', () => {
    const enNombreEntier = new Set(
      numeriquesStockees()
        .filter(({ enonce }) => enonce.includes('nombre entier'))
        .map(({ id }) => id),
    );
    const fautifs = QUESTIONS_CHIFFREES_B3_01.filter(
      (id) =>
        enNombreEntier.has(id) &&
        Object.values(PIEGES_B3_01[id]).some(
          (piege) => !Number.isInteger(piege),
        ),
    );

    expect(enNombreEntier.size).toBeGreaterThan(0);
    expect(fautifs).toEqual([]);
  });
});

describe('B3-01 — acte 1 : consignes et corrections exactes', () => {
  it('A1-04 · n’offre au vote de la clé aucune option défendable', () => {
    expect(libellesDuVote('b3-01-a1-cle-client').join(' ')).not.toContain(
      'SIRET',
    );
  });

  it('A1-05 et A1-07 · nomment les valeurs du booléen comme Excel les affiche', () => {
    for (const ecran of [
      'B3-01-A1-05-COURS-DONNEE',
      'B3-01-A1-07-TRI-COLONNES',
    ]) {
      expect(texteDe(ecran)).toContain('VRAI');
      expect(texteDe(ecran)).not.toMatch(/«\s?oui\s?»/);
    }
  });

  it('A1-07 · rattache les dates, les mesures et le booléen à la confusion de type, n_commande à ses chiffres', () => {
    const attendus = questionsDe('B3-01-A1-07-TRI-COLONNES').flatMap(
      (question) =>
        question.type === 'classement' ? question.corrige.attendus : [],
    );
    const horsIdentifiants = attendus.filter(
      ({ categorieId }) => !['identifiant', 'categorie'].includes(categorieId),
    );

    expect(horsIdentifiants).toHaveLength(7);
    expect(
      horsIdentifiants.filter(
        ({ confusionSiErreur }) =>
          confusionSiErreur !== 'type-de-variable-confondu',
      ),
    ).toEqual([]);
    expect(texteDe('B3-01-A1-07-TRI-COLONNES')).not.toMatch(
      /écri(?:t|vent) en chiffres/,
    );
  });

  it('A1-08 · fait voter la granularité avant de compter les lignes de la commande témoin', () => {
    expect(
      questionsDe('B3-01-A1-08-ATELIER-GRANULARITE').map(({ id }) => id),
    ).toEqual(['b3-01-a1-granularite', 'b3-01-a1-lignes-commande']);
  });

  it('A1-11 · enseigne le comptage des valeurs distinctes que l’exercice 4 demande', () => {
    expect(texteDe('B3-01-A1-11-COURS-OUTILS')).toContain('Valeurs distinctes');
  });

  it('A1-12 · désigne l’espace insécable par UNICAR(160)', () => {
    const texte = texteDe('B3-01-A1-12-EXEMPLE-NETTOYAGE');

    expect(texte).toContain('UNICAR(160)');
    expect(texte).not.toMatch(/(?<!UNI)CAR\(160\)/);
  });

  it('A1-14 · range les colonnes nettoyées après la dernière colonne du brut, sans décaler la formule controle', () => {
    expect(texteDe('B3-01-A1-14-ATELIER-NETTOYAGE')).toContain(
      'en N et O, sans insérer de colonne',
    );
  });
});

describe('B3-01 — actes 2 et 3 : consignes et corrections exactes', () => {
  it('A2-02 · range SI.CONDITIONS dans le socle, puisqu’il existe depuis Excel 2019', () => {
    expect(texteDe('B3-01-A2-02-FAMILLES')).toContain(
      '"socle":"SI, ET, OU, SI.CONDITIONS"',
    );
  });

  it('A2-03 · fige les plages du modèle INDEX et EQUIV, pour que la recopie sans $ montre l’erreur', () => {
    const texte = texteDe('B3-01-A2-03-COURS-CHERCHER-AGREGER');

    expect(texte).toContain(
      '=INDEX(Produits!$C$2:$C$41;EQUIV(H2;Produits!$A$2:$A$41;0))',
    );
    expect(texte).not.toMatch(/Produits!\$?[A-Z]:/);
  });

  it('A2-04 · décrit la recherche non figée telle qu’elle glisse : la seule ligne Ouest trouvée date de 2025', () => {
    const [, , ouest] = explicationsDe('B3-01-A2-04-ATELIER-RECHERCHE');

    expect(ouest).not.toContain('aucune ne porte Ouest');
    expect(ouest).toContain('date de 2025');
  });

  it('A2-05 · pose le contrat en jours ouvrés dans le vote et des options dans la même unité', () => {
    expect(texteDe('B3-01-A2-05-VOTE-DELAI')).toContain(
      'Le contrat de Norvane compte les délais en jours ouvrés',
    );
    expect(
      libellesDuVote('b3-01-a2-delai').filter(
        (libelle) => !libelle.includes('ouvré'),
      ),
    ).toEqual([]);
  });

  it('A2-08 · borne la plage fixe à la dernière ligne de la reprise', () => {
    const derniereLigne =
      VALEURS_B3_01['b3-01-a1-lignes-uniques'] -
      VALEURS_B3_01['b3-01-a3-quarantaine'] +
      1;
    const texte = texteDe('B3-01-A2-08-VOTE-NOUVELLES-LIGNES');

    expect(texte).toContain(`A2:A${derniereLigne}`);
    expect(texte).not.toContain('A2:A4001');
  });

  it('A3-02 · renvoie au graphique de l’écran précédent et chiffre l’écart affiché', () => {
    const ecart = Math.round(
      (1 -
        HISTOIRES_B3_01['ca-2025-rennes'] / HISTOIRES_B3_01['ca-2025-nantes']) *
        100,
    );
    const texte = texteDe('B3-01-A3-02-VOTE-GRAPHIQUE');

    expect(texte).toContain('le graphique de l’écran précédent');
    expect(texte).toContain(`environ ${ecart} % de moins`);
    expect(ecart).toBe(13);
  });

  it('A3-07 · ne promet aux segments que les TCD et leurs graphiques', () => {
    const texte = texteDe('B3-01-A3-07-COURS-DASHBOARD');

    expect(texte).not.toContain('toute la page');
    expect(texte).toContain('tous les TCD connectés et leurs graphiques');
  });

  it('A3-08 · démontre au pupitre sur une feuille décrite, sans supposer celle de l’étudiant', () => {
    const texte = texteDe('B3-01-A3-08-EXEMPLE-MFC-SEGMENTS');

    expect(texte).not.toContain('de l’exercice 9');
    expect(texte).toContain('au pupitre');
    expect(texte).toContain('deux TCD');
  });

  it('A3-10 · chiffre chaque histoire sur sa période et donne à chacune constat, cause et action', () => {
    const [marseille, rennes, ...suite] = explicationsDe(
      'B3-01-A3-10-RECOMMANDATIONS',
    );

    expect(marseille).toContain(
      `${feuille.enFrancais(HISTOIRES_B3_01['taux-de-marge-marseille-2025'], 1)} % de janvier à septembre 2025`,
    );
    expect(rennes).toContain('par rapport à la même période de 2025');
    for (const histoire of [marseille, rennes, ...suite]) {
      expect(histoire).toContain('Cause :');
      expect(histoire).toContain('Action :');
    }
  });
});
