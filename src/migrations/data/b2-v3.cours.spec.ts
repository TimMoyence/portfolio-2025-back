import {
  lireConception,
  mediasDuDocument,
  remediationsDuDocument,
  texteNormalise,
  titresPublics,
  vueDEnsemble,
} from '../../../test/helpers/conception-b2-01';
import { tireurSequentiel } from '../../../test/factories/cours.factory';
import type {
  Ecran,
  Question,
} from '../../modules/formations/domain/contrats/cours';
import { CONFUSIONS } from '../../modules/formations/domain/cours/banque/confusions';
import type { CorrigeProduction } from '../../modules/formations/domain/cours/Corrige';
import {
  estInteractif,
  questionsDe,
  questionsDuCours,
} from '../../modules/formations/domain/cours/Cours';
import type { ContenuDeCoursBrut } from '../../modules/formations/domain/cours/CoursStocke';
import { lireCoursStocke } from '../../modules/formations/domain/cours/CoursStocke';
import { deroulePresentateur } from '../../modules/formations/domain/cours/DeroulePresentateur';
import { projeterCatalogue } from '../../modules/formations/domain/cours/Diffusion';
import { ouvrirTirages } from '../../modules/formations/domain/cours/OuvertureTirages';
import { slugOption } from '../../modules/formations/domain/cours/QuestionStockee';
import { verifierStructure } from '../../modules/formations/domain/cours/StructureCours';
import { tirer } from '../../modules/formations/domain/cours/Tirage';
import { B2_COURS } from './b2-v3.cours';

const DOCUMENT = lireConception();
const COURS = lireCoursStocke(B2_COURS);
const TAILLE_MAX_DU_BAREME = 400 * 1024;
const IDENTIFIANT_D_ECRAN = /^B2-01-A[1-6]-\d{2}-[A-Z0-9-]+$/;
const LONGUEUR_MIN_D_UN_TEXTE_COMPARE = 12;
const CLES_NON_TEXTUELLES = new Set(['id', 'formuleReference', 'transcript']);
const RUBRIQUES = ['Action', 'Observé', 'Attendu', 'Contrôle', 'Transition'];

const ECRAN_DU_GRAPHIQUE_TRIMESTRIEL = 'B2-01-A4-04-CA-TRIMESTRIEL';

function acteDe(ecran: Ecran): number {
  return Number(ecran.id.slice('B2-01-A'.length, 'B2-01-A'.length + 1));
}

function coursDontLeTitre(screenId: string, titre: string): typeof COURS {
  const brut = structuredClone(B2_COURS) as unknown as {
    ecrans: { screenId: string; titre: string }[];
  };
  const ecran = brut.ecrans.find((candidat) => candidat.screenId === screenId);
  if (ecran === undefined) {
    throw new Error(`écran inconnu dans la V3 : ${screenId}`);
  }
  ecran.titre = titre;
  return lireCoursStocke(brut as unknown as ContenuDeCoursBrut);
}

function fuitesDeConfidentialite(cours: typeof COURS): (string | null)[] {
  return verifierStructure(cours)
    .filter((violation) => violation.regle === 'confidentialite')
    .map((violation) => violation.ecran);
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

function chainesDe(valeur: unknown): string[] {
  if (typeof valeur === 'string') {
    return [valeur];
  }
  if (Array.isArray(valeur)) {
    return valeur.flatMap((element: unknown) => chainesDe(element));
  }
  if (typeof valeur !== 'object' || valeur === null) {
    return [];
  }
  return Object.entries(valeur)
    .filter(([cle]) => !CLES_NON_TEXTUELLES.has(cle))
    .flatMap(([, element]) => chainesDe(element));
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

function clesDe(valeur: unknown): string[] {
  if (Array.isArray(valeur)) {
    return valeur.flatMap((element: unknown) => clesDe(element));
  }
  if (typeof valeur !== 'object' || valeur === null) {
    return [];
  }
  return Object.entries(valeur).flatMap(([cle, element]) => [
    cle,
    ...clesDe(element),
  ]);
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

describe('B2-01 V3 — fichier de données', () => {
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
    expect(lues).toHaveLength(52);
  });

  it('nomme chaque écran selon la convention et le titre du § 3 (AC-02)', () => {
    const titres = titresPublics(DOCUMENT);

    for (const ecran of COURS.ecrans) {
      expect(ecran.id).toMatch(IDENTIFIANT_D_ECRAN);
      expect(ecran.titre).toBe(titres.get(ecran.id));
      expect(ecran.titre?.length).toBeLessThanOrEqual(120);
    }
    expect(new Set(COURS.ecrans.map((ecran) => ecran.id)).size).toBe(52);
  });

  it('dure 210 min, soit 30, 36, 36, 38, 42 et 28 min par acte (AC-03)', () => {
    const parActe = [1, 2, 3, 4, 5, 6].map((acte) =>
      COURS.ecrans
        .filter((ecran) => acteDe(ecran) === acte)
        .reduce((total, ecran) => total + ecran.dureeMinutes, 0),
    );

    expect(COURS.dureeMinutes).toBe(210);
    expect(parActe).toEqual([30, 36, 36, 38, 42, 28]);
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

  it('borne l’exposition continue à 5 min pour 161 min interactives et 49 d’exposition (AC-04)', () => {
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

    expect(plusLong).toBe(5);
    expect([minutes(true), minutes(false)]).toEqual([161, 49]);
  });

  it('porte les questions fermées notées sur neuf ateliers de 8 à 14 min (AC-05)', () => {
    const ateliers = COURS.ecrans
      .slice(1, -1)
      .filter((ecran) => questionsDe(ecran).some(estFermeeNotee))
      .map((ecran) => `${ecran.id.slice(6, 11)} (${ecran.dureeMinutes})`);

    expect(ateliers).toEqual([
      'A1-05 (8)',
      'A2-03 (14)',
      'A2-07 (8)',
      'A3-01 (8)',
      'A3-07 (10)',
      'A4-03 (8)',
      'A5-02 (8)',
      'A5-06 (9)',
      'A5-07 (8)',
    ]);
  });

  it('rédige les notes de chaque écran en cinq rubriques non vides (AC-06)', () => {
    for (const ecran of COURS.ecrans) {
      const lignes = ecran.notes.split('\n');

      expect(lignes.map((ligne) => ligne.split(' : ')[0])).toEqual(RUBRIQUES);
      expect(
        lignes.every(
          (ligne) => ligne.split(' : ').slice(1).join(' : ').length > 2,
        ),
      ).toBe(true);
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
    const bareme = ouvrirTirages(COURS, tireurSequentiel(1), 3);

    expect(bareme.version).toBe(2);
    expect(bareme.tirages).toHaveLength(60);
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
    ).toHaveLength(11);
  });

  it('sert au catalogue les 13 écrans catalogue et verrouille les 39 autres (B19)', () => {
    const catalogue = projeterCatalogue(COURS);
    const verrouilles = catalogue.ecrans.filter(
      (ecran) => ecran.type === 'ecran-verrouille',
    );

    expect(verrouilles).toHaveLength(39);
    expect(
      catalogue.ecrans
        .filter((ecran) => ecran.type !== 'ecran-verrouille')
        .map((ecran) => ecran.id.slice(6, 11)),
    ).toEqual([
      'A1-02',
      'A1-03',
      'A1-04',
      'A1-06',
      'A1-07',
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
      ...COURS.ecrans.flatMap((ecran) =>
        ecran.brique === 'fp-cardsort'
          ? justificationsPropres(ecran.production.corrige, ecran)
          : [],
      ),
    ].filter((secret) => secret.length >= LONGUEUR_MIN_D_UN_TEXTE_COMPARE);

    for (const publie of publics) {
      const texte = JSON.stringify(publie);
      const vides = JSON.stringify(publie).match(
        /"misconceptionsCiblees":\[[^\]]/g,
      );

      expect(clesDe(publie).filter((cle) => interdites.includes(cle))).toEqual(
        [],
      );
      expect(secrets.filter((secret) => texte.includes(secret))).toEqual([]);
      expect(vides).toBeNull();
    }
  });

  it('recopie mot pour mot les textes du document (§ 3, § 5 et annexe A.6)', () => {
    const reference = texteNormalise(DOCUMENT);
    const textes = B2_COURS.ecrans.flatMap((ecran) => [
      ecran.titre ?? '',
      ...ecran.notes.split('\n'),
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
    const graphiqueBrut = B2_COURS.ecrans.find(
      (ecran) => ecran.screenId === 'B2-01-A2-02-ORIGINE-AXE',
    );
    const proprietesGraphique =
      graphiqueBrut !== undefined && 'proprietes' in graphiqueBrut
        ? graphiqueBrut.proprietes
        : null;
    const atelierBrut = B2_COURS.ecrans.find(
      (ecran) => ecran.screenId === 'B2-01-A2-03-ATELIER-1',
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
      'Réglez l’origine et le haut de l’axe pour voir comment l’échelle transforme la lecture, sans changer les valeurs.',
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

describe('B2-01 V3 — recalcul des corrigés depuis les données brutes (AC-10)', () => {
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
