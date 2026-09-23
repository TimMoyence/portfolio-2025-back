import {
  buildCoursDeTest,
  EN_CATALOGUE,
} from '../../../../../test/factories/cours.factory';
import { buildPlanFeuille } from '../../../../../test/factories/corriges.factory';
import {
  BRIQUES_STOCKEES,
  buildCorrectionDeReponses,
  buildCorrectionDExemple,
  buildCoursDeBriques,
  buildEcranDeBrique,
  buildProprietesStockees,
  PARCOURS_ENIGMES,
} from '../../../../../test/factories/ecrans-stockes.factory';
import { buildVoteStocke } from '../../../../../test/factories/questions-stockees.factory';
import {
  clesDuCorrigeDans,
  clesSecretesDans,
} from '../../../../../test/helpers/cles-du-corrige';
import type { Cours, Ecran } from '../contrats/cours';
import type { Tolerance } from '../GradingCore';
import { questionNumerique, questionVote } from './Cours';
import type { AuMoinsUn, QuestionNumerique, QuestionVote } from './Cours';
import { lireCoursStocke } from './CoursStocke';
import { questionDeVote, slugOption } from './QuestionStockee';
import {
  PROPRIETE_PAR_BRIQUE,
  TAILLE_MEMO_TIRAGES,
  tirer,
  TirageAmbiguError,
} from './Tirage';
import type { CorrigeTire } from './Tirage';

const parIdentifiant = (
  premiere: { readonly id: string },
  seconde: { readonly id: string },
): number => premiere.id.localeCompare(seconde.id);

const CAS_NUMERIQUES_AMBIGUS: readonly {
  readonly cas: string;
  readonly solution: number;
  readonly pieges: AuMoinsUn<number>;
  readonly tolerance: Tolerance;
}[] = [
  {
    cas: 'un piege se confond avec la solution',
    solution: 100,
    pieges: [100.5],
    tolerance: { type: 'relative', valeur: 0.01 },
  },
  {
    cas: 'un piege ne se confond avec la solution que dans le sens inverse',
    solution: 101.52,
    pieges: [100],
    tolerance: { type: 'relative', valeur: 0.015 },
  },
  {
    cas: 'deux pieges se confondent entre eux',
    solution: 1,
    pieges: [5, 5],
    tolerance: { type: 'absolue', valeur: 0 },
  },
];

function questionNumeriqueFigee(
  solution: number,
  pieges: AuMoinsUn<number>,
  tolerance: Tolerance,
): QuestionNumerique {
  const [premier, ...suite] = pieges.map((valeur) => ({
    confusion: 'base-arrivee' as const,
    valeur: () => valeur,
  }));
  return questionNumerique({
    id: 'Q-FIGEE',
    concept: 'proportion',
    noteCompte: false,
    donnees: () => ({}),
    enonce: () => 'e',
    unite: null,
    solution: () => solution,
    tolerance,
    pieges: [premier, ...suite],
  });
}

function coursAUneQuestion(question: QuestionNumerique | QuestionVote): Cours {
  const commun = {
    ...EN_CATALOGUE,
    id: 'E',
    dureeMinutes: 1,
    concepts: ['proportion'] as const,
    notes: '',
  };
  const ecran: Ecran =
    question.type === 'numeric'
      ? { ...commun, brique: 'fp-numeric', question }
      : { ...commun, brique: 'fp-vote', question };
  return buildCoursDeTest({ ecrans: [ecran] });
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
      expect(clesDuCorrigeDans(tirer(cours, graine).sujet)).toEqual([]);
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

  it('associe a chaque option de vote du tirage le libelle affiche a l etudiant', () => {
    const tirage = tirer(cours, 3);
    const { options } = (
      ecranDe(tirage, 'E-OUV').donnees as {
        question: { options: { id: string; libelle: string }[] };
      }
    ).question;

    expect(tirage.libellesOptions['Q-TEST-RAPPEL']).toEqual(
      Object.fromEntries(options.map((option) => [option.id, option.libelle])),
    );
    expect(
      Object.keys(tirage.libellesOptions).sort((a, b) => a.localeCompare(b)),
    ).toEqual(['Q-TEST-EXIT', 'Q-TEST-RAPPEL', 'Q-TEST-VOTE']);
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

  it('garde au formateur l interaction du quiz et sa rubrique a dire', () => {
    const aDire = 'La bonne reponse est la moyenne ponderee.';
    const ecranQuiz = {
      id: 'E-QUIZ',
      brique: 'fp-quote',
      dureeMinutes: 3,
      concepts: ['proportion'],
      notes: `Objectif : conclure. À dire : ${aDire}`,
      proprietes: {
        texte: 'Quel taux global ?',
        auteur: null,
        source: null,
        interaction: {
          type: 'quiz',
          id: 'quiz-taux-global',
          question: 'Quel taux global ?',
          options: ['La moyenne simple', 'La moyenne ponderee'],
          context: aDire,
          competency: 'taux-global',
        },
        guide: { aDire },
      },
    } as unknown as Ecran;

    const sujet = JSON.stringify(
      tirer(buildCoursDeTest({ ecrans: [ecranQuiz] }), 0).sujet,
    );

    expect(sujet).not.toContain('"interaction"');
    expect(sujet).not.toContain(aDire);
  });

  it('range les donnees de chaque brique sous la propriete de la table partagee avec le front, soeurs du § 9.4 comprises', () => {
    const SOEURS_DU_CONTRAT = ['delaiMs', 'questionJumelle', 'etayage'];
    const ecrans = tirer(cours, 5).sujet.ecrans.filter(
      (ecran) => ecran.type !== 'questionnaire',
    );
    for (const ecran of ecrans) {
      const brique = ecran.type as keyof typeof PROPRIETE_PAR_BRIQUE;
      const [principale, ...soeurs] = Object.keys(ecran.donnees);
      expect(principale).toBe(PROPRIETE_PAR_BRIQUE[brique]);
      expect(
        soeurs.filter((soeur) => !SOEURS_DU_CONTRAT.includes(soeur)),
      ).toEqual([]);
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

  it('garde les identifiants stables d un vote stocke et n en melange que l ordre selon la graine', () => {
    const stocke = buildVoteStocke();
    const cours = coursAUneQuestion(questionDeVote(stocke));
    const identifiants = stocke.options.map((option) => option.id);
    const [bonne, ...pieges] = stocke.options;
    const ordres = new Set<string>();

    for (let graine = 0; graine < 30; graine += 1) {
      const tirage = tirer(cours, graine);
      const { options } = (
        ecranDe(tirage, 'E').donnees as {
          question: { options: { id: string; libelle: string }[] };
        }
      ).question;
      ordres.add(options.map((option) => option.id).join(','));
      expect([...options].sort(parIdentifiant)).toEqual(
        stocke.options
          .map(({ id, libelle }) => ({ id, libelle }))
          .sort(parIdentifiant),
      );
      expect(tirage.solutions[stocke.id]).toEqual({
        valeur: bonne.id,
        pieges: pieges.map((option) => ({
          valeur: option.id,
          misconception: option.confusion,
        })),
      });
      expect(new Set(Object.keys(tirage.libellesOptions[stocke.id]))).toEqual(
        new Set(identifiants),
      );
    }
    expect(ordres.size).toBeGreaterThan(1);
  });

  it('place la bonne option de vote a une position qui varie selon la graine', () => {
    const positions = new Set(
      Array.from(
        { length: 30 },
        (_, graine) => tirer(cours, graine).solutions['Q-TEST-RAPPEL'].valeur,
      ),
    );
    expect(positions).toEqual(new Set(['o1', 'o2', 'o3']));
  });

  it.each(CAS_NUMERIQUES_AMBIGUS)(
    'rejette une graine dont $cas',
    ({ solution, pieges, tolerance }) => {
      const question = questionNumeriqueFigee(solution, pieges, tolerance);
      expect(() => tirer(coursAUneQuestion(question), 1)).toThrow(
        TirageAmbiguError,
      );
    },
  );

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
    const infinie = questionNumeriqueFigee(Number.POSITIVE_INFINITY, [1], {
      type: 'absolue',
      valeur: 0,
    });
    for (const question of [doublon, infinie]) {
      expect(() => tirer(coursAUneQuestion(question), 1)).toThrow(
        TirageAmbiguError,
      );
    }
  });
});

describe('tirer (briques de la V3)', () => {
  const coursDe = (briques: readonly string[]) =>
    lireCoursStocke(
      buildCoursDeBriques(briques.map((brique) => buildEcranDeBrique(brique))),
    );
  const TOUTES = coursDe(BRIQUES_STOCKEES);
  const donneesDe = (tirage: ReturnType<typeof tirer>, brique: string) => {
    const ecran = tirage.sujet.ecrans.find(
      (candidat) => candidat.type === brique,
    );
    if (!ecran) throw new Error(`brique ${brique} absente du sujet`);
    return ecran.donnees as Record<string, any>;
  };
  const ordreDesOptions = (tirage: ReturnType<typeof tirer>, id: string) =>
    Object.keys(tirage.libellesOptions[id]).join(',');

  it('porte le titre public de chaque écran et ne livre aucune clé secrète', () => {
    for (let graine = 0; graine < 5; graine += 1) {
      const tirage = tirer(TOUTES, graine);
      expect(tirage.sujet.ecrans.map((ecran) => ecran.titre)).toEqual(
        BRIQUES_STOCKEES.map((brique) => `Écran ${brique}`),
      );
      expect(clesSecretesDans(tirage.sujet)).toEqual([]);
    }
  });

  it('projette chaque brique selon le § 9.4', () => {
    const tirage = tirer(TOUTES, 7);

    expect(donneesDe(tirage, 'fp-challenge').probleme).toMatchObject({
      id: 'b2-01-a1-audit-diapositive',
      strategies: [],
    });
    expect(donneesDe(tirage, 'fp-worked')).toMatchObject({
      exemple: { id: 'b2-01-a2-points' },
      etayage: 1,
    });
    expect(donneesDe(tirage, 'fp-pulse').sondage.id).toBe('b2-01-a1-jalon');
    expect(donneesDe(tirage, 'fp-sheet').plan.cellules).toEqual(
      buildPlanFeuille().cellules,
    );
    expect(donneesDe(tirage, 'fp-table-build').plan.colonnes).toHaveLength(3);
    expect(donneesDe(tirage, 'fp-escape').parcours.enigmes).toEqual(
      PARCOURS_ENIGMES.enigmes,
    );
    expect(donneesDe(tirage, 'fp-recall').delaiMs).toBe(45000);
    expect(donneesDe(tirage, 'fp-vote').questionJumelle.id).toBe(
      'b2-01-a3-remise-v2',
    );
    expect(donneesDe(tirage, 'questionnaire')).toMatchObject({
      intitule: 'Atelier 1 — Lire, rapporter, estimer',
      consigne: 'Calculatrice autorisée.',
      regime: 'focus',
      ordre: 'fixe',
    });
    expect(donneesDe(tirage, 'fp-concept4').definition.id).toBe(
      'b2-01-a3-machine',
    );
    expect(donneesDe(tirage, 'fp-plot').definition.description).toBe(
      'Courbe de la marge brute.',
    );
    expect(donneesDe(tirage, 'fp-story').recit.video.srcPoste).toBe(
      '/assets/cours/b2-01/v3/capsule-480p.webm',
    );
  });

  it('respecte l ordre fixe d un questionnaire pour toutes les graines', () => {
    for (let graine = 0; graine < 20; graine += 1) {
      const questions = donneesDe(tirer(TOUTES, graine), 'questionnaire')
        .questions as { donnees: { question: { id: string } } }[];
      expect(questions.map((question) => question.donnees.question.id)).toEqual(
        ['b2-01-a2-evolution-marge', 'b2-01-a2-part-marketplace'],
      );
    }
  });

  it('projette la banque de rappel en privé, options mélangées par un générateur dérivé', () => {
    const ordres = new Set<string>();
    for (let graine = 0; graine < 40; graine += 1) {
      const tirage = tirer(TOUTES, graine);
      expect(Object.keys(tirage.banque)).toEqual([
        'b2-01-r-compensation',
        'b2-01-r-points',
      ]);
      expect(tirage.solutions['b2-01-r-points'].valeur).toBe(
        slugOption('+1 point'),
      );
      expect(JSON.stringify(tirage.sujet)).not.toContain('b2-01-r-');
      ordres.add(ordreDesOptions(tirage, 'b2-01-r-compensation'));
    }
    expect(ordres.size).toBe(2);
    expect(donneesDe(tirer(TOUTES, 1), 'fp-spaced')).toEqual({
      rappel: {
        id: 'b2-01-a6-rappel',
        intitule: 'Rappel de mémoire',
        metadonnees: expect.any(Object),
      },
    });
  });

  it('mélange les cartes par un générateur dérivé sans toucher aux autres tirages', () => {
    const avecCartes = coursDe(['fp-cardsort', 'fp-spaced', 'fp-vote']);
    const sansCartes = coursDe(['fp-quote', 'fp-pro', 'fp-vote']);
    const ordres = new Set<string>();
    for (let graine = 0; graine < 40; graine += 1) {
      const tirage = tirer(avecCartes, graine);
      const cartes = donneesDe(tirage, 'fp-cardsort').plan.cartes as {
        id: string;
      }[];
      ordres.add(cartes.map((carte) => carte.id).join(','));
      expect(ordreDesOptions(tirage, 'b2-01-a3-sac-v1')).toBe(
        ordreDesOptions(tirer(sansCartes, graine), 'b2-01-a3-sac-v1'),
      );
    }
    expect(ordres.size).toBe(2);
  });

  it('T13 · sert le renvoi et la source d une correction à tous les rôles', () => {
    const exercice = buildEcranDeBrique('fp-worked', {
      screenId: 'B2-01-A2-06-POINTS',
      proprietes: {
        ...buildProprietesStockees('fp-worked'),
        renvoi: 'B2-01-A1-01-FP-QUOTE',
      },
    });
    const rappel = buildEcranDeBrique('fp-recall', {
      proprietes: {
        ...buildProprietesStockees('fp-recall'),
        consigne: 'Calculez sans calculatrice.',
      },
    });
    const cours = lireCoursStocke(
      buildCoursDeBriques([
        rappel,
        buildEcranDeBrique('fp-quote'),
        exercice,
        buildCorrectionDExemple(exercice.screenId),
        buildCorrectionDeReponses(exercice.screenId, 'B2-01-A2-06-REPONSES'),
      ]),
    );

    const [ouverture, , source, corrige, reponses] = tirer(cours, 0).sujet
      .ecrans;

    expect(ouverture.donnees).toMatchObject({
      consigne: 'Calculez sans calculatrice.',
    });
    expect(source).toMatchObject({ renvoi: 'B2-01-A1-01-FP-QUOTE' });
    expect(source).not.toHaveProperty('ecranCorrige');
    expect(corrige).toMatchObject({ ecranCorrige: 'B2-01-A2-06-POINTS' });
    expect(corrige.donnees).toMatchObject({
      pilote: true,
      corrigeDe: 'B2-01-A2-06-POINTS',
    });
    expect(reponses).toMatchObject({ ecranCorrige: 'B2-01-A2-06-POINTS' });
  });

  it('ne tire ni solution ni corrigé pour une production', () => {
    const tirage = tirer(TOUTES, 3);

    expect(Object.keys(tirage.solutions)).not.toEqual(
      expect.arrayContaining(['b2-01-a1-anatomie', 'b2-01-a6-e1-mix']),
    );
    expect(Object.keys(tirage.corriges)).not.toContain(
      'b2-01-a4-feuille-canaux',
    );
  });
});

describe('memo des tirages', () => {
  const cours = buildCoursDeTest();

  it('ne retire pas deux fois le meme cours avec la meme graine', () => {
    expect(tirer(cours, 4242)).toBe(tirer(cours, 4242));
  });

  it('retire a nouveau pour une autre graine', () => {
    expect(tirer(cours, 4243)).not.toBe(tirer(cours, 4242));
  });

  it('ne confond pas deux cours de meme slug servis en memoire', () => {
    const autreVersion = buildCoursDeTest({ titre: 'Version publiee 2' });

    expect(autreVersion.slug).toBe(cours.slug);
    expect(tirer(autreVersion, 4242).sujet.titre).toBe('Version publiee 2');
    expect(tirer(cours, 4242).sujet.titre).toBe(cours.titre);
  });

  it('retire a nouveau une graine evincee du memo sans changer le resultat', () => {
    const attendu = tirer(cours, 5000);
    for (let graine = 5001; graine <= 5000 + TAILLE_MEMO_TIRAGES; graine += 1) {
      tirer(cours, graine);
    }
    const apresEviction = tirer(cours, 5000);

    expect(apresEviction).not.toBe(attendu);
    expect(apresEviction).toEqual(attendu);
  });
});
