import {
  buildCoursStocke,
  buildEcranStocke,
  buildEcranStockeAvec,
} from '../../../../../../test/factories/formations/cours/cours-stocke.factory';
import { buildReflexion } from '../../../../../../test/factories/formations/cours/presentation-visuelle.factory';
import type { EcranDeCoursBrut } from './CoursStocke';
import { ContenuDeCoursInvalideError, lireCoursStocke } from './CoursStocke';

function coursAvecEcran(ecran: EcranDeCoursBrut) {
  return buildCoursStocke({ ecrans: [ecran] });
}

describe('lireCoursStocke', () => {
  it('construit le cours servi depuis le contenu stocké, sans rien inventer', () => {
    const cours = lireCoursStocke(buildCoursStocke());

    expect(cours).toMatchObject({
      slug: 'b2-01-traitement-information-chiffree',
      concepts: ['proportion'],
      remediations: {},
      medias: [],
    });
    expect(cours.ecrans[0]).toMatchObject({
      id: 'B2-01-S03-PREDICTION',
      titre: null,
      diffusion: 'seance',
      brique: 'fp-story',
      notes: 'À dire : vérifier le repère avant la pente.',
    });
  });

  it('lit un écran historique titré sans présentation, tel que la migration 1779600 le relit', () => {
    const ecran = buildEcranStocke({
      notes: '',
      proprietes: {
        titre: 'B2-01-S03-PREDICTION',
        paragraphes: ['Contenu visuel servi par le deck B2 partagé.'],
      },
    });

    expect(lireCoursStocke(coursAvecEcran(ecran)).ecrans[0]).toMatchObject({
      brique: 'fp-story',
      proprietes: { titre: 'B2-01-S03-PREDICTION' },
    });
  });

  const INVALIDES: ReadonlyArray<readonly [string, EcranDeCoursBrut]> = [
    [
      'un quiz noté, que le contrat ne publie plus',
      buildEcranStockeAvec({ interaction: { id: 'quiz-1', type: 'quiz' } }),
    ],
    [
      'une correction qui désigne une option de quiz',
      buildEcranStockeAvec({
        correction: {
          correctIndex: 0,
          explanation: 'Une forme ne suffit jamais.',
          nextAction: 'Lire l’axe.',
        },
      }),
    ],
    [
      'une présentation de version 1, que le contrat ne publie plus',
      buildEcranStockeAvec({
        presentation: {
          version: 1,
          screenId: 'B2-01-S03-PREDICTION',
          renderer: 'hero',
          title: 'Lire un chiffre',
        },
      }),
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
          renderer: 'reflection',
          props: { promptData: buildReflexion() },
        },
      }),
    ],
    ['un écran sans contenu affichable', buildEcranStocke({ proprietes: {} })],
    [
      'une brique sans contrat de stockage',
      buildEcranStocke({ brique: 'fp-carrousel' }),
    ],
    [
      'des propriétés de récit sous une brique de cas',
      buildEcranStocke({ brique: 'fp-pro' }),
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
        coursAvecEcran(buildEcranStocke({ concepts: ['marge'] })),
      ),
    ).toThrow(
      /b2-01-traitement-information-chiffree v2[\s\S]*ecrans\[0\]\.concepts/,
    );
  });
});
