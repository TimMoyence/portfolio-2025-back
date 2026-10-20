import {
  attendreLaFeuille,
  attendreLesEnigmes,
  attendreLesNumeriques,
  corrigeDe,
  corrigeDeFeuille,
  decrireLaFicheDuCours,
  decrireLaMiniSituation,
  FICHE_DU_GABARIT_V3,
  valeursEtPieges,
} from '../../../../../test/helpers/fiche-de-cours';
import {
  attendusDeColonne,
  confusionsDe,
  recopier,
  texteDeLEcran as texteDe,
} from '../../../../../test/helpers/feuille-de-cours';
import { somme } from '../../../../common/domain/nombres/statistiques';
import {
  arrondi,
  auMillionieme,
} from '../../../../common/domain/nombres/arrondi';
import { corrigerFeuille } from '../../domain/cours/CorrectionProduction';
import { COURS_B1_01 } from './b1-01.cours';
import { buildCoursDuContenu } from '../../../../../test/factories/contenus-de-cours.factory';

const COURS = buildCoursDuContenu(COURS_B1_01);

const SALARIES = 40;
const ALTERNANTS = 10;
const SALARIES_DE_NANTES = 16;
const ALTERNANTS_DE_NANTES = 4;
const OBJECTIF = 0.3;

const CLIENTS = [1200, 800, 600, 400];
const CARTE = [0.45, 0.6, 0.5, 0.75];
const RESERVATION = 0.4;
const OCTOBRE = [
  [1500, 0.4],
  [500, 0.7],
] as const;

const JEUNES_2025 = 36.5;
const JEUNES_2026 = 42.3;
const ACHAT_MANETTE = 24;
const VENTE_MANETTE = 39;

const BILLETS = [412, 288, 172, 88];
const EN_LIGNE = 150;
const TOURNOI = 0.45;
const ATELIERS = [
  [160, 0.85],
  [140, 0.6],
] as const;
const ACHAT_STAND = 32;
const VENTE_STAND = 50;

const pourcent = (partie: number, tout: number): number =>
  auMillionieme((partie / tout) * 100);
const auDixieme = (partie: number, tout: number): number =>
  arrondi((partie / tout) * 100, 1);

const TOUS_LES_CLIENTS = somme(CLIENTS);
const PORTEURS = CLIENTS.map((clients, rang) => clients * CARTE[rang]);
const TOUS_LES_PORTEURS = somme(PORTEURS);
const TOUS_LES_BILLETS = somme(BILLETS);

decrireLaFicheDuCours('B1-01', COURS, {
  ...FICHE_DU_GABARIT_V3,
  conception: 'cours-b1-01-conception.md',
  ecrans: 31,
  dureeMinutes: 160,
  minutesParActe: [49, 36, 37, 38, 0, 0],
  rythme: { expositionContinueMax: 6, interactives: 131, exposition: 29 },
  noteesParType: [4, 10, 0, 2, 1],
  options: 8 + 12,
  catalogue: [
    'A1-02',
    'A1-04',
    'A1-06',
    'A1-07',
    'A2-02',
    'A2-03',
    'A3-02',
    'A3-03',
    'A4-01',
    'A4-05',
  ],
  ateliersNotes: ['A1-09 (10)', 'A2-06 (10)', 'A3-05 (10)'],
  remediations: 14,
  corrigesSurPlace: [
    'B1-01-A1-09-ATELIER-ALTERNANTS',
    'B1-01-A1-10-TABLEUR-CLIENTS',
    'B1-01-A2-05-TABLEAU-FIDELITE',
    'B1-01-A2-06-ATELIER-FIDELITE',
    'B1-01-A3-05-ATELIER-VENTES',
    'B1-01-A3-06-DEFI-IA',
    'B1-01-A4-02-TABLEUR-FESTIVAL',
    'B1-01-A4-03-COFFRE-FESTIVAL',
  ],
});

decrireLaMiniSituation('B1-01', COURS_B1_01, {
  donneesFictives: ['B1-01-A1-04-DOSSIER', 'B1-01-A4-01-SITUATION-FESTIVAL'],
  coffre: 'B1-01-A4-03-COFFRE-FESTIVAL',
  tableur: 'B1-01-A4-02-TABLEUR-FESTIVAL',
});

describe('B1-01 — textes relus contre les données', () => {
  it('annonce dans le dossier les salariés, les alternants, les clients et les taux de la carte', () => {
    const texte = texteDe(COURS_B1_01, 'B1-01-A1-04-DOSSIER');

    expect(texte).toContain('40 salariés');
    expect(texte).toContain('10 alternants');
    expect(texte).toContain('3 000 clients');
    for (const taux of CARTE) {
      expect(texte).toContain(`${taux * 100} %`);
    }
  });

  it('annonce dans le dossier du festival les 960 billets et leur répartition', () => {
    const texte = texteDe(COURS_B1_01, 'B1-01-A4-01-SITUATION-FESTIVAL');

    expect(texte).toContain('960 billets');
    for (const billets of BILLETS) {
      expect(texte).toContain(String(billets));
    }
  });

  it('donne à chaque méthode de trace écrite un moyen mnémotechnique, sans encadré « Au CCF »', () => {
    const traces = COURS_B1_01.ecrans.filter((ecran) =>
      texteDe(COURS_B1_01, ecran.screenId).includes('"renderer":"lesson"'),
    );

    expect(traces).toHaveLength(6);
    for (const trace of traces) {
      expect(texteDe(COURS_B1_01, trace.screenId)).not.toContain('"exam"');
    }
  });
});

describe('B1-01 — recalcul des corrigés depuis les seuls paramètres', () => {
  it('recalcule les solutions et pièges des dix questions numériques', () => {
    const reserves = TOUS_LES_PORTEURS * RESERVATION;
    const [[nantes, tauxNantes], [angers, tauxAngers]] = OCTOBRE;
    const ecart = auMillionieme(JEUNES_2026 - JEUNES_2025);
    const marge = VENTE_MANETTE - ACHAT_MANETTE;

    attendreLesNumeriques(COURS, {
      'b1-01-a1-part-alternants': [
        pourcent(ALTERNANTS, SALARIES),
        pourcent(SALARIES, ALTERNANTS),
        ALTERNANTS / SALARIES,
      ],
      'b1-01-a1-alternants-nantes': [
        pourcent(ALTERNANTS_DE_NANTES, SALARIES_DE_NANTES),
        pourcent(ALTERNANTS_DE_NANTES, ALTERNANTS),
        pourcent(ALTERNANTS_DE_NANTES, SALARIES),
      ],
      'b1-01-a1-objectif': [
        OBJECTIF * SALARIES,
        OBJECTIF * ALTERNANTS,
        OBJECTIF * 100,
      ],
      'b1-01-a2-part-reservation': [
        pourcent(reserves, TOUS_LES_CLIENTS),
        RESERVATION * 100,
        pourcent(TOUS_LES_PORTEURS, TOUS_LES_CLIENTS) + RESERVATION * 100,
      ],
      'b1-01-a2-clients-reservation': [
        reserves,
        TOUS_LES_CLIENTS * RESERVATION,
        TOUS_LES_PORTEURS,
      ],
      'b1-01-a2-octobre': [
        pourcent(nantes * tauxNantes + angers * tauxAngers, nantes + angers),
        ((tauxNantes + tauxAngers) / 2) * 100,
        (tauxNantes + tauxAngers) * 100,
      ],
      'b1-01-a3-ecart-points': [ecart, pourcent(ecart, JEUNES_2025)],
      'b1-01-a3-evolution': [
        pourcent(ecart, JEUNES_2025),
        ecart,
        pourcent(ecart, JEUNES_2026),
      ],
      'b1-01-a3-taux-de-marge': [
        pourcent(marge, ACHAT_MANETTE),
        pourcent(marge, VENTE_MANETTE),
      ],
      'b1-01-a3-taux-de-marque': [
        pourcent(marge, VENTE_MANETTE),
        pourcent(marge, ACHAT_MANETTE),
      ],
    });
  });

  it('recalcule les solutions et pièges des quatre énigmes de la mini-situation', () => {
    const partDesEtudiants = BILLETS[1] / TOUS_LES_BILLETS;
    const [[samedi, remplissageSamedi], [dimanche, remplissageDimanche]] =
      ATELIERS;
    const marge = VENTE_STAND - ACHAT_STAND;

    attendreLesEnigmes(COURS, {
      'b1-01-a4-e1-en-ligne': [
        auDixieme(EN_LIGNE, BILLETS[0]),
        auDixieme(EN_LIGNE, TOUS_LES_BILLETS),
        auDixieme(BILLETS[0], EN_LIGNE),
      ],
      'b1-01-a4-e2-tournoi': [
        pourcent(BILLETS[1] * TOURNOI, TOUS_LES_BILLETS),
        TOURNOI * 100,
        (partDesEtudiants + TOURNOI) * 100,
      ],
      'b1-01-a4-e3-ateliers': [
        pourcent(
          samedi * remplissageSamedi + dimanche * remplissageDimanche,
          samedi + dimanche,
        ),
        ((remplissageSamedi + remplissageDimanche) / 2) * 100,
        (remplissageSamedi + remplissageDimanche) * 100,
      ],
      'b1-01-a4-e4-stand': [
        auDixieme(marge, VENTE_STAND),
        pourcent(marge, ACHAT_STAND),
      ],
    });
  });

  it('attend au tableau de fidélité les porteurs de chaque boutique, et un taux global de 54 %', () => {
    const corrige = corrigeDe(COURS, 'b1-01-a2-tableau-fidelite');
    if (corrige.type !== 'tableau') {
      throw new Error('l’exercice 3 n’a pas de corrigé de tableau');
    }

    expect(corrige.attendus.map(valeursEtPieges)).toEqual(
      PORTEURS.map((porteurs, rang) => [
        porteurs,
        CARTE[rang] * 100,
        auMillionieme(CLIENTS[rang] / CARTE[rang]),
      ]),
    );
    expect(pourcent(TOUS_LES_PORTEURS, TOUS_LES_CLIENTS)).toBe(54);
  });

  it('arrondit au dixième des parts de billets qui font exactement 100 %', () => {
    expect(
      arrondi(
        somme(BILLETS.map((billets) => auDixieme(billets, TOUS_LES_BILLETS))),
        6,
      ),
    ).toBe(100);
  });
});

describe('B1-01 — les deux feuilles corrigées par le moteur de formules', () => {
  it('reconnaît juste la répartition des clients, total, parts arrondies et contrôle', () => {
    const corrige = corrigeDeFeuille(COURS, 'b1-01-a1-tableur-clients');

    attendreLaFeuille(corrige, {
      B6: [TOUS_LES_CLIENTS],
      ...attendusDeColonne('C', 2, CLIENTS, (clients, rang) => {
        const juste = auDixieme(clients, TOUS_LES_CLIENTS);
        const exacte = pourcent(clients, TOUS_LES_CLIENTS);
        if (rang === 0) {
          return [
            juste,
            arrondi(clients / TOUS_LES_CLIENTS, 1),
            pourcent(TOUS_LES_CLIENTS, clients),
          ];
        }
        return exacte === juste ? [juste] : [juste, exacte];
      }),
      C6: [100],
    });
    expect(
      corrigerFeuille(corrige, {
        B6: '=SOMME(B2:B5)',
        ...recopier('=ARRONDI(B2/$B$6*100;1)', 'C', 2, 5),
        C6: '=SOMME(C2:C5)',
      }).score,
    ).toBe(1);
  });

  it('nomme le total non figé, l’arrondi oublié et le total tapé au clavier', () => {
    const corrige = corrigeDeFeuille(COURS, 'b1-01-a1-tableur-clients');

    expect(
      confusionsDe(
        corrige,
        {
          B6: '=SOMME(B2:B5)',
          ...recopier('=ARRONDI(B2/B6*100;1)', 'C', 2, 5),
        },
        'C',
      ).slice(0, 4),
    ).toEqual([
      null,
      'reference-relative-non-figee',
      'reference-relative-non-figee',
      'reference-relative-non-figee',
    ]);
    expect(
      confusionsDe(
        corrige,
        { B6: '=SOMME(B2:B5)', ...recopier('=B2/$B$6*100', 'C', 2, 5) },
        'C',
      ).slice(0, 4),
    ).toEqual([null, 'arrondi-oublie', null, 'arrondi-oublie']);
    expect(confusionsDe(corrige, { B6: '3000' }, 'B')).toEqual([
      'valeur-saisie-sans-formule',
    ]);
  });

  it('reconnaît juste la répartition des billets et nomme la part sans × 100 et le tout inversé', () => {
    const corrige = corrigeDeFeuille(COURS, 'b1-01-a4-feuille-billets');
    const juste = {
      B7: '=SOMME(B3:B6)',
      ...recopier('=ARRONDI(B3/$B$7*100;1)', 'C', 3, 6),
      C7: '=SOMME(C3:C6)',
    };

    expect(corrigerFeuille(corrige, juste).score).toBe(1);
    expect(
      confusionsDe(corrige, { ...juste, C3: '=ARRONDI(B3/$B$7;1)' }, 'C3'),
    ).toEqual(['taux-valeur-facteur-cent']);
    expect(
      confusionsDe(corrige, { ...juste, C3: '=ARRONDI($B$7/B3*100;1)' }, 'C3'),
    ).toEqual(['base-inversee']);
    expect(
      confusionsDe(corrige, { ...juste, C3: '=B3/$B$7*100' }, 'C3'),
    ).toEqual(['arrondi-oublie']);
  });
});
