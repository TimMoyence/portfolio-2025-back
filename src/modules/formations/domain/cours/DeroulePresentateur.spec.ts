import {
  buildCoursAUneQuestion,
  buildCoursDeTest,
  QUESTION_A_CONFUSION_REPETEE,
} from '../../../../../test/factories/cours.factory';
import {
  BRIQUES_STOCKEES,
  buildCoursDeBriques,
  buildEcranAPieceJointe,
  buildEcranDeBrique,
  buildPieceJointe,
  buildPieceJointeReservee,
  buildQuestionnaireCorrigeSurPlace,
  EXPLICATIONS_SUR_PLACE,
} from '../../../../../test/factories/ecrans-stockes.factory';
import { buildCoursDuContenu } from '../../../../../test/factories/contenus-de-cours.factory';
import {
  CONTENUS,
  COURS_B2_01,
  COURS_B2_03,
  COURS_B2_06,
} from '../../../../../test/factories/contenus-publies';
import { PRESENTATIONS_VISUELLES_VALIDES } from '../../../../../test/factories/presentation-visuelle.factory';
import {
  ESPACE_FINE_INSECABLE,
  ESPACE_INSECABLE,
} from '../../../../common/domain/texte/sans-espaces-typographiques';
import { CONFUSIONS } from './banque/confusions';
import { lireCoursStocke } from './CoursStocke';
import { deroulePresentateur } from './DeroulePresentateur';
import { correctionDeLEcranRevele } from './Diffusion';
import { SEUIL_PAR_DEFAUT } from './EcranServi';
import type { CorrigePresentateur, EcranDeroule } from './DeroulePresentateur';
import { tirer } from './Tirage';

describe('deroulePresentateur', () => {
  const cours = buildCoursDeTest();
  const deroule = deroulePresentateur(cours, 424);
  const ecran = (id: string): EcranDeroule =>
    deroule.ecrans.find((candidat) => candidat.id === id)!;

  it('sert au pupitre la pièce jointe publique d un écran du catalogue', () => {
    const avecClasseur = lireCoursStocke(
      buildCoursDeBriques([
        buildEcranDeBrique('fp-quote'),
        buildEcranAPieceJointe('fp-story', buildPieceJointe(), {
          diffusion: 'catalogue',
        }),
      ]),
    );

    const [citation, recit] = deroulePresentateur(avecClasseur, 0).ecrans;

    expect(recit.pieceJointe).toEqual(buildPieceJointe());
    expect(citation).not.toHaveProperty('pieceJointe');
  });

  it('sert au pupitre une pièce réservée sans nommer son classeur, téléchargé par la séance', () => {
    const avecReprise = lireCoursStocke(
      buildCoursDeBriques([
        buildEcranAPieceJointe('fp-vote', buildPieceJointeReservee()),
      ]),
    );

    const [vote] = deroulePresentateur(avecReprise, 0).ecrans;

    expect(vote.pieceJointe).toEqual({
      libelle: buildPieceJointeReservee().libelle,
      reservee: true,
    });
  });

  it('reprend le sujet du tirage de reference', () => {
    const sujet = tirer(cours, 424).sujet;
    expect(
      deroule.ecrans.map(({ id, type, titre, duree, interactif, donnees }) => ({
        id,
        type,
        titre,
        duree,
        interactif,
        donnees,
      })),
    ).toEqual(sujet.ecrans);
  });

  it('ajoute les notes, le seuil et le corrige de chaque ecran', () => {
    expect(ecran('E-OUV').notes).toBe('Rappel');
    expect(ecran('E-OUV').seuil).toBeCloseTo(0.6);
    expect(ecran('E-NUM').seuil).toBe(SEUIL_PAR_DEFAUT);
    expect(ecran('E-CITATION').seuil).toBeNull();
    expect(ecran('E-EXIT').seuil).toBeNull();
    expect(
      ecran('E-PRATIQUE').corriges.map((corrige) => corrige.questionId),
    ).toEqual(['Q-TEST-NUM-2', 'Q-TEST-NUM-3', 'Q-TEST-VOTE']);
    const corrigeAttendu: CorrigePresentateur = {
      questionId: 'Q-TEST-RAPPEL',
      bonneReponse: 'plus bas qu’au départ',
      confusions: [
        {
          id: 'hausse-baisse-symetriques',
          libelle: CONFUSIONS['hausse-baisse-symetriques'].libelle,
        },
        {
          id: 'raisonnement-additif',
          libelle: CONFUSIONS['raisonnement-additif'].libelle,
        },
      ],
    };
    expect(ecran('E-OUV').corriges[0]).toEqual(corrigeAttendu);
  });

  it('ne cite qu une fois la confusion portée par deux distracteurs', () => {
    const repetee = deroulePresentateur(
      buildCoursAUneQuestion(QUESTION_A_CONFUSION_REPETEE),
      424,
    );

    expect(
      repetee.ecrans[0].corriges[0].confusions.map((confusion) => confusion.id),
    ).toEqual(['hausse-baisse-symetriques']);
  });

  it('expose les remediations du cours', () => {
    expect(deroule.remediations).toEqual({
      'hausse-baisse-symetriques': 'E-REM',
      'raisonnement-additif': 'E-REM',
      'ecart-absolu-au-lieu-du-taux': 'E-REM',
    });
  });
});

describe('deroulePresentateur (réflexion attendue, B-70)', () => {
  it('sert au pupitre, pour chaque récit à réflexion des cours, la réflexion révélée à l étudiant', () => {
    const servies = CONTENUS.flatMap((contenu) => {
      const cours = buildCoursDuContenu(contenu);
      const tirage = tirer(cours, 0);
      return deroulePresentateur(cours, 0).ecrans.map(
        (ecran, rang) =>
          [
            ecran.id,
            ecran.reflexion,
            correctionDeLEcranRevele(cours.ecrans[rang], tirage)?.reflexion ??
              null,
          ] as const,
      );
    });

    expect(
      servies.filter(([, pupitre]) => pupitre !== null).length,
    ).toBeGreaterThan(0);
    expect(servies.map(([id, pupitre]) => [id, pupitre])).toEqual(
      servies.map(([id, , etudiant]) => [id, etudiant]),
    );
  });
});

describe('deroulePresentateur (affichage d une feuille corrigée, F-37)', () => {
  const attendusServis = (contenu: (typeof CONTENUS)[number]) =>
    deroulePresentateur(buildCoursDuContenu(contenu), 0).ecrans.flatMap(
      (ecran) =>
        ecran.corrigeEcran?.type === 'feuille'
          ? ecran.corrigeEcran.attendus.map((attendu) => [
              `${ecran.id} ${attendu.reference}`,
              attendu.affichage,
            ])
          : [],
    );

  it('écrit chaque valeur attendue comme le tableau de l élève : un taux à quatre décimales, un montant à deux, un texte tel quel', () => {
    const servis = Object.fromEntries([
      ...attendusServis(COURS_B2_03),
      ...attendusServis(COURS_B2_06),
    ]);

    expect(servis['B2-06-A1-11-TABLEUR-VENTES B3']).toBe('424,73');
    expect(servis['B2-06-A1-11-TABLEUR-VENTES C3']).toBe('0,0618');
    expect(servis['B2-03-A1-11-TABLEUR-SI-OU D2']).toBe('Visa');
    expect(servis['B2-03-A1-11-TABLEUR-SI-OU D4']).toBe('Non');
  });

  it('remplit au pupitre le tableau de la toile, coefficients et évolution réelle calculés par le serveur', () => {
    const toile = deroulePresentateur(
      buildCoursDuContenu(COURS_B2_01),
      0,
    ).ecrans.find(({ id }) => id === 'B2-01-A4-05-INDICE-TOILE');
    if (toile?.corrigeEcran?.type !== 'tableau') {
      throw new Error('corrigé de tableau attendu sur l indice de la toile');
    }
    const { lignes, synthese } = toile.corrigeEcran.tableauCorrige;

    expect({
      coef: lignes.map(({ valeurs }) => valeurs.coef.affichage),
      synthese: synthese.map(({ affichage }) => affichage),
    }).toEqual({
      coef: ['1,0800', '0,9500', '1,0400', '0,9700'],
      synthese: ['4,00 %', '3,50 %'],
    });
  });

  it('F-11 · écrit chaque nombre servi au pupitre à la française, milliers séparés par une espace fine insécable : attendus, tableaux corrigés, sorties des machines', () => {
    const affiches = (noeud: unknown): [number, string][] => {
      if (Array.isArray(noeud)) {
        return noeud.flatMap(affiches);
      }
      if (typeof noeud !== 'object' || noeud === null) {
        return [];
      }
      const { valeur, affichage } = noeud as Record<string, unknown>;
      const propre: [number, string][] =
        typeof valeur === 'number' && typeof affichage === 'string'
          ? [[valeur, affichage]]
          : [];
      return [...propre, ...Object.values(noeud).flatMap(affiches)];
    };
    const servis = CONTENUS.flatMap((contenu) =>
      affiches(deroulePresentateur(buildCoursDuContenu(contenu), 0).ecrans),
    );
    const fine = ESPACE_FINE_INSECABLE;
    const partieEntiere = (affichage: string): string =>
      new RegExp(`^-?[\\d${fine}]+`, 'u').exec(affichage)?.[0] ?? affichage;

    expect(servis.filter(([valeur]) => Math.abs(valeur) >= 1000)).not.toEqual(
      [],
    );
    expect(
      servis.filter(
        ([, affichage]) =>
          !new RegExp(`^-?\\d{1,3}(${fine}\\d{3})*$`, 'u').test(
            partieEntiere(affichage),
          ) || new RegExp(`\\d[ ${ESPACE_INSECABLE}]\\d`, 'u').test(affichage),
      ),
    ).toEqual([]);
  });

  it('sert un affichage à chaque attendu de chaque feuille des cours', () => {
    const servis = CONTENUS.flatMap(attendusServis);

    expect(servis.length).toBeGreaterThan(0);
    for (const [cle, affichage] of servis) {
      expect({ cle, affichage }).toEqual({
        cle,
        affichage: expect.stringMatching(/\S/),
      });
      expect({ cle, point: affichage?.includes('.') }).toEqual({
        cle,
        point: false,
      });
    }
  });
});

describe('deroulePresentateur (corrigés au déroulé, B22)', () => {
  const cours = lireCoursStocke(
    buildCoursDeBriques(
      BRIQUES_STOCKEES.map((brique) => buildEcranDeBrique(brique)),
    ),
  );
  const deroule = deroulePresentateur(cours, 11);
  const ecran = (brique: string): EcranDeroule => {
    const trouve = deroule.ecrans.find((candidat) => candidat.type === brique);
    if (!trouve) throw new Error(`brique ${brique} absente du déroulé`);
    return trouve;
  };

  it('porte la diffusion et le titre de chaque écran', () => {
    expect(deroule.ecrans.every((e) => e.diffusion === 'seance')).toBe(true);
    expect(ecran('fp-quote').titre).toBe('Écran fp-quote');
  });

  it('corrige les productions, les énigmes, les défis et la révélation d un vote', () => {
    expect(ecran('fp-sheet').corrigeEcran).toEqual({
      type: 'feuille',
      attendus: [
        {
          reference: 'D2',
          formuleReference: '=(C2-B2)/B2',
          valeur: -0.178054,
          affichage: '-0,1781',
          tolerance: { type: 'relative', valeur: 0.0001 },
          forme: 'references',
        },
        {
          reference: 'D3',
          formuleReference: '=(C3-B3)/B3',
          valeur: 0.095238,
          affichage: '0,0952',
          tolerance: { type: 'relative', valeur: 0.0001 },
          forme: { memeQue: 'D2' },
        },
      ],
      seuilReussite: 0.8,
    });
    expect(ecran('fp-table-build').corrigeEcran).toEqual({
      type: 'tableau',
      attendus: [
        { rang: 0, cle: 'prix', valeur: 21.6 },
        { rang: 1, cle: 'prix', valeur: 20.52 },
      ],
      tableauCorrige: {
        lignes: [
          {
            rang: 0,
            valeurs: {
              taux: { valeur: 8, affichage: '8' },
              prix: { valeur: 21.6, affichage: '21,60' },
              coef: { valeur: 1.08, affichage: '1,0800' },
            },
          },
          {
            rang: 1,
            valeurs: {
              taux: { valeur: -5, affichage: '-5' },
              prix: { valeur: 20.52, affichage: '20,52' },
              coef: { valeur: 0.95, affichage: '0,9500' },
            },
          },
        ],
        totaux: { taux: { valeur: 3, affichage: '3' } },
        synthese: [{ valeur: 3, affichage: '3,00 %' }],
        soldeFinal: null,
      },
      tolerance: { type: 'absolue', valeur: 0.01 },
      seuilReussite: 0.75,
    });
    expect(ecran('fp-cardsort').corrigeEcran).toMatchObject({
      type: 'classement',
      attendus: [
        {
          carteId: 'ca-2025',
          categorieId: 'valeur',
          justification: 'montant en euros : « combien ? »',
        },
        expect.any(Object),
      ],
    });
    expect(ecran('fp-escape').corrigeEcran).toEqual({
      type: 'enigmes',
      enigmes: [
        { enigmeId: 'b2-01-a6-e1-mix', solution: '23,4', fragment: 'K7' },
      ],
      codeFinal: 'K7',
    });
    expect(ecran('fp-challenge').corrigeEcran).toMatchObject({
      type: 'defi',
      strategies: [
        { id: 'axe', fausse: false },
        { id: 'couleur', fausse: true },
      ],
    });
    expect(ecran('fp-vote').corrigeEcran).toMatchObject({
      type: 'revelation',
      titre: 'Pourquoi le prix ne revient pas à son point de départ',
    });
    expect(ecran('fp-quote').corrigeEcran).toBeNull();
  });

  it('T9 · donne au formateur le raisonnement attendu d une réflexion, pour le révéler', () => {
    const reflexion = buildEcranDeBrique('fp-story', {
      screenId: 'B2-01-A1-08-QUESTION-DE-GESTION',
      proprietes: {
        presentation: {
          version: 2,
          screenId: 'B2-01-A1-08-QUESTION-DE-GESTION',
          renderer: 'reflection',
          props: PRESENTATIONS_VISUELLES_VALIDES.reflection,
        },
        correction: {
          expected: 'Un montant et un taux, sur deux dates.',
          nextAction: 'Nommez le dénominateur.',
        },
      },
    });
    const [servi] = deroulePresentateur(
      lireCoursStocke(buildCoursDeBriques([reflexion])),
      11,
    ).ecrans;

    expect(servi.corrigeEcran).toEqual({
      type: 'reflexion',
      attendu: 'Un montant et un taux, sur deux dates.',
      suite: 'Nommez le dénominateur.',
    });
  });

  it('liste chaque question de l écran avec son énoncé et ses options', () => {
    expect(ecran('fp-vote').questions.map((q) => q.id)).toEqual([
      'b2-01-a3-sac-v1',
      'b2-01-a3-remise-v2',
    ]);
    expect(ecran('fp-cardsort').questions).toEqual([
      {
        id: 'b2-01-a1-anatomie',
        enonce:
          'Classez chaque chiffre du tableau de bord selon ce qu’il exprime.',
        options: null,
      },
    ]);
    expect(ecran('fp-escape').questions[0]).toEqual({
      id: 'b2-01-a6-e1-mix',
      enonce: 'Quel est le taux de marge brute global ?',
      options: null,
    });
    const [rappel] = ecran('fp-spaced').questions;
    expect(rappel.enonce).toBe('Peut-on valider chaque écriture ?');
    expect(rappel.options?.map((option) => option.libelle).sort()).toEqual([
      'Non : deux erreurs se compensent',
      'Oui : le total concorde',
    ]);
    expect(ecran('fp-numeric').questions[0].options).toBeNull();
  });

  it('ne donne de corrigé tiré qu aux votes et aux questions numériques', () => {
    expect(ecran('fp-cardsort').corriges).toEqual([]);
    expect(ecran('fp-spaced').corriges.map((c) => c.questionId)).toEqual([
      'b2-01-r-compensation',
      'b2-01-r-points',
    ]);
    expect(ecran('questionnaire').corriges.map((c) => c.questionId)).toEqual([
      'b2-01-a2-evolution-marge',
      'b2-01-a2-part-marketplace',
    ]);
    expect(ecran('fp-recall').corriges[0].bonneReponse).toBe('+25 %');
  });
});

describe('deroulePresentateur (correction sur place)', () => {
  const deroule = deroulePresentateur(
    lireCoursStocke(
      buildCoursDeBriques([
        buildQuestionnaireCorrigeSurPlace(),
        buildEcranDeBrique('fp-numeric'),
      ]),
    ),
    424,
  );

  it('donne au formateur toutes les explications, qu il révèle ensuite une à une', () => {
    const [questionnaire, numerique] = deroule.ecrans;

    expect(questionnaire.explications).toEqual(EXPLICATIONS_SUR_PLACE);
    expect(numerique.explications).toBeUndefined();
  });
});
