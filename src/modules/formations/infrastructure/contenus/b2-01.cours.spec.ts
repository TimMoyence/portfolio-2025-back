import {
  lireConception,
  mediasDuDocument,
  remediationsDuDocument,
  texteNormalise,
  titresPublics,
  vueDEnsemble,
} from '../../../../../test/helpers/conception-b2-01';
import {
  buildContenuB2_01,
  buildCoursB2_01,
  ouvrirLeBaremeV2DuB2_01,
} from '../../../../../test/factories/cours-b2-01.factory';
import { fuitesDeConfidentialite } from '../../../../../test/factories/structure.factory';
import type { Ecran, Question } from '../../domain/contrats/cours';
import { CONFUSIONS } from '../../domain/cours/banque/confusions';
import type { CorrigeProduction } from '../../domain/cours/Corrige';
import {
  estInteractif,
  questionsDe,
  questionsDuCours,
} from '../../domain/cours/Cours';
import { lireCoursStocke } from '../../domain/cours/CoursStocke';
import { deroulePresentateur } from '../../domain/cours/DeroulePresentateur';
import { activitesLibres } from '../../domain/cours/EcranServi';
import { projeterCatalogue } from '../../domain/cours/Diffusion';
import { slugOption } from '../../domain/cours/QuestionStockee';
import { verifierStructure } from '../../domain/cours/StructureCours';
import { tirer } from '../../domain/cours/Tirage';
import { COURS_B2_01 } from './b2-01.cours';

const DOCUMENT = lireConception();
const COURS = buildCoursB2_01();

function ecranDuCours(screenId: string): Ecran {
  const trouve = COURS.ecrans.find((candidat) => candidat.id === screenId);
  if (trouve === undefined) {
    throw new Error(`écran absent du cours : ${screenId}`);
  }
  return trouve;
}
const TAILLE_MAX_DU_BAREME = 400 * 1024;
const IDENTIFIANT_D_ECRAN = /^B2-01-A[1-6]-\d{2}-[A-Z0-9-]+$/;
const LONGUEUR_MIN_D_UN_TEXTE_COMPARE = 12;
const CLES_NON_TEXTUELLES = new Set(['id', 'formuleReference', 'transcript']);

const ECRAN_DU_GRAPHIQUE_TRIMESTRIEL = 'B2-01-A4-04-CA-TRIMESTRIEL';

function acteDe(ecran: Ecran): number {
  return Number(ecran.id.slice('B2-01-A'.length, 'B2-01-A'.length + 1));
}

function coursDontLeTitre(screenId: string, titre: string): typeof COURS {
  const brut = buildContenuB2_01();
  if (!brut.ecrans.some((ecran) => ecran.screenId === screenId)) {
    throw new Error(`écran inconnu dans le cours : ${screenId}`);
  }
  return lireCoursStocke({
    ...brut,
    ecrans: brut.ecrans.map((ecran) =>
      ecran.screenId === screenId ? { ...ecran, titre } : ecran,
    ),
  });
}

function renduDe(ecran: Ecran): string | null {
  if (ecran.brique !== 'fp-story') {
    return null;
  }
  const presentation = ecran.proprietes.presentation;
  return presentation?.version === 2 ? presentation.renderer : null;
}

function estFermeeNotee(question: Question): boolean {
  return (
    question.noteCompte &&
    ['vote', 'numeric', 'classement'].includes(question.type)
  );
}

function corrigeDe(id: string): CorrigeProduction {
  const question = questionsDuCours(COURS).find(
    (candidate) => candidate.id === id,
  );
  if (question === undefined || !('corrige' in question)) {
    throw new Error(`production ${id} absente du cours`);
  }
  return question.corrige;
}

function descendre(
  valeur: unknown,
  entree: (cle: string, element: unknown) => string[],
): string[] {
  if (Array.isArray(valeur)) {
    return valeur.flatMap((element: unknown) => descendre(element, entree));
  }
  if (typeof valeur !== 'object' || valeur === null) {
    return [];
  }
  return Object.entries(valeur).flatMap(([cle, element]) =>
    entree(cle, element),
  );
}

function chainesDe(valeur: unknown): string[] {
  if (typeof valeur === 'string') {
    return [valeur];
  }
  return descendre(valeur, (cle, element) =>
    CLES_NON_TEXTUELLES.has(cle) ? [] : chainesDe(element),
  );
}

function justificationsPropres(
  corrige: CorrigeProduction,
  ecran: Extract<Ecran, { readonly brique: 'fp-cardsort' }>,
): string[] {
  const categories = ecran.proprietes.plan.categories.map(
    (categorie) => categorie.libelle,
  );
  return corrige.type === 'classement'
    ? corrige.attendus
        .map((attendu) => attendu.justification)
        .filter((justification) => !categories.includes(justification))
    : [];
}

function correctionDuTri(triId: string): string | null {
  const correction = COURS.ecrans.find((ecran) => {
    if (ecran.brique !== 'fp-story') {
      return false;
    }
    const presentation = ecran.proprietes.presentation;
    return (
      presentation?.version === 2 &&
      presentation.renderer === 'sort-review' &&
      presentation.props.source?.screenId === triId
    );
  });
  return correction?.id ?? null;
}

function clesDe(valeur: unknown): string[] {
  return descendre(valeur, (cle, element) => [cle, ...clesDe(element)]);
}

function arrondi(valeur: number, decimales = 6): number {
  return Number(valeur.toFixed(decimales));
}

function vaut(valeur: number, cible: number): boolean {
  return Math.abs(valeur - cible) < 1e-9;
}

function decimalesEcrites(valeur: number): number {
  const [, fraction = ''] = String(valeur).split('.');
  return fraction.length;
}

function alignees(
  lues: readonly number[],
  calculees: readonly number[],
): number[] {
  return calculees.map((calculee, rang) =>
    rang < lues.length
      ? arrondi(calculee, decimalesEcrites(lues[rang]))
      : calculee,
  );
}

describe('B2-01 — fichier de données', () => {
  it('suit ligne à ligne le tableau du § 3.1 (AC-02)', () => {
    const lues = COURS.ecrans.map((ecran, rang) => ({
      rang: rang + 1,
      id: ecran.id,
      minutes: ecran.dureeMinutes,
      brique: ecran.brique,
      rendu: renduDe(ecran),
      interactif: estInteractif(ecran),
      questionsNotees: questionsDe(ecran).filter(estFermeeNotee).length,
      diffusion: ecran.diffusion,
    }));

    expect(lues).toEqual(vueDEnsemble(DOCUMENT));
    expect(lues).toHaveLength(74);
  });

  it('nomme chaque écran selon la convention et le titre du § 3 (AC-02)', () => {
    const titres = titresPublics(DOCUMENT);

    for (const ecran of COURS.ecrans) {
      expect(ecran.id).toMatch(IDENTIFIANT_D_ECRAN);
      expect(ecran.titre).toBe(titres.get(ecran.id));
      expect(ecran.titre?.length).toBeLessThanOrEqual(120);
    }
    expect(new Set(COURS.ecrans.map((ecran) => ecran.id)).size).toBe(74);
  });

  it('dure 211 min, soit 32, 34, 36, 38, 43 et 28 min par acte (AC-03)', () => {
    const parActe = [1, 2, 3, 4, 5, 6].map((acte) =>
      COURS.ecrans
        .filter((ecran) => acteDe(ecran) === acte)
        .reduce((total, ecran) => total + ecran.dureeMinutes, 0),
    );

    expect(COURS.dureeMinutes).toBe(211);
    expect(parActe).toEqual([32, 34, 36, 38, 43, 28]);
  });

  it('ne lève aucune violation de structure, sans dérogation (AC-01, AC-14)', () => {
    expect(verifierStructure(COURS)).toEqual([]);
  });

  it('publie les arrondis d’affichage des attendus de A4-02 sans fuite (A2-06, capsule A4-01)', () => {
    const ecrans = tirer(COURS, 0).sujet.ecrans;
    const publie = (id: string): string =>
      JSON.stringify(ecrans.find((ecran) => ecran.id === id)?.donnees);

    expect(publie('B2-01-A2-06-POINTS')).toContain('25,30 %');
    expect(publie('B2-01-A4-01-CAPSULE')).toContain('0,35');
    expect(fuitesDeConfidentialite(COURS)).toEqual([]);
  });

  it('refuserait le titre public de A4-04 qui portait la réponse du vote b2-01-a4-titre', () => {
    const avantArbitrage = coursDontLeTitre(
      ECRAN_DU_GRAPHIQUE_TRIMESTRIEL,
      'CA HT 2025 par canal et par trimestre',
    );

    expect(fuitesDeConfidentialite(avantArbitrage)).toEqual([
      ECRAN_DU_GRAPHIQUE_TRIMESTRIEL,
    ]);
    expect(fuitesDeConfidentialite(COURS)).toEqual([]);
  });

  it('borne l’exposition continue à 6 min pour 142 min interactives et 69 d’exposition (AC-04)', () => {
    let bloc = 0;
    let plusLong = 0;
    for (const ecran of COURS.ecrans) {
      bloc = estInteractif(ecran) ? 0 : bloc + ecran.dureeMinutes;
      plusLong = Math.max(plusLong, bloc);
    }
    const minutes = (interactif: boolean): number =>
      COURS.ecrans
        .filter((ecran) => estInteractif(ecran) === interactif)
        .reduce((total, ecran) => total + ecran.dureeMinutes, 0);

    expect(plusLong).toBe(6);
    expect([minutes(true), minutes(false)]).toEqual([142, 69]);
  });

  it('porte les questions fermées notées sur treize écrans d atelier, les longs questionnaires découpés (AC-05)', () => {
    const ateliers = COURS.ecrans
      .slice(1, -1)
      .filter((ecran) => questionsDe(ecran).some(estFermeeNotee))
      .map((ecran) => `${ecran.id.slice(6, 11)} (${ecran.dureeMinutes})`);

    expect(ateliers).toEqual([
      'A1-05 (8)',
      'A2-03 (6)',
      'A2-03 (6)',
      'A2-07 (8)',
      'A3-01 (8)',
      'A3-07 (4)',
      'A3-07 (4)',
      'A4-03 (3)',
      'A4-03 (3)',
      'A5-02 (8)',
      'A5-06 (4)',
      'A5-06 (3)',
      'A5-07 (8)',
    ]);
  });

  it('rédige chaque note présente en puces « • » non vides, et tolère l’écran sans note (AC-06)', () => {
    const sansNote = COURS.ecrans.filter((ecran) => ecran.notes === '');

    expect(sansNote.map((ecran) => ecran.id)).toEqual(['B2-01-A1-07-PLAN']);
    for (const ecran of COURS.ecrans.filter((ecran) => ecran.notes !== '')) {
      const lignes = ecran.notes.split('\n');

      expect(
        lignes.filter(
          (ligne) => !ligne.startsWith('• ') || ligne.slice(2).trim() === '',
        ),
      ).toEqual([]);
    }
  });

  it('compte 31 questions notées, 4 énigmes et 13 rappels aux identifiants uniques (AC-07)', () => {
    const questions = questionsDuCours(COURS);
    const notees = questions.filter((question) => question.noteCompte);
    const parType = (type: string): number =>
      notees.filter((question) => question.type === type).length;
    const identifiants = questions.map((question) => question.id);

    expect(notees).toHaveLength(31);
    expect(
      ['vote', 'numeric', 'classement', 'feuille', 'tableau'].map(parType),
    ).toEqual([19, 7, 3, 1, 1]);
    expect(
      questions.filter((question) => question.type === 'enigme'),
    ).toHaveLength(4);
    expect(
      COURS.ecrans.flatMap((ecran) =>
        ecran.brique === 'fp-spaced' ? ecran.banque : [],
      ),
    ).toHaveLength(13);
    expect(new Set(identifiants).size).toBe(identifiants.length);
    expect(
      Math.max(...identifiants.map((id) => id.length)),
    ).toBeLessThanOrEqual(60);
  });

  it('ouvre 61 tirages non ambigus et un barème v2 de moins de 400 Ko (AC-08)', () => {
    const bareme = ouvrirLeBaremeV2DuB2_01(COURS);

    expect(
      Buffer.byteLength(JSON.stringify(bareme), 'utf8'),
    ).toBeLessThanOrEqual(TAILLE_MAX_DU_BAREME);
    for (let graine = 1; graine <= 61; graine += 1) {
      expect(() => tirer(COURS, graine)).not.toThrow();
    }
  });

  it('remédie chacune des 38 confusions vers l’écran du § 5.9 (AC-09)', () => {
    const ecrans = new Set(COURS.ecrans.map((ecran) => ecran.id));

    expect(COURS.remediations).toEqual(remediationsDuDocument(DOCUMENT));
    expect(
      Object.keys(COURS.remediations).sort((a, b) => a.localeCompare(b)),
    ).toEqual(Object.keys(CONFUSIONS).sort((a, b) => a.localeCompare(b)));
    expect(
      Object.values(COURS.remediations).filter((cible) => !ecrans.has(cible)),
    ).toEqual([]);
  });

  it('identifie chaque option de vote par slugOption(libelle) (AC-09)', () => {
    const { libellesOptions } = tirer(COURS, 0);
    const ecarts = Object.values(libellesOptions).flatMap((libelles) =>
      Object.entries(libelles).filter(
        ([id, libelle]) => id !== slugOption(libelle),
      ),
    );

    expect(Object.keys(libellesOptions)).toHaveLength(19 + 13);
    expect(ecarts).toEqual([]);
  });

  it('garde la banque de rappel hors du sujet et la projette en privé (B4)', () => {
    const tirage = tirer(COURS, 42);
    const sujet = JSON.stringify(tirage.sujet);

    expect(Object.keys(tirage.banque)).toHaveLength(13);
    expect(
      Object.keys(tirage.banque).filter((id) => sujet.includes(id)),
    ).toEqual([]);
  });

  it('expose au déroulé 31 questions notées, 4 énigmes et 13 rappels (B22)', () => {
    const deroule = deroulePresentateur(COURS, 0);
    const questions = deroule.ecrans.flatMap((ecran) => ecran.questions);

    expect(questions).toHaveLength(31 + 4 + 13);
    expect(
      deroule.ecrans.filter((ecran) => ecran.corrigeEcran !== null),
    ).toHaveLength(13);
    expect(
      deroule.ecrans
        .filter((ecran) => ecran.corrigeEcran?.type === 'reflexion')
        .map((ecran) => ecran.id),
    ).toEqual([
      'B2-01-A1-08-QUESTION-DE-GESTION',
      'B2-01-A3-09-NOTE-CONJONCTURE',
    ]);
  });

  it('T13 · pose dans l énoncé de la moyenne pondérée le CA et le taux de chaque canal', () => {
    const ecran = COURS.ecrans.find(
      (candidat) => candidat.id === 'B2-01-A5-03-MOYENNE-PONDEREE',
    );
    const enonce =
      ecran?.brique === 'fp-worked' ? ecran.proprietes.exemple.enonce : '';

    for (const donnee of [
      '483 000',
      '397 000',
      '210 000',
      '230 000',
      '357 000',
      '523 000',
      '36 %',
      '28 %',
      '16 %',
    ]) {
      expect(enonce).toContain(donnee);
    }
  });

  it('RET-32 · montre au pupitre la bonne réponse numérique sous sa forme publiée', () => {
    const corriges = new Map(
      deroulePresentateur(COURS, 0)
        .ecrans.flatMap((ecran) => ecran.corriges)
        .map((corrige) => [corrige.questionId, corrige.bonneReponse]),
    );

    expect(corriges.get('b2-01-a2-part-marketplace')).toBe('45,5');
    expect(corriges.get('b2-01-a5-variation-marge-sur-mesure')).toBe('−30 960');
  });

  it('sert au catalogue les 12 écrans catalogue et verrouille les 62 autres (B19)', () => {
    const catalogue = projeterCatalogue(COURS);
    const verrouilles = catalogue.ecrans.filter(
      (ecran) => ecran.type === 'ecran-verrouille',
    );

    expect(verrouilles).toHaveLength(62);
    expect(
      catalogue.ecrans
        .filter((ecran) => ecran.type !== 'ecran-verrouille')
        .map((ecran) => ecran.id.slice(6, 11)),
    ).toEqual([
      'A1-02',
      'A1-07',
      'A1-04',
      'A1-06',
      'A1-09',
      'A2-01',
      'A2-02',
      'A3-05',
      'A4-01',
      'A5-01',
      'A6-03',
      'A6-07',
    ]);
  });

  it('ne projette aucun secret dans le sujet ni dans le catalogue (§ 6.1)', () => {
    const publics = [tirer(COURS, 7).sujet, projeterCatalogue(COURS)];
    const interdites = [
      'guide',
      'correction',
      'interaction',
      'corrige',
      'banque',
      'solution',
      'attendus',
      'fragment',
      'fausse',
      'misconception',
      'valeurAttendue',
    ];
    const secrets = [
      ...COURS.ecrans.flatMap((ecran) => ecran.notes.split('\n')),
      ...COURS.ecrans.flatMap((ecran) =>
        ecran.brique === 'fp-challenge'
          ? ecran.defi.strategies.map((strategie) => strategie.libelle)
          : [],
      ),
      ...COURS.ecrans.flatMap((ecran) =>
        ecran.brique === 'fp-vote' && ecran.revelation !== undefined
          ? [ecran.revelation.titre, ...ecran.revelation.lignes]
          : [],
      ),
      ...COURS.ecrans.flatMap((ecran) =>
        ecran.brique === 'fp-story'
          ? chainesDe(ecran.proprietes.correction)
          : [],
      ),
    ].filter((secret) => secret.length >= LONGUEUR_MIN_D_UN_TEXTE_COMPARE);
    const tris = COURS.ecrans.flatMap((ecran) =>
      ecran.brique === 'fp-cardsort'
        ? [
            {
              correction: correctionDuTri(ecran.id),
              justifications: justificationsPropres(
                ecran.production.corrige,
                ecran,
              ).filter(
                (secret) => secret.length >= LONGUEUR_MIN_D_UN_TEXTE_COMPARE,
              ),
            },
          ]
        : [],
    );

    for (const publie of publics) {
      const texte = JSON.stringify(publie);
      const vides = JSON.stringify(publie).match(
        /"misconceptionsCiblees":\[[^\]]/g,
      );

      expect(clesDe(publie).filter((cle) => interdites.includes(cle))).toEqual(
        [],
      );
      expect(secrets.filter((secret) => texte.includes(secret))).toEqual([]);
      for (const { correction, justifications } of tris) {
        const horsCorrection = JSON.stringify(
          publie.ecrans.filter((ecran) => ecran.id !== correction),
        );

        expect(
          justifications.filter((secret) => horsCorrection.includes(secret)),
        ).toEqual([]);
      }
      expect(vides).toBeNull();
    }
  });

  it('recopie mot pour mot les textes du document (§ 3, § 5 et annexe A.6)', () => {
    const reference = texteNormalise(DOCUMENT);
    const textes = COURS_B2_01.ecrans.flatMap((ecran) => [
      ecran.titre ?? '',
      ...ecran.notes.split('\n').map((ligne) => ligne.replace(/^• /, '')),
      ...chainesDe(ecran.proprietes),
    ]);
    const capsule = COURS.ecrans.flatMap((ecran) =>
      ecran.brique === 'fp-story' && ecran.proprietes.video !== undefined
        ? ecran.proprietes.video.transcript.split('\n\n')
        : [],
    );

    expect(
      textes
        .filter((texte) => texte.length >= LONGUEUR_MIN_D_UN_TEXTE_COMPARE)
        .filter((texte) => !reference.includes(texte)),
    ).toEqual([]);
    expect(capsule).toHaveLength(11);
    expect(
      capsule
        .map((plan) => plan.replace('[', '(').replace(']', ')'))
        .filter((plan) => !reference.includes(plan)),
    ).toEqual([]);
  });

  it('présente la diapositive de Samir comme un graphique réglable', () => {
    const graphique = COURS.ecrans.find(
      (ecran) => ecran.id === 'B2-01-A2-02-ORIGINE-AXE',
    );
    const graphiqueBrut = COURS_B2_01.ecrans.find(
      (ecran) => ecran.screenId === 'B2-01-A2-02-ORIGINE-AXE',
    );
    const proprietesGraphique =
      graphiqueBrut !== undefined && 'proprietes' in graphiqueBrut
        ? graphiqueBrut.proprietes
        : null;
    const atelierBrut = COURS_B2_01.ecrans.find(
      (ecran) => ecran.screenId === 'B2-01-A2-03-ATELIER-1-SUITE',
    );
    const proprietesBrutes =
      atelierBrut !== undefined && 'proprietes' in atelierBrut
        ? atelierBrut.proprietes
        : null;

    expect(graphique?.titre).toBe('La diapositive de Samir — axe réglable');
    expect(
      proprietesGraphique !== null && 'description' in proprietesGraphique
        ? proprietesGraphique.description
        : null,
    ).toBe(
      'Passez de « Axe de Samir » à « Axe à zéro », puis faites glisser l’origine de l’axe vertical. Combien de fois la barre 2025 paraît-elle plus haute que celle de 2022 dans chaque cas ? Les montants, eux, ne bougent pas.',
    );
    expect(
      proprietesBrutes !== null && 'consigne' in proprietesBrutes
        ? proprietesBrutes.consigne
        : null,
    ).toBe(
      'Calculatrice autorisée, sauf pour la question sur le nombre de commandes (ordre de grandeur). Répondez seul·e, puis comparez avec votre voisin·e avant la correction.',
    );
  });

  it('catalogue les cinq médias du § 8.2 avec page source, licence et attribution (AC-20)', () => {
    expect(
      COURS.medias.map((media) => ({
        id: media.id,
        pageSource:
          media.pageSource ?? 'capsule produite pour le cours (annexe A)',
        licence: media.licence,
        fichiers: media.chemins.map((chemin) => chemin.split('/').at(-1)),
        attribution: media.attribution,
      })),
    ).toEqual(mediasDuDocument(DOCUMENT));
  });
});

describe('B2-01 — recalcul des corrigés depuis les données brutes (AC-10)', () => {
  const ca2024 = [483000, 210000, 357000];
  const ca2025 = [397000, 230000, 523000];
  const taux = [0.36, 0.28, 0.16];
  const somme = (valeurs: readonly number[]): number =>
    valeurs.reduce((total, valeur) => total + valeur, 0);
  const marges2024 = ca2024.map((ca, rang) => ca * taux[rang]);
  const marges2025 = ca2025.map((ca, rang) => ca * taux[rang]);
  const inflation = [0.5, 1.6, 5.2, 4.9, 2.0, 0.9];
  const indices = inflation.reduce(
    (chaine, taux2) => [
      ...chaine,
      chaine[chaine.length - 1] * (1 + taux2 / 100),
    ],
    [100],
  );

  function numeriques(): Record<string, readonly number[]> {
    return Object.fromEntries(
      questionsDuCours(COURS)
        .filter((question) => question.type === 'numeric')
        .map((question) => {
          const { valeur, pieges } = tirer(COURS, 0).solutions[question.id];
          return [
            question.id,
            [Number(valeur), ...pieges.map((piege) => Number(piege.valeur))],
          ];
        }),
    );
  }

  it('recalcule les solutions et pièges des sept questions numériques', () => {
    const [marge24SurMesure] = marges2024;
    const [marge25SurMesure, , marge25Marketplace] = marges2025;
    const attendus = {
      'b2-01-a2-part-marketplace': [
        (ca2025[2] / somme(ca2025)) * 100,
        ca2025[2] / somme(ca2025),
        (somme(ca2025) / ca2025[2]) * 100,
      ],
      'b2-01-a2-evolution-sur-mesure': [
        ((ca2025[0] - ca2024[0]) / ca2024[0]) * 100,
        ((ca2025[0] - ca2024[0]) / ca2025[0]) * 100,
        ca2025[0] - ca2024[0],
        (ca2025[0] / ca2024[0]) * 100,
        ((ca2024[0] - ca2025[0]) / ca2024[0]) * 100,
      ],
      'b2-01-a3-indice-2023': [
        indices[4],
        100 + somme(inflation.slice(0, 4)),
        indices[4] - 100,
      ],
      'b2-01-a3-hausse-2019-2025': [
        indices[6] - 100,
        somme(inflation),
        indices[6],
      ],
      'b2-01-a3-taux-moyen': [
        ((indices[6] / 100) ** (1 / 6) - 1) * 100,
        (indices[6] - 100) / 6,
        somme(inflation) / 6,
      ],
      'b2-01-a5-part-marge-marketplace': [
        (marge25Marketplace / somme(marges2025)) * 100,
        (ca2025[2] / somme(ca2025)) * 100,
        marge25Marketplace / somme(marges2025),
        (somme(marges2025) / marge25Marketplace) * 100,
      ],
      'b2-01-a5-variation-marge-sur-mesure': [
        marge25SurMesure - marge24SurMesure,
        marge24SurMesure - marge25SurMesure,
        ca2025[0] - ca2024[0],
      ],
    };
    const lues = numeriques();

    for (const [id, valeurs] of Object.entries(attendus)) {
      expect(lues[id]).toEqual(alignees(lues[id], valeurs));
    }
  });

  it('recalcule les solutions et pièges des quatre énigmes', () => {
    const semestre = [150000, 120000, 330000];
    const e1 =
      (somme(semestre.map((ca, rang) => ca * taux[rang])) / somme(semestre)) *
      100;
    const moyenneSimple = (somme(taux) / 3) * 100;
    const tauxGlobal2025 = (somme(marges2025) / somme(ca2025)) * 100;
    const coefficient = 1.06 * 0.96;
    const pieces = [12000, 8500, 15865, 12340];
    const grandLivre = [12000, 8500, 15865, 12430];
    const attendus = {
      'b2-01-a6-e1-mix': [e1, moyenneSimple],
      'b2-01-a6-e2-points': [
        e1 - 26.2,
        (e1 / 26.2 - 1) * 100,
        26.2 - e1,
        e1 - tauxGlobal2025,
      ],
      'b2-01-a6-e3-rouleau': [
        1053.22 / coefficient,
        1053.22 / (1 + (6 - 4) / 100),
        1053.22 * (1 - (coefficient - 1)),
        1053.22 * (1 - (6 - 4) / 100),
      ],
      'b2-01-a6-e4-tva': [
        somme(pieces) * 0.2,
        somme(grandLivre) * 0.2,
        (somme(pieces) * 20) / 120,
        (somme(grandLivre) - somme(pieces)) * 0.2,
      ],
    };

    for (const [id, valeurs] of Object.entries(attendus)) {
      const corrige = corrigeDe(id);
      if (corrige.type !== 'enigme' || corrige.solution.type !== 'nombre') {
        throw new Error(`${id} n’est pas une énigme numérique`);
      }
      const lues = [
        corrige.solution.valeur,
        ...corrige.pieges.map((piege) => piege.valeur),
      ];
      expect(lues).toEqual(alignees(lues, valeurs));
    }
    expect(arrondi(1035 * coefficient, 2)).toBeCloseTo(1053.22, 6);
  });

  it('recalcule les 17 cellules attendues de la feuille A4-02 et leurs pièges', () => {
    const corrige = corrigeDe('b2-01-a4-feuille-canaux');
    if (corrige.type !== 'feuille') {
      throw new Error('la feuille A4-02 n’a pas de corrigé de feuille');
    }
    const lignes = [
      ...ca2024.map((ca, rang) => [ca, ca2025[rang]]),
      [somme(ca2024), somme(ca2025)],
    ];
    const evolutions = lignes.map(([depart, arrivee]) => [
      (arrivee - depart) / depart,
      ((arrivee - depart) / depart) * 100,
      (arrivee - depart) / arrivee,
    ]);
    const parts = [...ca2025, somme(ca2025)].map((ca) => ca / somme(ca2025));
    const attendus: Record<string, readonly number[]> = {
      B5: [somme(ca2024)],
      C5: [somme(ca2025)],
      D2: evolutions[0],
      D3: evolutions[1],
      D4: evolutions[2],
      D5: evolutions[3],
      E2: [parts[0], parts[0] * 100],
      E3: [parts[1]],
      E4: [parts[2], ca2025[2] / 1],
      E5: [parts[3]],
      G2: [marges2025[0]],
      G3: [marges2025[1]],
      G4: [marges2025[2]],
      G5: [somme(marges2025)],
      F5: [
        somme(marges2025) / somme(ca2025),
        (somme(marges2025) / somme(ca2025)) * 100,
        somme(taux) / 3,
      ],
      B7: [vaut(arrondi(somme(parts.slice(0, 3))), 1) ? 1 : 0],
      C7: [vaut(arrondi(somme(marges2025) - 291000, 0), 0) ? 1 : 0],
    };

    expect(corrige.attendus).toHaveLength(17);
    for (const attendu of corrige.attendus) {
      const lues = [
        attendu.valeur,
        ...attendu.pieges.map((piege) => piege.valeur),
      ];
      expect(lues).toEqual(alignees(lues, attendus[attendu.reference]));
    }
  });

  it('recalcule les prix et indices de la toile, révision après révision', () => {
    const corrige = corrigeDe('b2-01-a4-indice-toile');
    if (corrige.type !== 'tableau') {
      throw new Error('le tableau A4-05 n’a pas de corrigé de tableau');
    }
    const revisions = [8, -5, 4, -3];
    const prix = revisions.reduce(
      (chaine, revision) => [
        ...chaine,
        arrondi(chaine[chaine.length - 1] * (1 + revision / 100), 2),
      ],
      [20],
    );
    const additionnes = revisions.map((_, rang) =>
      arrondi(20 * (1 + somme(revisions.slice(0, rang + 1)) / 100), 2),
    );
    const attendus = revisions.flatMap((_, rang) => [
      [prix[rang + 1], ...(rang === 0 ? [] : [additionnes[rang]])],
      [
        arrondi((prix[rang + 1] / 20) * 100, 2),
        ...(rang === 0
          ? []
          : [arrondi(100 + somme(revisions.slice(0, rang + 1)), 2)]),
        arrondi((prix[rang + 1] / 20) * 100 - 100, 2),
      ],
    ]);

    expect(
      corrige.attendus.map((attendu) => [
        attendu.valeur,
        ...attendu.pieges.map((piege) => piege.valeur),
      ]),
    ).toEqual(attendus);
  });
});

describe('B2-01 — retours de QA', () => {
  const MISSION = 'B2-01-A1-03-MISSION';
  const TRI = 'B2-01-A1-05-ANATOMIE';
  const CORRECTION = 'B2-01-A1-05-CORRECTION';
  const CONTROLE = 'B2-01-A5-07-CONTROLE-DISCRIMINANT';
  const CORRECTION_CONTROLE = 'B2-01-A5-07-CORRECTION';
  const DIAPOSITIVE = 'B2-01-A1-09-DIAPOSITIVE';
  const AUDIT = 'B2-01-A1-10-AUDIT-DIAPOSITIVE';
  const ORIGINE_AXE = 'B2-01-A2-02-ORIGINE-AXE';
  const POINTS = 'B2-01-A2-06-POINTS';
  const EXERCICE_POINTS = 'B2-01-A2-06-POINTS-EXERCICE';
  const CORRECTION_POINTS = 'B2-01-A2-06-CORRECTION';
  const JEU = 'B2-01-A2-07-JEU-COMPARABLE';
  const MACHINE = 'B2-01-A3-02-MACHINE-COEFFICIENTS';
  const RECOMMANDATION = 'B2-01-A5-08-RECOMMANDATION';
  const ecran = ecranDuCours;

  it('titre chacun de ses écrans', () => {
    expect(COURS.ecrans.every(({ titre }) => titre !== null)).toBe(true);
  });

  it('L3 · pose en séance les trois questions libres de la mission', () => {
    const mission = ecran(MISSION);

    expect(mission.diffusion).toBe('seance');
    expect(estInteractif(mission)).toBe(true);
    expect(
      mission.brique === 'fp-pro' &&
        mission.proprietes.questionsLibres?.map(({ question }) => question),
    ).toEqual([
      'Que mesure chaque chiffre ?',
      'Les bases et les périodes sont-elles comparables ?',
      'Que faudrait-il recalculer avant de décider ?',
    ]);
    expect(activitesLibres(COURS).get(MISSION)).toHaveLength(3);
  });

  it('L3 · ne répète pas dans le geste les questions affichées juste en dessous', () => {
    const mission = ecran(MISSION);
    const proprietes = mission.brique === 'fp-pro' ? mission.proprietes : null;

    expect(
      (proprietes?.questionsLibres ?? []).filter(({ question }) =>
        proprietes?.geste
          .toLowerCase()
          .includes(question.slice(0, -2).toLowerCase()),
      ),
    ).toEqual([]);
    expect(proprietes?.geste).toContain('trois questions');
  });

  it('E10 · renvoie l audit, au pupitre, à la diapositive de Samir qu il commente', () => {
    const deroule = deroulePresentateur(COURS, 0);

    expect(ecran(AUDIT).renvoi).toBe(DIAPOSITIVE);
    expect(deroule.ecrans.find(({ id }) => id === AUDIT)?.renvoi).toBe(
      DIAPOSITIVE,
    );
  });

  it('E14 · donne au pupitre la réponse attendue sous la forme publiée, arrondi compris', () => {
    const corriges = deroulePresentateur(COURS, 0).ecrans.flatMap(
      (servi) => servi.corriges,
    );

    expect(
      corriges.find(
        ({ questionId }) => questionId === 'b2-01-a2-part-marketplace',
      )?.bonneReponse,
    ).toBe('45,5');
  });

  it('E13 · montre la marge en barres par année, en euros, avec un curseur d origine et deux préréglages', () => {
    const origineAxe = ecran(ORIGINE_AXE);
    if (origineAxe.brique !== 'fp-plot') {
      throw new Error('ORIGINE-AXE de brique inattendue');
    }
    const trace = origineAxe.proprietes;

    expect(trace.forme).toBe('barres');
    expect(trace.unite).toBe('euros');
    expect(trace.etiquettes).toEqual(['2022', '2023', '2024', '2025']);
    expect(trace.parametres.map(({ cle }) => cle)).toEqual(['origine']);
    expect(trace.prereglages).toEqual([
      { libelle: 'Axe de Samir', valeurs: { origine: 284000 } },
      { libelle: 'Axe à zéro', valeurs: { origine: 0 } },
    ]);
  });

  it('F13 · fige la diapositive de Samir à côté de l axe réglable, pour comparer deux graphiques', () => {
    const origineAxe = ecran(ORIGINE_AXE);

    expect(
      origineAxe.brique === 'fp-plot' && origineAxe.proprietes.reference,
    ).toBe('Axe de Samir');
  });

  it('RET-23 (b) · fait répondre à chaque étape de POINTS sous l exemple lui-même, corrigé ensuite par l écran piloté', () => {
    const points = ecran(POINTS);
    const correction = ecran(CORRECTION_POINTS);
    if (points.brique !== 'fp-worked' || correction.brique !== 'fp-worked') {
      throw new Error('POINTS de brique inattendue');
    }

    expect(COURS.ecrans.some(({ id }) => id === EXERCICE_POINTS)).toBe(false);
    expect(points.renvoi).toBe('B2-01-A1-04-TABLEAU-DE-BORD');
    expect(correction.proprietes.corrigeDe).toBe(POINTS);
    expect(estInteractif(points)).toBe(true);
    expect(activitesLibres(COURS).get(POINTS)).toHaveLength(
      points.proprietes.exemple.etapes.length,
    );
  });

  it('RET-25 · ouvre chaque exemple travaillé sans aucune correction révélée', () => {
    const etayages = COURS.ecrans.flatMap((candidat) =>
      candidat.brique === 'fp-worked' ? [candidat.proprietes.etayage] : [],
    );

    expect(etayages.length).toBeGreaterThan(0);
    expect(etayages).toEqual(etayages.map(() => 0));
  });

  it('RET-23 · pose à chaque étape d’exemple travaillé une question à laquelle répondre', () => {
    const invites = COURS.ecrans.flatMap((candidat) =>
      candidat.brique === 'fp-worked'
        ? candidat.proprietes.exemple.etapes.map(({ invite }) => invite)
        : [],
    );

    expect(invites.length).toBeGreaterThan(0);
    expect(invites.filter((invite) => !invite.trim().endsWith('?'))).toEqual(
      [],
    );
  });

  it('RET-18 · fait suivre le mini-jeu comparable de sa correction, comme le tri de l’acte 1', () => {
    const rangDuJeu = COURS.ecrans.findIndex(({ id }) => id === JEU);
    const correction = COURS.ecrans[rangDuJeu + 1];
    const presentation =
      correction?.brique === 'fp-story'
        ? correction.proprietes.presentation
        : undefined;

    expect(correction?.diffusion).toBe('seance');
    expect(
      presentation?.version === 2 &&
        presentation.renderer === 'sort-review' &&
        presentation.props.source,
    ).toEqual({ screenId: JEU, sortId: 'b2-01-a2-comparable' });
  });

  it('RET-21 · trace la machine à coefficients du départ à l’arrivée en passant par la valeur après le premier taux', () => {
    const machine = ecran(MACHINE);

    expect(
      machine.brique === 'fp-concept4' && machine.proprietes.etapes,
    ).toEqual([
      { libelle: 'Départ', calcul: 'depart' },
      { libelle: 'Après t₁', calcul: 'depart * (1 + tauxUn / 100)' },
      {
        libelle: 'Arrivée',
        calcul: 'depart * (1 + tauxUn / 100) * (1 + tauxDeux / 100)',
      },
    ]);
  });

  it('F20 · propose sur la machine à coefficients les couples de taux à comparer en un clic', () => {
    const machine = ecran(MACHINE);

    expect(
      machine.brique === 'fp-concept4' && machine.proprietes.prereglages,
    ).toEqual([
      { libelle: '+10 % puis −10 %', valeurs: { tauxUn: 10, tauxDeux: -10 } },
      { libelle: '−10 % puis +10 %', valeurs: { tauxUn: -10, tauxDeux: 10 } },
      { libelle: '+20 % puis −20 %', valeurs: { tauxUn: 20, tauxDeux: -20 } },
    ]);
  });

  it('R3 · garde au tri noté ses 8 min d atelier et ajoute une minute de correction', () => {
    expect([
      ecran(CONTROLE).dureeMinutes,
      ecran(CORRECTION_CONTROLE).dureeMinutes,
    ]).toEqual([8, 1]);
  });

  it('R3 · justifie chaque contrôle autrement qu en répétant sa catégorie', () => {
    const correction = ecran(CORRECTION_CONTROLE);
    const presentation =
      correction.brique === 'fp-story'
        ? correction.proprietes.presentation
        : undefined;
    if (
      presentation?.version !== 2 ||
      presentation.renderer !== 'sort-review'
    ) {
      throw new Error('la correction n est pas un rendu sort-review');
    }
    const libelles = new Set(
      presentation.props.categories.map(({ label }) => label),
    );

    expect(
      presentation.props.cards.filter(({ justification }) =>
        libelles.has(justification),
      ),
    ).toEqual([]);
  });

  it('R4 · rappelle à l étudiant, sur la recommandation, le dossier chiffré depuis le début', () => {
    const servie = JSON.stringify(
      tirer(COURS, 0).sujet.ecrans.find(({ id }) => id === RECOMMANDATION)
        ?.donnees,
    );

    for (const chiffre of [
      '40 000 €',
      '+9,5 %',
      '+1 200 €',
      '27,6 %',
      '25,3 %',
      '34 %',
      '45,5 %',
      '16 %',
      '90 €',
    ]) {
      expect(servie).toContain(chiffre);
    }
    expect(servie).toContain('"rappel"');
  });

  it.each([
    [TRI, CORRECTION],
    [CONTROLE, CORRECTION_CONTROLE],
  ])('L4 · place la correction du tri %s juste après lui', (tri, suite) => {
    const rangDuTri = COURS.ecrans.findIndex(({ id }) => id === tri);

    expect(COURS.ecrans[rangDuTri + 1]?.id).toBe(suite);
  });

  it.each([
    [TRI, CORRECTION],
    [CONTROLE, CORRECTION_CONTROLE],
  ])(
    'L4 · range chaque carte du tri %s dans la catégorie de son corrigé',
    (idDuTri, idDeLaCorrection) => {
      const tri = ecran(idDuTri);
      const correction = ecran(idDeLaCorrection);
      if (
        tri.brique !== 'fp-cardsort' ||
        tri.production.corrige.type !== 'classement' ||
        correction.brique !== 'fp-story'
      ) {
        throw new Error('tri ou correction de brique inattendue');
      }
      const { plan } = tri.proprietes;
      const { attendus } = tri.production.corrige;
      const presentation = correction.proprietes.presentation;
      if (
        presentation?.version !== 2 ||
        presentation.renderer !== 'sort-review'
      ) {
        throw new Error('la correction n est pas un rendu sort-review');
      }

      expect(presentation.props.source).toEqual({
        screenId: idDuTri,
        sortId: plan.id,
      });
      expect(presentation.props.categories).toEqual(
        plan.categories.map(({ id, libelle }) => ({ id, label: libelle })),
      );
      expect(presentation.props.cards).toEqual(
        plan.cartes.map(({ id, libelle }) => {
          const attendu = attendus.find(({ carteId }) => carteId === id);
          return {
            id,
            label: libelle,
            category: attendu?.categorieId,
            justification: attendu?.justification,
          };
        }),
      );
    },
  );
});

describe('B2-01 — retours de QA du 2026-09-24', () => {
  const MISSION = 'B2-01-A1-03-MISSION';
  const PLAN = 'B2-01-A1-07-PLAN';
  const JALON_1 = 'B2-01-A1-11-JALON-1';
  const CORRECTION_ATELIER_1 = 'B2-01-A2-03-CORRECTION-2';

  function titresDuPlan(): string[] {
    const plan = ecranDuCours(PLAN);
    const presentation =
      plan.brique === 'fp-story' ? plan.proprietes.presentation : undefined;
    if (
      presentation?.version !== 2 ||
      presentation.renderer !== 'method-path'
    ) {
      throw new Error('le plan n est pas un rendu method-path');
    }
    return presentation.props.steps.map(({ title }) => title);
  }

  it('R2 · annonce le plan juste après la mission, avant tout travail sur les chiffres', () => {
    const rangs = COURS.ecrans.map(({ id }) => id);

    expect(rangs.indexOf(PLAN)).toBe(3);
    expect(rangs.indexOf(PLAN)).toBe(rangs.indexOf(MISSION) + 1);
    expect(ecranDuCours(MISSION).notes).toContain('six actes');
  });

  it('R2 · nomme au jalon 1 l acte 2 comme le plan le nomme', () => {
    const acte2 = titresDuPlan()[1];

    expect(acte2).toBe('Acte 2 · Auditer');
    expect(ecranDuCours(JALON_1).notes).toContain('« Acte 2 · Auditer :');
  });

  it('R5 · laisse l axe réglable en plein écran, sans diapositive commentée', () => {
    expect(ecranDuCours('B2-01-A2-02-ORIGINE-AXE').renvoi).toBeUndefined();
  });

  it('R6 · retire le récapitulatif de l axe à zéro et reloge sa lecture chiffrée dans les notes', () => {
    const notes = ecranDuCours(CORRECTION_ATELIER_1).notes;

    expect(COURS.ecrans.some(({ id }) => id.startsWith('B2-01-A2-04'))).toBe(
      false,
    );
    expect(notes).toContain('+6 000 €, soit +2,1 % en trois ans');
    expect(notes).toContain(
      'titre descriptif, unité, source, phrase de lecture chiffrée',
    );
    expect(notes).toContain(
      'Transition : « Cinq écritures reviennent sans cesse : fixons-les. »',
    );
  });

  it('R3 · R7 · cadre chaque diapositive commentée écran par écran', () => {
    const cadrages = Object.fromEntries(
      COURS.ecrans
        .filter(({ renvoi }) => renvoi !== undefined)
        .map(({ id, cadrageDuRenvoi }) => [id, cadrageDuRenvoi]),
    );

    expect(cadrages).toEqual({
      'B2-01-A1-05-ANATOMIE': {
        part: 40,
        extrait: { lignes: [0, 1, 2, 3, 4, 5] },
      },
      'B2-01-A1-08-QUESTION-DE-GESTION': {
        part: 70,
        extrait: { champs: ['situation'] },
      },
      'B2-01-A1-10-AUDIT-DIAPOSITIVE': { part: 60 },
      'B2-01-A2-03-ATELIER-1': { part: 40 },
      'B2-01-A2-05-ECRITURES': { part: 50 },
      'B2-01-A2-06-POINTS': { part: 30, extrait: { lignes: [3] } },
      'B2-01-A3-03-PRIX-SAC': { part: 40 },
      'B2-01-A3-07-ATELIER-2': { part: 40 },
      'B2-01-A3-07-ATELIER-2-SUITE': { part: 40 },
      'B2-01-A3-08-INDICE-PRIX': { part: 40 },
      'B2-01-A3-09-NOTE-CONJONCTURE': { part: 60 },
      'B2-01-A5-06-ATELIER-4-SUITE': { part: 40 },
      'B2-01-A5-08-RECOMMANDATION': { part: 50 },
    });
  });

  it('R7 · ne garde du tableau de bord, à l écran des points, que la ligne du taux de marge', () => {
    const tableau = ecranDuCours('B2-01-A1-04-TABLEAU-DE-BORD');
    const presentation =
      tableau.brique === 'fp-story'
        ? tableau.proprietes.presentation
        : undefined;
    const lignes =
      presentation?.version === 2 && presentation.renderer === 'table'
        ? presentation.props.rows
        : [];

    expect(lignes[3]).toMatchObject({ indicateur: 'Taux de marge' });
  });

  it.each([
    [
      'R8 · rejoue à l écran 28 la hausse de 50 % puis la baisse de 50 %',
      'B2-01-A3-02-MACHINE-COEFFICIENTS',
      [
        { depart: 100, tauxUn: 0, tauxDeux: 0 },
        { tauxUn: 50 },
        { tauxDeux: -50 },
      ],
    ],
    [
      'R9 · fait monter à l écran 56 la part marketplace de 16 % à 30 %',
      'B2-01-A5-04-SIMULATEUR-MIX',
      [
        { tauxMarketplace: 16 },
        { tauxMarketplace: 20 },
        { tauxMarketplace: 24 },
        { tauxMarketplace: 28 },
        { tauxMarketplace: 30 },
      ],
    ],
  ])('%s', (_, id, animation) => {
    expect(ecranDuCours(id)).toMatchObject({ proprietes: { animation } });
  });
});
