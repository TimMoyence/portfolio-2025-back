import { buildCoursDeTest } from '../../../../../test/factories/cours.factory';
import { questionNumerique, questionVote } from './Cours';
import type { Cours } from './Cours';
import { PROPRIETE_PAR_BRIQUE, tirer, TirageAmbiguError } from './Tirage';
import type { CorrigeTire } from './Tirage';

const CLES_INTERDITES = [
  'solutions',
  'solution',
  'pieges',
  'confusion',
  'confusions',
  'misconception',
  'notes',
  'seuil',
  'remediations',
  'bonne',
  'corriges',
];

function cles(valeur: unknown): string[] {
  if (Array.isArray(valeur)) return valeur.flatMap(cles);
  if (valeur !== null && typeof valeur === 'object') {
    return Object.entries(valeur).flatMap(([cle, contenu]) => [
      cle,
      ...cles(contenu),
    ]);
  }
  return [];
}

function ecranDe(tirage: ReturnType<typeof tirer>, id: string) {
  const ecran = tirage.sujet.ecrans.find((candidat) => candidat.id === id);
  if (!ecran) throw new Error(`ecran ${id} absent`);
  return ecran;
}

describe('tirer', () => {
  const cours = buildCoursDeTest();

  it('rend le meme sujet et les memes solutions pour la meme graine', () => {
    expect(tirer(cours, 77)).toEqual(tirer(cours, 77));
  });

  it('fait varier les donnees d une graine a l autre', () => {
    const enonces = new Set(
      Array.from({ length: 20 }, (_, graine) =>
        JSON.stringify(ecranDe(tirer(cours, graine), 'E-NUM').donnees),
      ),
    );
    expect(enonces.size).toBeGreaterThan(1);
  });

  it('garde l ordre des ecrans identique pour toutes les graines', () => {
    for (let graine = 0; graine < 30; graine += 1) {
      expect(
        tirer(cours, graine).sujet.ecrans.map((ecran) => ecran.id),
      ).toEqual(cours.ecrans.map((ecran) => ecran.id));
    }
  });

  it('melange les questions d un questionnaire selon la graine', () => {
    const ordres = new Set(
      Array.from({ length: 50 }, (_, graine) => {
        const donnees = ecranDe(tirer(cours, graine), 'E-PRATIQUE').donnees as {
          questions: { donnees: { question: { id: string } } }[];
        };
        return donnees.questions
          .map((question) => question.donnees.question.id)
          .join(',');
      }),
    );
    expect(ordres.size).toBeGreaterThan(1);
  });

  it('ne livre ni corrige, ni piege, ni confusion, ni note dans le sujet', () => {
    for (let graine = 0; graine < 10; graine += 1) {
      const presentes = cles(tirer(cours, graine).sujet);
      expect(presentes.filter((cle) => CLES_INTERDITES.includes(cle))).toEqual(
        [],
      );
    }
  });

  it('enregistre la solution numerique et ses pieges types', () => {
    const tirage = tirer(cours, 12);
    const solution = tirage.solutions['Q-TEST-NUM'];
    expect(typeof solution.valeur).toBe('number');
    expect(solution.pieges).toHaveLength(1);
    expect(solution.pieges[0].misconception).toBe(
      'ecart-absolu-au-lieu-du-taux',
    );
  });

  it('designe la bonne option de vote par son identifiant anonyme', () => {
    const tirage = tirer(cours, 3);
    const question = (
      ecranDe(tirage, 'E-OUV').donnees as {
        question: { options: { id: string; libelle: string }[] };
      }
    ).question;
    const solution = tirage.solutions['Q-TEST-RAPPEL'];
    expect(question.options.map((option) => option.id)).toEqual([
      'o1',
      'o2',
      'o3',
    ]);
    expect(
      question.options.find((option) => option.id === solution.valeur)?.libelle,
    ).toBe('plus bas qu’au départ');
    const libellesPieges = solution.pieges.map(
      (piege) =>
        question.options.find((option) => option.id === piege.valeur)?.libelle,
    );
    expect(libellesPieges).toHaveLength(2);
    expect(libellesPieges).toEqual(
      expect.arrayContaining([
        'plus haut qu’au départ',
        'revenu au prix de départ',
      ]),
    );
  });

  it('projette le billet de sortie avec son invite', () => {
    const donnees = ecranDe(tirer(cours, 1), 'E-EXIT').donnees as {
      billet: { id: string; invite: string; options: unknown[] };
    };
    expect(donnees.billet.id).toBe('Q-TEST-EXIT');
    expect(donnees.billet.invite).toBe('Qu’est-ce qui reste flou ?');
    expect(donnees.billet.options).toHaveLength(3);
  });

  it('porte les metadonnees de brique sans confusion ciblee', () => {
    const donnees = ecranDe(tirer(cours, 1), 'E-NUM').donnees as {
      question: { metadonnees: Record<string, unknown> };
    };
    expect(donnees.question.metadonnees).toEqual({
      concepts: ['taux-evolution'],
      misconceptionsCiblees: [],
      dureeMinutes: 5,
      modalite: 'solo',
      regime: 'ouvert',
    });
  });

  it('projette une brique d exposition sous sa propriete', () => {
    const donnees = ecranDe(tirer(cours, 1), 'E-CONCEPT').donnees as {
      definition: { id: string; calcul: string };
    };
    expect(donnees.definition.id).toBe('E-CONCEPT');
    expect(donnees.definition.calcul).toBe('prix*(1+taux/100)');
  });

  it('range les donnees de chaque brique sous la propriete de la table partagee avec le front', () => {
    const ecrans = tirer(cours, 5).sujet.ecrans.filter(
      (ecran) => ecran.type !== 'questionnaire',
    );
    for (const ecran of ecrans) {
      const brique = ecran.type as keyof typeof PROPRIETE_PAR_BRIQUE;
      expect(Object.keys(ecran.donnees)).toEqual([
        PROPRIETE_PAR_BRIQUE[brique],
      ]);
    }
  });

  it('rend le corrige du presentateur', () => {
    const tirage = tirer(cours, 8);
    const attendu: CorrigeTire = {
      bonneReponse: 'plus bas qu’au départ',
      confusions: ['hausse-baisse-symetriques', 'raisonnement-additif'],
    };
    expect(tirage.corriges['Q-TEST-VOTE']).toEqual(attendu);
    expect(Number(tirage.corriges['Q-TEST-NUM'].bonneReponse)).toBeCloseTo(
      tirage.solutions['Q-TEST-NUM'].valeur as number,
      5,
    );
  });

  it('rejette une graine dont un piege se confond avec la solution', () => {
    const ambigue = questionNumerique({
      id: 'Q-AMBIGUE',
      concept: 'proportion',
      noteCompte: false,
      donnees: () => ({}),
      enonce: () => 'e',
      unite: null,
      solution: () => 100,
      tolerance: { type: 'relative', valeur: 0.01 },
      pieges: [{ confusion: 'base-arrivee', valeur: () => 100.5 }],
    });
    const cours2: Cours = buildCoursDeTest({
      ecrans: [
        {
          id: 'E',
          brique: 'fp-numeric',
          dureeMinutes: 1,
          concepts: ['proportion'],
          notes: '',
          question: ambigue,
        },
      ],
    });
    expect(() => tirer(cours2, 1)).toThrow(TirageAmbiguError);
  });

  it('rejette une graine qui produit deux options identiques ou une valeur non finie', () => {
    const doublon = questionVote({
      id: 'Q-DOUBLON',
      concept: 'proportion',
      noteCompte: false,
      donnees: () => ({}),
      enonce: () => 'e',
      bonne: () => 'même',
      pieges: [{ confusion: 'base-arrivee', libelle: () => ' même ' }],
    });
    const infinie = questionNumerique({
      id: 'Q-INF',
      concept: 'proportion',
      noteCompte: false,
      donnees: () => ({}),
      enonce: () => 'e',
      unite: null,
      solution: () => Number.POSITIVE_INFINITY,
      tolerance: { type: 'absolue', valeur: 0 },
      pieges: [{ confusion: 'base-arrivee', valeur: () => 1 }],
    });
    for (const question of [doublon, infinie]) {
      const brique = question.type === 'vote' ? 'fp-vote' : 'fp-numeric';
      const cours3 = buildCoursDeTest({
        ecrans: [
          {
            id: 'E',
            brique,
            dureeMinutes: 1,
            concepts: ['proportion'],
            notes: '',
            question,
          } as never,
        ],
      });
      expect(() => tirer(cours3, 1)).toThrow(TirageAmbiguError);
    }
  });
});
