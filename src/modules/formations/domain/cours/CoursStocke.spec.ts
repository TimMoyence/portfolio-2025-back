import {
  buildCoursStocke,
  buildEcranStocke,
  buildEcranStockeAvec,
  buildQuizNote,
} from '../../../../../test/factories/cours-stocke.factory';
import { buildQuizAffiche } from '../../../../../test/factories/presentation-visuelle.factory';
import { creerRng, creerTirage } from './Aleatoire';
import type { EcranDeCoursBrut } from './CoursStocke';
import { ContenuDeCoursInvalideError, lireCoursStocke } from './CoursStocke';

const TIRAGE = creerTirage(creerRng(1));

function coursAvecEcran(ecran: EcranDeCoursBrut) {
  return buildCoursStocke({ ecrans: [ecran] });
}

describe('lireCoursStocke', () => {
  it('construit le cours servi et la question notée du quiz stocké, sans rien inventer', () => {
    const cours = lireCoursStocke(buildCoursStocke());
    const [ecran] = cours.ecrans;
    const tiree = ecran.question?.generer(TIRAGE);

    expect(cours).toMatchObject({
      slug: 'b2-01-traitement-information-chiffree',
      concepts: ['proportion'],
      remediations: {},
    });
    expect(ecran).toMatchObject({
      id: 'B2-01-S03-PREDICTION',
      brique: 'fp-story',
      notes: 'À dire : vérifier le repère avant la pente.',
      guide: { aDire: 'Avant de commenter la pente, vérifiez le repère.' },
    });
    expect(ecran.question).toMatchObject({
      id: 'quiz-1',
      type: 'vote',
      concept: 'proportion',
      noteCompte: true,
      confusions: ['raisonnement-additif', 'taux-valeur-facteur-cent'],
    });
    expect(tiree).toEqual({
      type: 'vote',
      enonce: 'Que vérifier avant de comparer deux courbes ?',
      bonne: 'o1',
      bonneLibelle: 'Les unités et l’échelle',
      pieges: [
        {
          confusion: 'raisonnement-additif',
          libelle: 'La couleur',
          optionId: 'o2',
        },
        {
          confusion: 'taux-valeur-facteur-cent',
          libelle: 'La taille du titre',
          optionId: 'o3',
        },
      ],
    });
  });

  it('associe chaque confusion au piège de même rang, bonne réponse sautée', () => {
    const cours = lireCoursStocke(
      coursAvecEcran(
        buildEcranStockeAvec({
          interaction: buildQuizNote({ correctIndex: 1 }),
          correction: {
            correctIndex: 1,
            explanation: 'La couleur ne prouve rien.',
            nextAction: 'Lire l’axe.',
          },
        }),
      ),
    );

    expect(cours.ecrans[0].question?.generer(TIRAGE)).toMatchObject({
      bonne: 'o2',
      pieges: [
        { confusion: 'raisonnement-additif', optionId: 'o1' },
        { confusion: 'taux-valeur-facteur-cent', optionId: 'o3' },
      ],
    });
  });

  it('lit un écran sans quiz ni guide sans lui en attribuer', () => {
    const cours = lireCoursStocke(
      coursAvecEcran(
        buildEcranStocke({
          screenId: 'B2-01-S01-ACCROCHE',
          proprietes: {
            presentation: {
              version: 1,
              screenId: 'B2-01-S01-ACCROCHE',
              renderer: 'hero',
              title: 'Lire un chiffre',
            },
          },
        }),
      ),
    );

    expect(cours.ecrans[0].question).toBeUndefined();
    expect(cours.ecrans[0].guide).toBeUndefined();
  });

  it('lit un écran historique titré sans présentation, tel que la migration 1779600 le relit', () => {
    const ecran = buildEcranStocke({
      notes: '',
      proprietes: {
        titre: 'B2-01-S03-PREDICTION',
        paragraphes: ['Contenu visuel servi par le deck B2 partagé.'],
        interaction: buildQuizNote(),
      },
    });

    expect(lireCoursStocke(coursAvecEcran(ecran)).ecrans[0].question?.id).toBe(
      'quiz-1',
    );
  });

  const INVALIDES: ReadonlyArray<readonly [string, EcranDeCoursBrut]> = [
    [
      'un concept inconnu dans le quiz',
      buildEcranStockeAvec({
        interaction: buildQuizNote({ concept: 'marge' }),
      }),
    ],
    [
      'une confusion inconnue',
      buildEcranStockeAvec({
        interaction: buildQuizNote({
          confusions: ['raisonnement-additif', 'unite-oubliee'],
        }),
      }),
    ],
    [
      'une confusion manquante pour un piège',
      buildEcranStockeAvec({
        interaction: buildQuizNote({ confusions: ['raisonnement-additif'] }),
      }),
    ],
    [
      'un quiz sans identifiants d options',
      buildEcranStockeAvec({
        interaction: buildQuizNote({ optionIds: undefined }),
      }),
    ],
    [
      'des identifiants d options en double',
      buildEcranStockeAvec({
        interaction: buildQuizNote({ optionIds: ['o1', 'o1', 'o3'] }),
      }),
    ],
    [
      'un quiz qui ne dit pas s il compte dans la note',
      buildEcranStockeAvec({
        interaction: buildQuizNote({ noteCompte: undefined }),
      }),
    ],
    [
      'une bonne réponse hors des options',
      buildEcranStockeAvec({
        interaction: buildQuizNote({ correctIndex: 3 }),
      }),
    ],
    [
      'une correction qui contredit la bonne réponse notée',
      buildEcranStockeAvec({
        correction: {
          correctIndex: 2,
          explanation: 'Autre réponse.',
          nextAction: 'Lire l’axe.',
        },
      }),
    ],
    [
      'un quiz affiché qui diffère du quiz noté',
      buildEcranStockeAvec({
        presentation: {
          version: 2,
          screenId: 'B2-01-S03-PREDICTION',
          renderer: 'quiz',
          props: {
            questionData: buildQuizAffiche({ options: ['A', 'B', 'C'] }),
          },
        },
      }),
    ],
    [
      'une propriété de guide inconnue',
      buildEcranStockeAvec({ guide: { objective: 'Faire émerger' } }),
    ],
    [
      'une propriété d écran inconnue',
      buildEcranStockeAvec({ remarque: 'hors contrat' }),
    ],
    [
      'une présentation visuelle hors contrat',
      buildEcranStockeAvec({
        presentation: {
          version: 2,
          screenId: 'B2-01-S03-PREDICTION',
          renderer: 'carrousel',
          props: {},
        },
      }),
    ],
    [
      'une présentation rattachée à un autre écran',
      buildEcranStockeAvec({
        presentation: {
          version: 2,
          screenId: 'B2-01-S04-AXES',
          renderer: 'quiz',
          props: { questionData: buildQuizAffiche() },
        },
      }),
    ],
    [
      'un écran sans contenu affichable',
      buildEcranStocke({ proprietes: { interaction: buildQuizNote() } }),
    ],
    [
      'une brique sans contrat de stockage',
      buildEcranStocke({ brique: 'fp-quote' }),
    ],
    ['un écran sans concept', buildEcranStocke({ concepts: [] })],
    ['une durée nulle', buildEcranStocke({ dureeMinutes: 0 })],
  ];

  it.each(INVALIDES)('refuse %s au lieu de le rafistoler', (_cas, ecran) => {
    expect(() => lireCoursStocke(coursAvecEcran(ecran))).toThrow(
      ContenuDeCoursInvalideError,
    );
  });

  it('refuse un cours sans écran', () => {
    expect(() => lireCoursStocke(buildCoursStocke({ ecrans: [] }))).toThrow(
      ContenuDeCoursInvalideError,
    );
  });

  it('nomme le cours, sa version et le chemin du champ fautif', () => {
    expect(() =>
      lireCoursStocke(
        coursAvecEcran(
          buildEcranStockeAvec({
            interaction: buildQuizNote({ concept: 'marge' }),
          }),
        ),
      ),
    ).toThrow(
      /b2-01-traitement-information-chiffree v2[\s\S]*ecrans\[0\]\.proprietes\.interaction\.concept/,
    );
  });
});
