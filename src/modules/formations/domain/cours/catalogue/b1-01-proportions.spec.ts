import { matchesSolution } from '../../GradingCore';
import type { Tolerance } from '../../GradingCore';
import { creerRng, creerTirage } from '../Aleatoire';
import { questionsDe, questionsDuCours } from '../Cours';
import type { Ecran, Question } from '../Cours';
import type { ConfusionId } from '../banque/confusions';
import { B1_01_PROPORTIONS } from './b1-01-proportions';

const CONFUSIONS_REQUISES: readonly ConfusionId[] = [
  'hausse-baisse-symetriques',
  'taux-successifs-additionnes',
  'reciproque-meme-taux',
  'base-arrivee',
  'ecart-absolu-au-lieu-du-taux',
  'coefficient-confondu-avec-taux',
  'taux-valeur-facteur-cent',
  'raisonnement-additif',
];
const GRAINES = 500;
const ECART_MEDIAN = 1e-6;
const BRIQUES_DE_REMEDIATION = new Set(['fp-worked', 'fp-concept4']);

const cours = B1_01_PROPORTIONS;
const questions = questionsDuCours(cours);

function tirageDe(graine: number) {
  return creerTirage(creerRng(graine));
}

function textesTires(question: Question, graine: number): string[] {
  const tiree = question.generer(tirageDe(graine));
  if (tiree.type === 'numeric') {
    return [tiree.enonce];
  }
  return [
    tiree.enonce,
    tiree.bonne,
    ...tiree.pieges.map((piege) => piege.libelle),
  ];
}

function decimalesDemandees(tolerance: Tolerance): number {
  if (tolerance.type === 'decimales') {
    return tolerance.valeur;
  }
  return Math.ceil(-Math.log10(2 * tolerance.valeur) - ECART_MEDIAN);
}

function arrondisCorrects(valeur: number, decimales: number): number[] {
  const facteur = 10 ** decimales;
  const echelle = valeur * facteur;
  const partie = echelle - Math.floor(echelle);
  if (Math.abs(partie - 0.5) < ECART_MEDIAN) {
    return [Math.floor(echelle) / facteur, Math.ceil(echelle) / facteur];
  }
  return [Math.round(echelle) / facteur];
}

function notesDe(ecran: Ecran): string {
  return ecran.notes;
}

describe('B1_01_PROPORTIONS', () => {
  it('se publie sous son slug pour une seance de 195 minutes', () => {
    const minutes = cours.ecrans.reduce(
      (total, ecran) => total + ecran.dureeMinutes,
      0,
    );
    expect(cours.slug).toBe('b1-01-proportions');
    expect(cours.dureeMinutes).toBe(195);
    expect(minutes).toBe(195);
  });

  it('pose au moins vingt-quatre questions', () => {
    expect(questions.length).toBeGreaterThanOrEqual(24);
  });

  it('ouvre sur un rappel et se clot sur un billet de sortie', () => {
    expect(cours.ecrans[0].brique).toBe('fp-recall');
    expect(cours.ecrans[cours.ecrans.length - 1].brique).toBe('fp-exit');
  });

  it('cite les huit confusions du cours', () => {
    const citees = new Set(
      questions.flatMap((question) => question.confusions),
    );
    expect([...CONFUSIONS_REQUISES].filter((id) => !citees.has(id))).toEqual(
      [],
    );
  });

  it('remedie chaque confusion par un exemple resolu ou un concept a quatre faces', () => {
    const briques = new Map(
      cours.ecrans.map((ecran) => [ecran.id, ecran.brique]),
    );
    for (const [confusion, cible] of Object.entries(cours.remediations)) {
      const brique = briques.get(cible ?? '') ?? 'absente';
      expect({
        confusion,
        brique,
        remedie: BRIQUES_DE_REMEDIATION.has(brique),
      }).toEqual({ confusion, brique, remedie: true });
    }
  });

  it('ne note que le sas d entree en examen et le billet de sortie', () => {
    const notees = new Set(
      cours.ecrans
        .filter(
          (ecran) =>
            (ecran.brique === 'questionnaire' && ecran.regime === 'examen') ||
            ecran.brique === 'fp-exit',
        )
        .flatMap((ecran) => questionsDe(ecran).map((question) => question.id)),
    );
    const sas = cours.ecrans.filter(
      (ecran) => ecran.brique === 'questionnaire' && ecran.regime === 'examen',
    );
    expect(sas).toHaveLength(1);
    expect(questionsDe(sas[0])).toHaveLength(4);
    for (const question of questions) {
      expect({ id: question.id, noteCompte: question.noteCompte }).toEqual({
        id: question.id,
        noteCompte: notees.has(question.id),
      });
    }
  });

  it('manipule au moins un concept a quatre faces et un graphique', () => {
    const briques = cours.ecrans.map((ecran) => ecran.brique);
    expect(briques).toContain('fp-concept4');
    expect(briques).toContain('fp-plot');
  });

  it('ouvre les notes de chaque ecran sur sa duree en minutes', () => {
    for (const ecran of cours.ecrans) {
      const entete = `[${ecran.dureeMinutes} min`;
      expect({
        id: ecran.id,
        minutee: notesDe(ecran).startsWith(entete),
      }).toEqual({ id: ecran.id, minutee: true });
    }
  });

  it('annonce les trois pauses de dix minutes dans les notes', () => {
    const annonces = cours.ecrans.filter((ecran) =>
      /pause de 10 minutes/i.test(notesDe(ecran)),
    );
    expect(annonces).toHaveLength(3);
  });

  it('fixe un seuil de decision sur chaque pivot', () => {
    for (const ecran of cours.ecrans) {
      if (ecran.brique === 'fp-vote' || ecran.brique === 'fp-numeric') {
        expect({ id: ecran.id, seuil: ecran.seuil }).toEqual({
          id: ecran.id,
          seuil: expect.any(Number),
        });
      }
    }
  });

  it('redige des enonces et des options en francais, sans valeur indefinie', () => {
    for (const question of questions) {
      for (let graine = 0; graine < GRAINES; graine += 1) {
        for (const texte of textesTires(question, graine)) {
          expect({
            id: question.id,
            texte,
            defaut: /\d\.\d|(?<![\d,])\d{4,}|NaN|undefined|Infinity/.test(
              texte,
            ),
          }).toEqual({ id: question.id, texte, defaut: false });
        }
      }
    }
  });

  it('accepte la solution arrondie comme demande, dans les deux sens d une valeur mediane', () => {
    for (const question of questions) {
      if (question.type !== 'numeric') {
        continue;
      }
      const decimales = decimalesDemandees(question.tolerance);
      for (let graine = 0; graine < GRAINES; graine += 1) {
        const { solution } = question.generer(tirageDe(graine));
        for (const arrondi of arrondisCorrects(solution, decimales)) {
          expect({
            id: question.id,
            solution,
            arrondi,
            accepte: matchesSolution(arrondi, solution, question.tolerance),
          }).toEqual({ id: question.id, solution, arrondi, accepte: true });
        }
      }
    }
  });
});
