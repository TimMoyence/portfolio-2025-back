import {
  attendreLaFeuille,
  attendreLesNumeriques,
  corrigeDe,
  corrigeDeFeuille,
  decrireLaFicheDuCours,
  valeursEtPieges,
} from '../../../../../test/helpers/fiche-de-cours';
import {
  attendusDeColonne,
  recopier,
  texteDeLEcran as texteDe,
} from '../../../../../test/helpers/feuille-de-cours';
import { buildCoursDuContenu } from '../../../../../test/factories/contenus-de-cours.factory';
import {
  arrondi,
  auMillionieme,
} from '../../../../common/domain/nombres/arrondi';
import { somme } from '../../../../common/domain/nombres/statistiques';
import { corrigerFeuille } from '../../domain/cours/CorrectionProduction';
import { COURS_B1_02 } from './b1-02.cours';

const COURS = buildCoursDuContenu(COURS_B1_02);

const PACK_AVANT = 16;
const PACK_APRES = 18;
const MANETTE_TTC = 60;
const TVA = 0.2;
const REMISE = 0.15;
const HAUSSES = [0.1, 0.05] as const;
const BAISSE_DES_CARTES = 0.4;

const CA_2025 = [184, 120, 96, 80];
const CA_2026 = [207, 126, 92, 94];
const PRIX_DE_DEPART = [120, 80, 60, 40];
const HAUSSE_DU_TABLEAU = 0.2;
const SOLDES_DU_TABLEAU = 0.25;
const SANCTIONS = [18, 21, 42, 87] as const;
const [SANCTIONS_2021, SANCTIONS_2022, SANCTIONS_2023, SANCTIONS_2024] =
  SANCTIONS;
const EVOLUTIONS_DE_L_ANNALE = 3;

const auDixieme = (valeur: number): number => arrondi(valeur, 1);
const evolution = (depart: number, arrivee: number): number =>
  ((arrivee - depart) / depart) * 100;
const indice = (valeur: number): number => (valeur / SANCTIONS_2021) * 100;

const TAUX_MOYEN =
  ((SANCTIONS_2024 / SANCTIONS_2021) ** (1 / EVOLUTIONS_DE_L_ANNALE) - 1) * 100;

const FORMULES_DE_L_ANNALE = {
  C3: '=ARRONDI(C2/$B$2*100;1)',
  D3: '=ARRONDI(D2/$B$2*100;1)',
  E3: '=ARRONDI(E2/$B$2*100;1)',
  B5: '=ARRONDI((E2-C2)/C2*100;1)',
  B6: '=ARRONDI((E2-B2)/B2*100;1)',
  B7: '=ARRONDI((PUISSANCE(E2/B2;1/3)-1)*100;1)',
};

function verdictDe(
  envoi: Readonly<Record<string, string>>,
  reference: string,
): { readonly juste: boolean; readonly confusion: string | null } | undefined {
  const verdict = corrigerFeuille(
    corrigeDeFeuille(COURS, 'b1-02-a3-tableur-cnil'),
    envoi,
  ).verdicts.find((candidat) => candidat.reference === reference);
  return (
    verdict && { juste: verdict.juste, confusion: verdict.confusion ?? null }
  );
}

decrireLaFicheDuCours('B1-02', COURS, {
  conception: 'cours-b1-02-conception.md',
  ecrans: 26,
  dureeMinutes: 121,
  minutesParActe: [49, 36, 28, 8, 0, 0],
  rythme: { expositionContinueMax: 6, interactives: 95, exposition: 26 },
  noteesParType: [3, 6, 0, 2, 1],
  enigmes: 0,
  rappels: 12,
  options: 19,
  catalogue: [
    'A1-02',
    'A1-04',
    'A1-06',
    'A1-07',
    'A2-02',
    'A2-03',
    'A3-02',
    'A3-03',
    'A4-02',
  ],
  ateliersNotes: ['A1-09 (10)', 'A2-06 (10)'],
  remediations: 18,
  corrigesSurPlace: [
    'B1-02-A1-09-ATELIER-PRIX',
    'B1-02-A1-10-TABLEUR-CA',
    'B1-02-A2-05-TABLEAU-PRIX',
    'B1-02-A2-06-ATELIER-RETOUR',
    'B1-02-A3-05-TABLEUR-CNIL',
  ],
});

describe('B1-02 — textes relus contre les données', () => {
  it('B102-M2 · signale au dossier les données fictives de Partie Libre', () => {
    const dossier = texteDe(COURS_B1_02, 'B1-02-A1-04-DOSSIER');

    expect(dossier).toContain('Partie Libre');
    expect(dossier).toContain('Données fictives');
    for (const ca of [...CA_2025, ...CA_2026]) {
      expect(dossier).toContain(String(ca));
    }
  });

  it('B102-M2 · dit réelles les données de la CNIL, source citée, sans les dire fictives', () => {
    const annale = texteDe(COURS_B1_02, 'B1-02-A3-05-TABLEUR-CNIL');

    expect(annale).toContain('Données réelles');
    expect(annale).toContain('CNIL, rapport annuel 2024');
    expect(annale).toContain('26CGMATPO');
    expect(annale).not.toContain('fictives');
  });

  it('B102-M1 · donne à chaque page une méthode, sans encadré « Au CCF »', () => {
    const pages = COURS_B1_02.ecrans
      .map((ecran) => texteDe(COURS_B1_02, ecran.screenId))
      .filter((texte) => texte.includes('"renderer":"lesson"'));

    expect(pages).toHaveLength(6);
    for (const texte of pages) {
      expect(texte).toContain('"kind":"method"');
      expect(texte).not.toContain('"exam"');
    }
  });

  it('B102-M1 · ne garde ni mini-situation, ni défi, ni billet de sortie', () => {
    expect(
      COURS.ecrans.filter((ecran) =>
        ['fp-escape', 'fp-challenge'].includes(ecran.brique),
      ),
    ).toEqual([]);
    expect(COURS.ecrans.at(-1)?.id).toBe('B1-02-A4-02-FICHE-MEMO');
  });
});

describe('B1-02 — recalcul des corrigés depuis les seuls paramètres', () => {
  it('B102-M9 · recalcule les solutions et pièges des six questions numériques', () => {
    const ht = MANETTE_TTC / (1 + TVA);
    const [premiere, seconde] = HAUSSES;
    const global = (1 + premiere) * (1 + seconde);

    attendreLesNumeriques(COURS, {
      'b1-02-a1-taux-pack': [
        evolution(PACK_AVANT, PACK_APRES),
        PACK_APRES - PACK_AVANT,
        ((PACK_APRES - PACK_AVANT) / PACK_APRES) * 100,
      ],
      'b1-02-a1-ht': [ht, MANETTE_TTC * (1 - TVA), MANETTE_TTC * (1 + TVA)],
      'b1-02-a1-remise': [
        MANETTE_TTC * (1 - REMISE),
        MANETTE_TTC - REMISE * 100,
        MANETTE_TTC * REMISE,
      ],
      'b1-02-a2-coefficient-global': [
        global,
        1 + premiere + seconde,
        global - 1,
      ],
      'b1-02-a2-taux-global': [
        (global - 1) * 100,
        (premiere + seconde) * 100,
        global * 100,
      ],
      'b1-02-a2-reciproque': [
        (1 / (1 - BAISSE_DES_CARTES) - 1) * 100,
        BAISSE_DES_CARTES * 100,
        (1 - BAISSE_DES_CARTES) * 100,
      ],
    });
  });

  it('B102-M9 · attend au tableau les prix après chaque évolution, et − 10 % au global', () => {
    const corrige = corrigeDe(COURS, 'b1-02-a2-tableau-prix');
    if (corrige.type !== 'tableau') {
      throw new Error('l’exercice 3 n’a pas de corrigé de tableau');
    }
    const apresHausse = PRIX_DE_DEPART.map(
      (prix) => prix * (1 + HAUSSE_DU_TABLEAU),
    );
    const apresSoldes = apresHausse.map(
      (prix) => prix * (1 - SOLDES_DU_TABLEAU),
    );

    expect(corrige.attendus.map(valeursEtPieges)).toEqual([
      ...PRIX_DE_DEPART.map((prix, rang) => [
        auMillionieme(apresHausse[rang]),
        auMillionieme(prix * HAUSSE_DU_TABLEAU),
      ]),
      ...PRIX_DE_DEPART.map((prix, rang) => [
        auMillionieme(apresSoldes[rang]),
        auMillionieme(prix * 0.95),
        auMillionieme(apresHausse[rang] * SOLDES_DU_TABLEAU),
      ]),
    ]);
    expect(
      auMillionieme((somme(apresSoldes) / somme(PRIX_DE_DEPART) - 1) * 100),
    ).toBe(-10);
  });
});

describe('B1-02 — l’évolution du chiffre d’affaires au tableur', () => {
  const TOTAL_2025 = somme(CA_2025);
  const TOTAL_2026 = somme(CA_2026);
  const LIGNES = [...CA_2025, TOTAL_2025];
  const ARRIVEES = [...CA_2026, TOTAL_2026];
  const tauxExact = (rang: number): number =>
    evolution(LIGNES[rang], ARRIVEES[rang]);

  it('B102-M9 · reconnaît juste la feuille entière, totaux et taux arrondis', () => {
    const corrige = corrigeDeFeuille(COURS, 'b1-02-a1-tableur-ca');

    attendreLaFeuille(corrige, {
      B6: [TOTAL_2025],
      C6: [TOTAL_2026],
      ...attendusDeColonne('D', 2, LIGNES, (_ca, rang) => {
        const juste = auDixieme(evolution(LIGNES[rang], ARRIVEES[rang]));
        if (rang === 0) {
          return [
            juste,
            auDixieme(((ARRIVEES[0] - LIGNES[0]) / ARRIVEES[0]) * 100),
            ARRIVEES[0] - LIGNES[0],
            auDixieme((ARRIVEES[0] / LIGNES[0]) * 100),
          ];
        }
        return tauxExact(rang) === juste ? [juste] : [juste, tauxExact(rang)];
      }),
    });
    expect(
      corrigerFeuille(corrige, {
        B6: '=SOMME(B2:B5)',
        C6: '=SOMME(C2:C5)',
        ...recopier('=ARRONDI((C2-B2)/B2*100;1)', 'D', 2, 6),
      }).score,
    ).toBe(1);
  });
});

describe('B1-02 — l’exercice 5, le tableau du sujet', () => {
  it('B102-M3 · reprend en ligne les nombres du sujet et impose le premier indice', () => {
    const { plan } = corrigeDeFeuille(COURS, 'b1-02-a3-tableur-cnil');

    expect([plan.lignes, plan.colonnes]).toEqual([7, 5]);
    expect(
      ['B1', 'C1', 'D1', 'E1'].map((cellule) => plan.cellules[cellule]),
    ).toEqual(['2021', '2022', '2023', '2024']);
    expect(
      ['B2', 'C2', 'D2', 'E2'].map((cellule) => plan.cellules[cellule]),
    ).toEqual(SANCTIONS.map(String));
    expect(plan.cellules['B3']).toBe('100');
    expect(plan.verrouillees).toContain('B3');
  });

  it('B102-M3 · retrouve le sujet : 116,7, 483,3 et une hausse de 383,3 %', () => {
    const corrige = corrigeDeFeuille(COURS, 'b1-02-a3-tableur-cnil');

    expect(
      corrigerFeuille(corrige, FORMULES_DE_L_ANNALE).verdicts.map(
        ({ reference, juste }) => [reference, juste],
      ),
    ).toEqual(
      Object.keys(FORMULES_DE_L_ANNALE).map((cellule) => [cellule, true]),
    );
    expect(
      corrige.attendus.map(({ reference, valeur }) => [reference, valeur]),
    ).toEqual([
      ['C3', auDixieme(indice(SANCTIONS_2022))],
      ['D3', auDixieme(indice(SANCTIONS_2023))],
      ['E3', auDixieme(indice(SANCTIONS_2024))],
      ['B5', auDixieme(evolution(SANCTIONS_2022, SANCTIONS_2024))],
      ['B6', auDixieme(evolution(SANCTIONS_2021, SANCTIONS_2024))],
      ['B7', auDixieme(TAUX_MOYEN)],
    ]);
  });

  it('B102-M3 · nomme la base non figée, qui glisse d’une colonne', () => {
    const envoi = {
      ...FORMULES_DE_L_ANNALE,
      C3: '=ARRONDI(C2/B2*100;1)',
      D3: '=ARRONDI(D2/C2*100;1)',
      E3: '=ARRONDI(E2/D2*100;1)',
    };

    expect(verdictDe(envoi, 'C3')).toEqual({ juste: true, confusion: null });
    for (const cellule of ['D3', 'E3']) {
      expect(verdictDe(envoi, cellule)).toEqual({
        juste: false,
        confusion: 'reference-non-figee-en-ligne',
      });
    }
  });

  it('B102-M3 · nomme l’arrondi oublié, sur chaque cellule, à la même règle', () => {
    const sansArrondi = {
      C3: '=C2/$B$2*100',
      D3: '=D2/$B$2*100',
      E3: '=E2/$B$2*100',
      B5: '=(E2-C2)/C2*100',
      B6: '=(E2-B2)/B2*100',
      B7: '=(PUISSANCE(E2/B2;1/3)-1)*100',
    };

    for (const cellule of Object.keys(sansArrondi)) {
      expect(verdictDe(sansArrondi, cellule)).toEqual({
        juste: false,
        confusion: 'arrondi-oublie',
      });
    }
  });

  it('B102-M3 · nomme le taux moyen divisé, et le taux écrit en décimal', () => {
    const avec = (B7: string) => ({ ...FORMULES_DE_L_ANNALE, B7 });

    expect(verdictDe(avec('=ARRONDI((E2-B2)/B2*100/3;1)'), 'B7')).toEqual({
      juste: false,
      confusion: 'taux-moyen-arithmetique',
    });
    expect(verdictDe(avec('=ARRONDI(PUISSANCE(E2/B2;1/3)-1;1)'), 'B7')).toEqual(
      { juste: false, confusion: 'taux-valeur-facteur-cent' },
    );
  });

  it('B102-M3 · accepte la valeur de 2021 écrite en dur et recopiée : seule la consigne demande B2, décision de Tim du 30/10', () => {
    const envoi = {
      ...FORMULES_DE_L_ANNALE,
      C3: '=ARRONDI(C2/18*100;1)',
      D3: '=ARRONDI(D2/18*100;1)',
      E3: '=ARRONDI(E2/18*100;1)',
    };

    for (const cellule of ['C3', 'D3', 'E3']) {
      expect(verdictDe(envoi, cellule)).toEqual({
        juste: true,
        confusion: null,
      });
    }
  });

  it('B102-M7 · nomme une formule retapée au lieu d’être recopiée', () => {
    const envoi = { ...FORMULES_DE_L_ANNALE, D3: '=ARRONDI(D2/18*100;1)' };

    expect(verdictDe(envoi, 'D3')).toEqual({
      juste: false,
      confusion: 'formule-non-recopiable-en-ligne',
    });
  });
});
