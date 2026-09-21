import { B2_COURS_V3 } from '../../../../migrations/data/b2-v3.cours';
import type {
  CorrigeFeuille,
  CorrigeTableau,
} from '../../domain/cours/Corrige';
import {
  corrigerFeuille,
  corrigerTableau,
  type SaisiesDeTableau,
} from '../../domain/cours/CorrectionProduction';
import { questionsDuCours } from '../../domain/cours/Cours';
import { lireCoursStocke } from '../../domain/cours/CoursStocke';
import { evaluerExpression, evaluerFeuille } from '../../domain/cours/Formule';

const COURS = lireCoursStocke(B2_COURS_V3);
const SANS_FORMULE = 'valeur-saisie-sans-formule';
const CELLULES_ATTENDUES = 17;
const JUSTES_DES_CONSTATS = 13;

function corrigeDe(id: string): CorrigeFeuille | CorrigeTableau {
  const question = questionsDuCours(COURS).find(
    (candidate) => candidate.id === id,
  );
  if (
    question === undefined ||
    (question.type !== 'feuille' && question.type !== 'tableau')
  ) {
    throw new Error(`production introuvable dans la V3 : ${id}`);
  }
  return question.corrige as CorrigeFeuille | CorrigeTableau;
}

function corrigeDeLaFeuille(): CorrigeFeuille {
  const corrige = corrigeDe('b2-01-a4-feuille-canaux');
  if (corrige.type !== 'feuille') {
    throw new Error('b2-01-a4-feuille-canaux n’est pas une feuille');
  }
  return corrige;
}

function corrigeDuTableau(): CorrigeTableau {
  const corrige = corrigeDe('b2-01-a4-indice-toile');
  if (corrige.type !== 'tableau') {
    throw new Error('b2-01-a4-indice-toile n’est pas un tableau');
  }
  return corrige;
}

const FEUILLE = corrigeDeLaFeuille();
const TABLEAU = corrigeDuTableau();

function envoiDeReference(): Record<string, string> {
  return Object.fromEntries(
    FEUILLE.attendus.map((attendu) => [
      attendu.reference,
      attendu.formuleReference,
    ]),
  );
}

function confusionsDe(envoi: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    corrigerFeuille(FEUILLE, envoi)
      .verdicts.filter((cellule) => !cellule.juste)
      .map((cellule) => [cellule.reference, cellule.confusion ?? 'sans']),
  );
}

describe('A4-02 — correction serveur de la tâche de tableur 1 (AC-11)', () => {
  it('recalcule les 17 valeurs du § 5.6 depuis le plan et les formules de référence', () => {
    const plan = FEUILLE.plan;
    const cellules = { ...plan.cellules, ...envoiDeReference() };

    const resultats = evaluerFeuille({
      lignes: plan.lignes,
      colonnes: plan.colonnes,
      cellules,
    });
    const calculees = Object.fromEntries(
      FEUILLE.attendus.map((attendu) => [
        attendu.reference,
        resultats.get(attendu.reference)?.valeur ?? Number.NaN,
      ]),
    );

    expect(FEUILLE.attendus).toHaveLength(CELLULES_ATTENDUES);
    expect(calculees.D2).toBeCloseTo(-0.178054, 6);
    expect(calculees.E2).toBeCloseTo(0.345217, 6);
    expect(calculees.F5).toBeCloseTo(0.253043, 6);
    expect(calculees.G5).toBe(291000);
    expect([calculees.B7, calculees.C7]).toEqual([1, 1]);
    for (const attendu of FEUILLE.attendus) {
      expect(calculees[attendu.reference]).toBeCloseTo(attendu.valeur, 5);
    }
  });

  it('déclare la feuille réussie quand l’étudiant envoie les formules attendues', () => {
    const correction = corrigerFeuille(FEUILLE, envoiDeReference());

    expect(correction.verdicts.filter((cellule) => !cellule.juste)).toEqual([]);
    expect(correction.score).toBe(1);
    expect(correction.correcte).toBe(true);
  });

  it('accepte une formule équivalente à la formule de référence', () => {
    const correction = corrigerFeuille(FEUILLE, {
      ...envoiDeReference(),
      D2: '=C2/B2-1',
      D3: '=C3/B3-1',
      D4: '=C4/B4-1',
      D5: '=C5/B5-1',
    });

    expect(correction.correcte).toBe(true);
    expect(correction.score).toBe(1);
  });

  it('constate la référence non figée : #DIV/0! en E3, 523 000 en E4, #REF! en E5, B7 en erreur', () => {
    const envoi = {
      ...envoiDeReference(),
      E2: '=C2/C5',
      E3: '=C3/C6',
      E4: '=C4/C7',
      E5: '=C5/C8',
    };

    const correction = corrigerFeuille(FEUILLE, envoi);

    expect(Object.keys(confusionsDe(envoi))).toEqual(['E3', 'E4', 'E5', 'B7']);
    expect(correction.verdicts.filter((cellule) => cellule.juste)).toHaveLength(
      JUSTES_DES_CONSTATS,
    );
    expect(correction.correcte).toBe(false);
  });

  it('constate les résultats tapés sans formule : quatre cellules à revoir, B7 juste', () => {
    const envoi = {
      ...envoiDeReference(),
      E2: '0,345217',
      E3: '0,2',
      E4: '0,454783',
      E5: '1',
    };

    const correction = corrigerFeuille(FEUILLE, envoi);

    expect(confusionsDe(envoi)).toEqual({
      E2: SANS_FORMULE,
      E3: SANS_FORMULE,
      E4: SANS_FORMULE,
      E5: SANS_FORMULE,
    });
    expect(correction.verdicts.filter((cellule) => cellule.juste)).toHaveLength(
      JUSTES_DES_CONSTATS,
    );
    expect(correction.correcte).toBe(false);
  });

  it('reconnaît le piège du taux écrit en pourcentage sur D2', () => {
    const correction = corrigerFeuille(FEUILLE, {
      ...envoiDeReference(),
      D2: '=(C2-B2)/B2*100',
    });
    const fausses = correction.verdicts.filter((cellule) => !cellule.juste);

    expect(fausses[0]).toEqual({
      reference: 'D2',
      juste: false,
      confusion: 'taux-valeur-facteur-cent',
    });
  });
});

describe('A4-05 — correction serveur de la tâche de tableur 2', () => {
  const attendues: SaisiesDeTableau = [
    { prix: 21.6, indice: 108 },
    { prix: 20.52, indice: 102.6 },
    { prix: 21.34, indice: 106.7 },
    { prix: 20.7, indice: 103.5 },
  ];

  it('accepte les huit saisies attendues du § 5.6', () => {
    const correction = corrigerTableau(TABLEAU, attendues);

    expect(correction.verdicts).toHaveLength(8);
    expect(correction.score).toBe(1);
    expect(correction.correcte).toBe(true);
  });

  it('reconnaît les taux additionnés ligne par ligne', () => {
    const correction = corrigerTableau(TABLEAU, [
      attendues[0],
      { prix: 20.6, indice: 103 },
      { prix: 21.4, indice: 107 },
      { prix: 20.8, indice: 104 },
    ]);

    expect(
      correction.verdicts
        .filter((ligne) => !ligne.juste)
        .map((ligne) => ligne.confusion),
    ).toEqual([
      'taux-successifs-additionnes',
      'taux-successifs-additionnes',
      'taux-successifs-additionnes',
      'taux-successifs-additionnes',
      'taux-successifs-additionnes',
      'taux-successifs-additionnes',
    ]);
    expect(correction.correcte).toBe(false);
  });

  it('calcule les colonnes déduites et la synthèse avec evaluerExpression', () => {
    expect(
      evaluerExpression('prix / avantPrix', { prix: 20.52, avantPrix: 21.6 }),
    ).toEqual({ valeur: 0.95, erreur: null });
    expect(evaluerExpression('indice - 100', { indice: 103.5 })).toEqual({
      valeur: 3.5,
      erreur: null,
    });
    expect(evaluerExpression('totalTaux', { totalTaux: 4 })).toEqual({
      valeur: 4,
      erreur: null,
    });
  });
});
