import {
  ATTENDU_PRIX_INITIAL,
  buildCorrigeFeuille,
  buildCorrigeTableau,
  buildPlanFeuille,
} from '../../../../../test/factories/corriges.factory';
import { attendreProductionReussie } from '../../../../../test/helpers/corrections';
import { corrigerFeuille, corrigerTableau } from './CorrectionProduction';

const PLAN = buildPlanFeuille({
  cellules: {
    A1: 'Canal',
    B1: '2024',
    C1: '2025',
    A2: 'Sur-mesure',
    B2: '483000',
    C2: '397000',
    A3: 'Entretien',
    B3: '210000',
    C3: '230000',
  },
  verrouillees: ['A1', 'B1', 'C1', 'A2', 'B2', 'C2', 'A3', 'B3', 'C3'],
});
const CORRIGE_FEUILLE = buildCorrigeFeuille({ plan: PLAN });
const ATTENDU_D2 = CORRIGE_FEUILLE.attendus[0];
const CORRIGE_D2 = buildCorrigeFeuille({ plan: PLAN, attendus: [ATTENDU_D2] });
const CORRIGE_TABLEAU = buildCorrigeTableau({
  attendus: [
    ATTENDU_PRIX_INITIAL,
    {
      rang: 0,
      cle: 'indice',
      valeur: 108,
      pieges: [{ valeur: 8, confusion: 'indice-lu-comme-taux' }],
    },
  ],
});
const SANS_FORMULE = 'valeur-saisie-sans-formule';
const NON_RECOPIABLE = 'formule-non-recopiable';
const JUSTES = { D2: '=(C2-B2)/B2', D3: '=(C3-B3)/B3' };

function verdict(
  envoi: Readonly<Record<string, string>>,
  reference: string,
): { readonly juste: boolean; readonly confusion: string | null } {
  const trouve = corrigerFeuille(CORRIGE_FEUILLE, envoi).verdicts.find(
    (candidat) => candidat.reference === reference,
  );
  if (trouve === undefined) {
    throw new Error(`aucun verdict pour ${reference}`);
  }
  return { juste: trouve.juste, confusion: trouve.confusion };
}

describe('corrigerFeuille', () => {
  it('accepte les formules de référence et déclare la production réussie', () => {
    attendreProductionReussie(corrigerFeuille(CORRIGE_FEUILLE, JUSTES), 2);
  });

  it('accepte une formule équivalente qui garde la même forme recopiable', () => {
    expect(verdict({ D2: '=C2/B2-1', D3: '=C3/B3-1' }, 'D2')).toEqual({
      juste: true,
      confusion: null,
    });
    expect(verdict({ D2: '=C2/B2-1', D3: '=C3/B3-1' }, 'D3')).toEqual({
      juste: true,
      confusion: null,
    });
  });

  it('refuse une valeur tapée sans formule', () => {
    expect(verdict({ ...JUSTES, D2: '-0,178054' }, 'D2')).toEqual({
      juste: false,
      confusion: SANS_FORMULE,
    });
  });

  it('refuse une formule qui enferme la valeur attendue dans un littéral', () => {
    expect(verdict({ ...JUSTES, D2: '=-0,178054+0*B2' }, 'D2')).toEqual({
      juste: false,
      confusion: SANS_FORMULE,
    });
  });

  it('localise la cellule fausse et reconnaît son piège', () => {
    const correction = corrigerFeuille(CORRIGE_D2, {
      D2: '=(C2-B2)/B2*100',
    });

    expect(correction.verdicts).toEqual([
      { reference: 'D2', juste: false, confusion: 'taux-valeur-facteur-cent' },
    ]);
    expect(correction.correcte).toBe(false);
  });

  it('signale la recopie incohérente quand la cellule modèle a changé de forme', () => {
    const correction = corrigerFeuille(CORRIGE_FEUILLE, {
      D2: '=(C2-B2)/B2*100',
      D3: '=(C3-B3)/B3',
    });

    expect(correction.verdicts.map((cellule) => cellule.confusion)).toEqual([
      'taux-valeur-facteur-cent',
      NON_RECOPIABLE,
    ]);
  });

  it('ne prend pas pour un résultat recopié le 1 d’une formule de contrôle', () => {
    const controle = buildCorrigeFeuille({
      plan: PLAN,
      attendus: [
        {
          ...ATTENDU_D2,
          reference: 'D2',
          formuleReference: '=SI(ARRONDI(C2-B2;0)=-86000;1;0)',
          valeur: 1,
          tolerance: { type: 'absolue', valeur: 0 },
          pieges: [],
        },
      ],
    });

    const correction = corrigerFeuille(controle, {
      D2: '=SI(ARRONDI(C2-B2;0)=-86000;1;0)',
    });

    expect(correction.verdicts).toEqual([
      { reference: 'D2', juste: true, confusion: null },
    ]);
  });

  it('refuse une recopie juste en valeur dont la forme R1C1 diffère de sa référence', () => {
    expect(verdict({ ...JUSTES, D3: '=(230000-210000)/B3' }, 'D3')).toEqual({
      juste: false,
      confusion: NON_RECOPIABLE,
    });
  });

  it('refuse une cellule vide sans lui prêter de confusion', () => {
    expect(verdict({ ...JUSTES, D2: '   ' }, 'D2')).toEqual({
      juste: false,
      confusion: null,
    });
  });

  it('rend la confusion déclarée quand la formule tombe en erreur', () => {
    const corrige = buildCorrigeFeuille({
      plan: PLAN,
      attendus: [
        {
          ...ATTENDU_D2,
          confusionSiErreurFormule: 'reference-relative-non-figee',
        },
      ],
    });

    const correction = corrigerFeuille(corrige, { D2: '=(C2-B2)/B9' });

    expect(correction.verdicts).toEqual([
      {
        reference: 'D2',
        juste: false,
        confusion: 'reference-relative-non-figee',
      },
    ]);
  });

  it('réimpose les cellules verrouillées du plan sur l’envoi de l’étudiant', () => {
    const correction = corrigerFeuille(CORRIGE_FEUILLE, {
      ...JUSTES,
      B2: '1',
      C2: '2',
    });

    expect(correction.verdicts[0]).toEqual({
      reference: 'D2',
      juste: true,
      confusion: null,
    });
  });
});

describe('corrigerTableau', () => {
  it('accepte les valeurs attendues à la tolérance du corrigé', () => {
    attendreProductionReussie(
      corrigerTableau(CORRIGE_TABLEAU, [{ prix: 21.605, indice: 108 }]),
      2,
    );
  });

  it.each([
    [
      'localise la ligne fausse et reconnaît son piège',
      { prix: 21.6, indice: 8 },
      'indice-lu-comme-taux',
    ],
    [
      'refuse une saisie absente sans lui prêter de confusion',
      { prix: 21.6 },
      null,
    ],
  ])('%s', (_titre, saisie, confusion) => {
    const correction = corrigerTableau(CORRIGE_TABLEAU, [saisie]);

    expect(correction.verdicts.filter((ligne) => !ligne.juste)).toEqual([
      { rang: 0, cle: 'indice', juste: false, confusion },
    ]);
    expect(correction.score).toBe(0.5);
  });
});
