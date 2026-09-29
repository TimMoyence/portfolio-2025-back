import { buildCoursDuContenu } from '../../../../../test/factories/contenus-de-cours.factory';
import {
  attendreLaFeuille,
  attendreLesEnigmes,
  attendreLesNumeriques,
  corrigeDe,
  decrireLaFicheDuCours,
  pointsImprimes,
  valeursEtPieges,
} from '../../../../../test/helpers/fiche-de-cours';
import type { CorrigeFeuille } from '../../domain/cours/Corrige';
import { corrigerFeuille } from '../../domain/cours/CorrectionProduction';
import { evaluerCellule } from '../../domain/cours/Formule';
import { COURS_B2_03 } from './b2-03.cours';

const COURS = buildCoursDuContenu(COURS_B2_03);

interface Facture {
  readonly numero: string;
  readonly client: string;
  readonly pays: string;
  readonly ht: number;
  readonly delai: number;
  readonly impayee: boolean;
  readonly tva: boolean;
}

const FACTURES: readonly Facture[] = [
  ['F201', 'Voiles Martin', 'France', 1250, 35, false, true],
  ['F202', 'Nautic Sud', 'France', 6400, 72, true, true],
  ['F203', 'Sailtech GmbH', 'Allemagne', 3100, 48, false, true],
  ['F204', 'École de voile Ré', 'France', 890, 64, true, true],
  ['F205', 'Mar Azul SL', 'Espagne', 5200, 30, false, false],
  ['F206', 'Chantier Duval', 'France', 2300, 58, true, true],
  ['F207', 'Blue Sails BV', 'Pays-Bas', 1800, 81, true, false],
  ['F208', 'Club nautique Oléron', 'France', 740, 22, false, true],
  ['F209', 'Nautic Sud', 'France', 4950, 61, false, true],
  ['F210', 'Sailtech GmbH', 'Allemagne', 7300, 40, false, true],
  ['F211', 'Voiles Martin', 'France', 1600, 90, true, true],
  ['F212', 'Vela Italia Srl', 'Italie', 2750, 15, true, false],
  ['F213', 'Chantier Duval', 'France', 5000, 60, true, true],
  ['F214', 'École de voile Ré', 'France', 430, 12, false, true],
  ['F215', 'Mar Azul SL', 'Espagne', 3900, 95, true, true],
  ['F216', 'Club nautique Oléron', 'France', 1150, 45, false, true],
].map(([numero, client, pays, ht, delai, impayee, tva]) => ({
  numero: String(numero),
  client: String(client),
  pays: String(pays),
  ht: Number(ht),
  delai: Number(delai),
  impayee: impayee === true,
  tva: tva === true,
}));

const INDEMNITE_FORFAITAIRE = 40;
const SEUIL_DU_VISA = 5000;
const DELAI_MAXIMUM = 60;

type Regle = (facture: Facture) => boolean;

const compter = (regle: Regle): number => FACTURES.filter(regle).length;

function factureNumero(numero: string): Facture {
  const facture = FACTURES.find((candidate) => candidate.numero === numero);
  if (facture === undefined) {
    throw new Error(`facture ${numero} absente`);
  }
  return facture;
}
const horsDeFrance: Regle = (facture) => facture.pays !== 'France';
const grosMontant: Regle = (facture) => facture.ht >= SEUIL_DU_VISA;
const enRetard: Regle = (facture) => facture.delai > DELAI_MAXIMUM;
const aRelancer: Regle = (facture) => facture.impayee && enRetard(facture);
const aViser: Regle = (facture) =>
  grosMontant(facture) || horsDeFrance(facture);

function clientsOu(condition: (factures: readonly Facture[]) => boolean) {
  const clients = [...new Set(FACTURES.map((facture) => facture.client))];
  return clients.filter((client) =>
    condition(FACTURES.filter((facture) => facture.client === client)),
  ).length;
}

decrireLaFicheDuCours('B2-03', COURS, {
  conception: 'cours-b2-03-conception.md',
  ecrans: 32,
  dureeMinutes: 180,
  minutesParActe: [54, 39, 39, 48, 0, 0],
  rythme: { expositionContinueMax: 6, interactives: 151, exposition: 29 },
  ateliersNotes: ['A1-10 (8)', 'A2-05 (11)', 'A3-05 (11)'],
  noteesParType: [10, 4, 0, 3, 1],
  enigmes: 4,
  rappels: 12,
  remediations: 11,
  options: 14 + 12,
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
  corrigesSurPlace: [
    'B2-03-A1-09-TABLE-VERITE',
    'B2-03-A1-10-ATELIER-CONNECTEURS',
    'B2-03-A1-11-TABLEUR-SI-OU',
    'B2-03-A2-05-ATELIER-MORGAN',
    'B2-03-A2-06-TABLEUR-NON-OU',
    'B2-03-A3-05-ATELIER-QUANTIF',
    'B2-03-A3-06-DEFI-IA',
    'B2-03-A4-02-TABLEUR-CONTROLE',
    'B2-03-A4-03-COFFRE-CONTROLE',
  ],
});

function feuilleDe(id: string): CorrigeFeuille {
  const corrige = corrigeDe(COURS, id);
  if (corrige.type !== 'feuille') {
    throw new Error(`la production ${id} n’a pas de corrigé de feuille`);
  }
  return corrige;
}

function recopier(
  modele: string,
  colonne: string,
  lignes: readonly number[],
): Record<string, string> {
  return Object.fromEntries(
    lignes.map((ligne) => [
      `${colonne}${ligne}`,
      modele.replaceAll(/([A-G])2\b/g, `$1${ligne}`),
    ]),
  );
}

const lignesDe = (premiere: number, derniere: number): number[] =>
  Array.from({ length: derniere - premiere + 1 }, (_, rang) => premiere + rang);

function texteDeLEcran(screenId: string): string {
  const ecran = COURS_B2_03.ecrans.find(
    (candidat) => candidat.screenId === screenId,
  );
  if (ecran === undefined) {
    throw new Error(`écran ${screenId} absent du B2-03`);
  }
  return JSON.stringify(ecran);
}

describe('B2-03 — textes relus contre les données', () => {
  it('marque les factures d’Atelier Rivage comme fictives sur les écrans qui les montrent', () => {
    for (const ecran of [
      'B2-03-A1-04-FACTURES',
      'B2-03-A4-01-SITUATION-FACTURES',
    ]) {
      expect(texteDeLEcran(ecran)).toContain('Données fictives');
    }
  });

  it('note la mini-situation sur dix points, tableur compris', () => {
    const enigmes = pointsImprimes(
      texteDeLEcran('B2-03-A4-03-COFFRE-CONTROLE'),
    );
    const tableur = pointsImprimes(
      texteDeLEcran('B2-03-A4-02-TABLEUR-CONTROLE'),
    );

    expect(enigmes).toHaveLength(4);
    expect(new Set(tableur)).toEqual(new Set([3]));
    expect(enigmes.reduce((total, points) => total + points, 3)).toBe(10);
  });
});

describe('B2-03 — recalcul des corrigés depuis les seize factures', () => {
  it('recalcule les solutions et pièges des quatre questions numériques', () => {
    attendreLesNumeriques(COURS, {
      'b2-03-a1-visa': [
        compter(aViser),
        compter((facture) => grosMontant(facture) !== horsDeFrance(facture)),
        compter(grosMontant) + compter(horsDeFrance),
        compter(
          (facture) => facture.ht > SEUIL_DU_VISA || horsDeFrance(facture),
        ),
      ],
      'b2-03-a2-sans-visa': [
        compter((facture) => !aViser(facture)),
        compter(
          (facture) => facture.ht <= SEUIL_DU_VISA && !horsDeFrance(facture),
        ),
        compter((facture) => !grosMontant(facture) || !horsDeFrance(facture)),
      ],
      'b2-03-a3-impayees-recentes': [
        compter((facture) => facture.impayee && facture.delai < DELAI_MAXIMUM),
        compter((facture) => facture.impayee && facture.delai <= DELAI_MAXIMUM),
      ],
      'b2-03-a3-clients': [
        clientsOu((factures) => factures.every((facture) => facture.impayee)),
        clientsOu((factures) => factures.some((facture) => facture.impayee)),
      ],
    });
  });

  it('recalcule les solutions et pièges des quatre énigmes de la mini-situation', () => {
    const indemnites = (regle: Regle): number =>
      compter(regle) * INDEMNITE_FORFAITAIRE;
    const anomalieTva: Regle = (facture) =>
      horsDeFrance(facture) && !facture.tva;

    attendreLesEnigmes(COURS, {
      'b2-03-a4-e1-indemnites': [
        indemnites(aRelancer),
        indemnites(
          (facture) => facture.impayee && facture.delai >= DELAI_MAXIMUM,
        ),
        indemnites((facture) => facture.impayee || enRetard(facture)),
      ],
      'b2-03-a4-e2-sans-relance': [
        compter((facture) => !aRelancer(facture)),
        compter((facture) => !facture.impayee && !enRetard(facture)),
        compter((facture) => !facture.impayee || facture.delai < DELAI_MAXIMUM),
      ],
      'b2-03-a4-e3-visa': [
        compter((facture) => aViser(facture) && !grosMontant(facture)),
        0,
      ],
      'b2-03-a4-e4-requete': [
        compter(anomalieTva),
        compter((facture) => horsDeFrance(facture) || !facture.tva),
      ],
    });
  });

  it('recalcule la table de vérité A1-09 ligne par ligne, et ses pièges', () => {
    const corrige = corrigeDe(COURS, 'b2-03-a1-table-verite');
    if (corrige.type !== 'tableau') {
      throw new Error('la table A1-09 n’a pas de corrigé de tableau');
    }
    const verite = (valeur: boolean): number => (valeur ? 1 : 0);
    const ouExclusifDeLaPremiereLigne = (p: boolean, q: boolean) =>
      verite(p !== q);
    const equivalenceDeLaTroisiemeLigne = (p: boolean, q: boolean) =>
      verite(p === q);
    const attendus = ['F205', 'F203', 'F202', 'F201'].flatMap(
      (numero, rang) => {
        const facture = factureNumero(numero);
        const p = horsDeFrance(facture);
        const q = grosMontant(facture);
        return [
          [verite(!p)],
          [verite(p && q)],
          rang === 0
            ? [verite(p || q), ouExclusifDeLaPremiereLigne(p, q)]
            : [verite(p || q)],
          rang === 2
            ? [verite(!p || q), equivalenceDeLaTroisiemeLigne(p, q)]
            : [verite(!p || q)],
        ];
      },
    );

    expect(corrige.attendus.map(valeursEtPieges)).toEqual(attendus);
  });
});

describe('B2-03 — les trois feuilles corrigées par le moteur de formules', () => {
  it('reconnaît juste la règle du visa de l’exercice 3, recopiée jusqu’en D6', () => {
    const corrige = feuilleDe('b2-03-a1-tableur-si-ou');
    const envoi = recopier(
      '=SI(OU(C2>=5000;B2<>"France");"Visa";"Non")',
      'D',
      lignesDe(2, 6),
    );

    attendreLaFeuille(corrige, {
      D2: ['Visa'],
      D3: ['Visa'],
      D4: ['Non'],
      D5: ['Visa'],
      D6: ['Non'],
    });
    expect(corrigerFeuille(corrige, envoi).score).toBe(1);
  });

  it('nomme l’oubli des guillemets quand la formule tombe en erreur', () => {
    const corrige = feuilleDe('b2-03-a1-tableur-si-ou');
    const envoi = recopier(
      '=SI(OU(C2>=5000;B2<>France);"Visa";"Non")',
      'D',
      lignesDe(2, 6),
    );

    expect(
      corrigerFeuille(corrige, envoi).verdicts.map(
        (verdict) => verdict.confusion,
      ),
    ).toEqual(Array.from({ length: 5 }, () => 'critere-sans-guillemets'));
  });

  it('nomme l’oubli des guillemets autour d’un texte accentué ou d’un critère de NB.SI', () => {
    const corrige = feuilleDe('b2-03-a4-feuille-controle');
    const lignes = lignesDe(2, 17);
    const envoi = {
      ...recopier('=SI(ET(F2=Impayée;E2>60);"Relancer";"Non")', 'H', lignes),
      K3: '=NB.SI(D2:D17;>=5000)',
    };
    const confusions = new Map(
      corrigerFeuille(corrige, envoi).verdicts.map((verdict) => [
        verdict.reference,
        verdict.confusion,
      ]),
    );

    expect(lignes.map((ligne) => confusions.get(`H${ligne}`))).toEqual(
      lignes.map(() => 'critere-sans-guillemets'),
    );
    expect(confusions.get('K3')).toBe('critere-sans-guillemets');
  });

  it('compte au tableur les montants d’au moins 5 000 € HT et les clients hors de France', () => {
    const { plan } = feuilleDe('b2-03-a4-feuille-controle');
    const feuille = {
      lignes: plan.lignes,
      colonnes: plan.colonnes,
      cellules: {
        ...plan.cellules,
        K4: '=NB.SI(D2:D17;">=5000")',
        K5: '=NB.SI(C2:C17;"<>France")',
      },
    };

    expect(evaluerCellule(feuille, 'K4').valeur).toBe(compter(grosMontant));
    expect(evaluerCellule(feuille, 'K5').valeur).toBe(compter(horsDeFrance));
  });

  it('reconnaît justes les deux contrôles équivalents de l’exercice 5', () => {
    const corrige = feuilleDe('b2-03-a2-tableur-non-ou');
    const envoi = {
      ...recopier(
        '=SI(NON(OU(B2="France";C2="Oui"));"Anomalie";"OK")',
        'D',
        lignesDe(2, 6),
      ),
      ...recopier(
        '=SI(ET(B2<>"France";C2="Non");"Anomalie";"OK")',
        'E',
        lignesDe(2, 6),
      ),
    };
    const colonne = ['OK', 'Anomalie', 'OK', 'Anomalie', 'OK'];

    attendreLaFeuille(
      corrige,
      Object.fromEntries(
        ['D', 'E'].flatMap((lettre) =>
          colonne.map((valeur, rang) => [`${lettre}${rang + 2}`, [valeur]]),
        ),
      ),
    );
    expect(corrigerFeuille(corrige, envoi).score).toBe(1);
  });

  it('reconnaît juste la feuille de contrôle de la mini-situation et recompte ses totaux', () => {
    const corrige = feuilleDe('b2-03-a4-feuille-controle');
    const lignes = lignesDe(2, 17);
    const envoi = {
      ...recopier('=SI(ET(F2="Impayée";E2>60);"Relancer";"Non")', 'H', lignes),
      ...recopier('=SI(OU(D2>=5000;C2<>"France");"Visa";"Non")', 'I', lignes),
      K2: '=NB.SI(H2:H17;"Relancer")',
      K3: '=NB.SI(I2:I17;"Visa")',
    };
    const relance = (numero: string) => [
      aRelancer(factureNumero(numero)) ? 'Relancer' : 'Non',
    ];
    const visa = (numero: string) => [
      aViser(factureNumero(numero)) ? 'Visa' : 'Non',
    ];

    attendreLaFeuille(corrige, {
      ...Object.fromEntries(
        FACTURES.map((facture, rang) => [
          `H${rang + 2}`,
          relance(facture.numero),
        ]),
      ),
      ...Object.fromEntries(
        FACTURES.map((facture, rang) => [`I${rang + 2}`, visa(facture.numero)]),
      ),
      K2: [
        compter(aRelancer),
        compter((facture) => facture.impayee && facture.delai >= DELAI_MAXIMUM),
      ],
      K3: [
        compter(aViser),
        compter(grosMontant) + compter(horsDeFrance),
        compter((facture) => grosMontant(facture) !== horsDeFrance(facture)),
      ],
    });
    expect(corrigerFeuille(corrige, envoi).score).toBe(1);
  });
});
