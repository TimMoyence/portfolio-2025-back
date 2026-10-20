import { buildCoursDuContenu } from '../../../../../test/factories/contenus-de-cours.factory';
import {
  attendreLaFeuille,
  attendreLesEnigmes,
  attendreLesNumeriques,
  corrigeDe,
  corrigeDeFeuille,
  CATALOGUE_ILLUSTRE_A_SIX_PAGES,
  decrireLaFicheDuCours,
  decrireLaMiniSituation,
  valeursEtPieges,
} from '../../../../../test/helpers/fiche-de-cours';
import {
  rangsDe,
  recopier,
} from '../../../../../test/helpers/feuille-de-cours';
import type { Ecran } from '../../domain/contrats/cours';
import type { CorrigeFeuille } from '../../domain/cours/Corrige';
import { corrigerFeuille } from '../../domain/cours/CorrectionProduction';
import { evaluerCellule } from '../../domain/cours/Formule';
import { COURS_B2_03 } from './b2-03.cours';

const COURS = buildCoursDuContenu(COURS_B2_03);

interface Facture {
  readonly numero: string;
  readonly client: string;
  readonly pays: string;
  readonly ht: number;
  readonly delai: number;
  readonly impayee: boolean;
  readonly tva: boolean;
}

const FACTURES: readonly Facture[] = [
  ['F201', 'Voiles Martin', 'France', 1250, 35, false, true],
  ['F202', 'Nautic Sud', 'France', 6400, 72, true, true],
  ['F203', 'Sailtech GmbH', 'Allemagne', 3100, 48, false, true],
  ['F204', 'École de voile Ré', 'France', 890, 64, true, true],
  ['F205', 'Mar Azul SL', 'Espagne', 5200, 30, false, false],
  ['F206', 'Chantier Duval', 'France', 2300, 58, true, true],
  ['F207', 'Blue Sails BV', 'Pays-Bas', 1800, 81, true, false],
  ['F208', 'Club nautique Oléron', 'France', 740, 22, false, true],
  ['F209', 'Nautic Sud', 'France', 4950, 61, false, true],
  ['F210', 'Sailtech GmbH', 'Allemagne', 7300, 40, false, true],
  ['F211', 'Voiles Martin', 'France', 1600, 90, true, true],
  ['F212', 'Vela Italia Srl', 'Italie', 2750, 15, true, false],
  ['F213', 'Chantier Duval', 'France', 5000, 60, true, true],
  ['F214', 'École de voile Ré', 'France', 430, 12, false, true],
  ['F215', 'Mar Azul SL', 'Espagne', 3900, 95, true, true],
  ['F216', 'Club nautique Oléron', 'France', 1150, 45, false, true],
].map(([numero, client, pays, ht, delai, impayee, tva]) => ({
  numero: String(numero),
  client: String(client),
  pays: String(pays),
  ht: Number(ht),
  delai: Number(delai),
  impayee: impayee === true,
  tva: tva === true,
}));

const INDEMNITE_FORFAITAIRE = 40;
const SEUIL_DU_VISA = 5000;
const DELAI_MAXIMUM = 60;

type Regle = (facture: Facture) => boolean;

const compter = (regle: Regle): number => FACTURES.filter(regle).length;

function factureNumero(numero: string): Facture {
  const facture = FACTURES.find((candidate) => candidate.numero === numero);
  if (facture === undefined) {
    throw new Error(`facture ${numero} absente`);
  }
  return facture;
}
const horsDeFrance: Regle = (facture) => facture.pays !== 'France';
const grosMontant: Regle = (facture) => facture.ht >= SEUIL_DU_VISA;
const enRetard: Regle = (facture) => facture.delai > DELAI_MAXIMUM;
const aRelancer: Regle = (facture) => facture.impayee && enRetard(facture);
const aViser: Regle = (facture) =>
  grosMontant(facture) || horsDeFrance(facture);

decrireLaFicheDuCours('B2-03', COURS, {
  conception: 'cours-b2-03-conception.md',
  ecrans: 32,
  dureeMinutes: 140,
  minutesParActe: [36, 33, 23, 48, 0, 0],
  rythme: { expositionContinueMax: 6, interactives: 111, exposition: 29 },
  ateliersNotes: ['A1-10 (8)', 'A2-05 (11)', 'A3-05 (11)'],
  noteesParType: [7, 2, 0, 2, 1],
  enigmes: 4,
  rappels: 9,
  remediations: 9,
  options: 11 + 9,
  catalogue: CATALOGUE_ILLUSTRE_A_SIX_PAGES,
  corrigesSurPlace: [
    'B2-03-A1-09-TABLE-VERITE',
    'B2-03-A1-10-ATELIER-CONNECTEURS',
    'B2-03-A2-05-ATELIER-MORGAN',
    'B2-03-A2-06-TABLEUR-NON-OU',
    'B2-03-A3-05-ATELIER-QUANTIF',
    'B2-03-A4-02-TABLEUR-CONTROLE',
    'B2-03-A4-03-COFFRE-CONTROLE',
  ],
});

const feuilleDe = (id: string): CorrigeFeuille => corrigeDeFeuille(COURS, id);

decrireLaMiniSituation('B2-03', COURS_B2_03, {
  donneesFictives: ['B2-03-A1-04-FACTURES', 'B2-03-A4-01-SITUATION-FACTURES'],
  coffre: 'B2-03-A4-03-COFFRE-CONTROLE',
  tableur: 'B2-03-A4-02-TABLEUR-CONTROLE',
});

describe('B2-03 — recalcul des corrigés depuis les seize factures', () => {
  it('recalcule les solutions et pièges des deux questions numériques', () => {
    attendreLesNumeriques(COURS, {
      'b2-03-a2-sans-visa': [
        compter((facture) => !aViser(facture)),
        compter(
          (facture) => facture.ht <= SEUIL_DU_VISA && !horsDeFrance(facture),
        ),
        compter((facture) => !grosMontant(facture) || !horsDeFrance(facture)),
      ],
      'b2-03-a3-impayees-recentes': [
        compter((facture) => facture.impayee && facture.delai < DELAI_MAXIMUM),
        compter((facture) => facture.impayee && facture.delai <= DELAI_MAXIMUM),
      ],
    });
  });

  it('recalcule les solutions et pièges des quatre énigmes de la mini-situation', () => {
    const indemnites = (regle: Regle): number =>
      compter(regle) * INDEMNITE_FORFAITAIRE;
    const anomalieTva: Regle = (facture) =>
      horsDeFrance(facture) && !facture.tva;

    attendreLesEnigmes(COURS, {
      'b2-03-a4-e1-indemnites': [
        indemnites(aRelancer),
        indemnites(
          (facture) => facture.impayee && facture.delai >= DELAI_MAXIMUM,
        ),
        indemnites((facture) => facture.impayee || enRetard(facture)),
      ],
      'b2-03-a4-e2-sans-relance': [
        compter((facture) => !aRelancer(facture)),
        compter((facture) => !facture.impayee && !enRetard(facture)),
        compter((facture) => !facture.impayee || facture.delai < DELAI_MAXIMUM),
      ],
      'b2-03-a4-e3-visa': [
        compter((facture) => aViser(facture) && !grosMontant(facture)),
        0,
      ],
      'b2-03-a4-e4-requete': [
        compter(anomalieTva),
        compter((facture) => horsDeFrance(facture) || !facture.tva),
      ],
    });
  });

  it('recalcule la table de vérité A1-09 ligne par ligne, et ses pièges', () => {
    const corrige = corrigeDe(COURS, 'b2-03-a1-table-verite');
    if (corrige.type !== 'tableau') {
      throw new Error('la table A1-09 n’a pas de corrigé de tableau');
    }
    const verite = (valeur: boolean): number => (valeur ? 1 : 0);
    const ouExclusifDeLaPremiereLigne = (p: boolean, q: boolean) =>
      verite(p !== q);
    const equivalenceDeLaTroisiemeLigne = (p: boolean, q: boolean) =>
      verite(p === q);
    const attendus = ['F205', 'F203', 'F202', 'F201'].flatMap(
      (numero, rang) => {
        const facture = factureNumero(numero);
        const p = horsDeFrance(facture);
        const q = grosMontant(facture);
        return [
          [verite(!p)],
          [verite(p && q)],
          rang === 0
            ? [verite(p || q), ouExclusifDeLaPremiereLigne(p, q)]
            : [verite(p || q)],
          rang === 2
            ? [verite(!p || q), equivalenceDeLaTroisiemeLigne(p, q)]
            : [verite(!p || q)],
        ];
      },
    );

    expect(corrige.attendus.map(valeursEtPieges)).toEqual(attendus);
  });
});

describe('B2-03 — les deux feuilles corrigées par le moteur de formules', () => {
  it('nomme l’oubli des guillemets autour d’un texte accentué ou d’un critère de NB.SI', () => {
    const corrige = feuilleDe('b2-03-a4-feuille-controle');
    const lignes = rangsDe(2, 17);
    const envoi = {
      ...recopier('=SI(ET(F2=Impayée;E2>60);"Relancer";"Non")', 'H', 2, 17),
      K2: '=NB.SI(H2:H17;Relancer)',
    };
    const confusions = new Map(
      corrigerFeuille(corrige, envoi).verdicts.map((verdict) => [
        verdict.reference,
        verdict.confusion,
      ]),
    );

    expect(lignes.map((ligne) => confusions.get(`H${ligne}`))).toEqual(
      lignes.map(() => 'critere-sans-guillemets'),
    );
    expect(confusions.get('K2')).toBe('critere-sans-guillemets');
  });

  it('compte au tableur les montants d’au moins 5 000 € HT et les clients hors de France', () => {
    const { plan } = feuilleDe('b2-03-a4-feuille-controle');
    const feuille = {
      lignes: plan.lignes,
      colonnes: plan.colonnes,
      cellules: {
        ...plan.cellules,
        K4: '=NB.SI(D2:D17;">=5000")',
        K5: '=NB.SI(C2:C17;"<>France")',
      },
    };

    expect(evaluerCellule(feuille, 'K4').valeur).toBe(compter(grosMontant));
    expect(evaluerCellule(feuille, 'K5').valeur).toBe(compter(horsDeFrance));
  });

  it('reconnaît justes les deux contrôles équivalents de l’exercice 4', () => {
    const corrige = feuilleDe('b2-03-a2-tableur-non-ou');
    const envoi = {
      ...recopier(
        '=SI(NON(OU(B2="France";C2="Oui"));"Anomalie";"OK")',
        'D',
        2,
        6,
      ),
      ...recopier('=SI(ET(B2<>"France";C2="Non");"Anomalie";"OK")', 'E', 2, 6),
    };
    const colonne = ['OK', 'Anomalie', 'OK', 'Anomalie', 'OK'];

    attendreLaFeuille(
      corrige,
      Object.fromEntries(
        ['D', 'E'].flatMap((lettre) =>
          colonne.map((valeur, rang) => [`${lettre}${rang + 2}`, [valeur]]),
        ),
      ),
    );
    expect(corrigerFeuille(corrige, envoi).score).toBe(1);
  });

  it('reconnaît juste la feuille de contrôle de la mini-situation et recompte ses relances', () => {
    const corrige = feuilleDe('b2-03-a4-feuille-controle');
    const envoi = {
      ...recopier('=SI(ET(F2="Impayée";E2>60);"Relancer";"Non")', 'H', 2, 17),
      ...recopier('=SI(OU(D2>=5000;C2<>"France");"Visa";"Non")', 'I', 2, 17),
      K2: '=NB.SI(H2:H17;"Relancer")',
    };
    const relance = (numero: string) => [
      aRelancer(factureNumero(numero)) ? 'Relancer' : 'Non',
    ];
    const visa = (numero: string) => [
      aViser(factureNumero(numero)) ? 'Visa' : 'Non',
    ];

    attendreLaFeuille(corrige, {
      ...Object.fromEntries(
        FACTURES.map((facture, rang) => [
          `H${rang + 2}`,
          relance(facture.numero),
        ]),
      ),
      ...Object.fromEntries(
        FACTURES.map((facture, rang) => [`I${rang + 2}`, visa(facture.numero)]),
      ),
      K2: [
        compter(aRelancer),
        compter((facture) => facture.impayee && facture.delai >= DELAI_MAXIMUM),
      ],
    });
    expect(corrigerFeuille(corrige, envoi).score).toBe(1);
  });
});

describe('B2-03 — retours de Tim du 15 octobre 2026', () => {
  function ecranNomme(screenId: string): Ecran {
    const trouve = COURS.ecrans.find((candidat) => candidat.id === screenId);
    if (trouve === undefined) {
      throw new Error(`écran absent du B2-03 : ${screenId}`);
    }
    return trouve;
  }

  function presentationV2(ecran: Ecran) {
    const presentation =
      ecran.brique === 'fp-story' ? ecran.proprietes.presentation : undefined;
    return presentation?.version === 2 ? presentation : null;
  }

  function blocsDe(ecran: Ecran): readonly string[] | null {
    const presentation = presentationV2(ecran);
    return presentation?.renderer === 'lesson'
      ? presentation.props.blocks.map(({ kind }) => kind)
      : null;
  }

  function imageDe(ecran: Ecran | undefined): string | null {
    const presentation = ecran === undefined ? null : presentationV2(ecran);
    return presentation?.renderer === 'illustration'
      ? presentation.props.image
      : null;
  }

  const lecons = COURS.ecrans.filter((ecran) => blocsDe(ecran) !== null);

  it('précède chaque page de trace écrite d’une illustration cataloguée parmi ses médias', () => {
    const images = new Set(COURS.medias.flatMap(({ chemins }) => chemins));

    expect(
      lecons.map((lecon) => {
        const image = imageDe(COURS.ecrans[COURS.ecrans.indexOf(lecon) - 1]);
        return image !== null && images.has(image);
      }),
    ).toEqual(lecons.map(() => true));
    expect(lecons).toHaveLength(6);
  });

  it('ramène chaque page de trace écrite à sa définition et à son exemple', () => {
    expect(
      Object.fromEntries(lecons.map((lecon) => [lecon.id, blocsDe(lecon)])),
    ).toEqual({
      'B2-03-A1-06-COURS-CONNECTEURS': ['definition', 'example'],
      'B2-03-A1-07-COURS-IMPLICATION': ['definition', 'example'],
      'B2-03-A2-02-COURS-NEGATION': ['definition', 'example'],
      'B2-03-A2-03-COURS-MORGAN': ['definition', 'example'],
      'B2-03-A3-02-COURS-PREDICATS': ['definition', 'example', 'method'],
      'B2-03-A3-03-COURS-QUANTIFICATEURS': ['method', 'example'],
    });
  });

  it('ne renvoie la trace écrite à aucune table que ses pages ne portent plus', () => {
    const traceEcrite = JSON.stringify(
      lecons.map((lecon) => presentationV2(lecon)?.props),
    );
    const renvois = COURS.ecrans.flatMap((ecran) =>
      JSON.stringify(ecran)
        .split('"')
        .filter((texte) => /trace écrite donne/i.test(texte)),
    );

    expect(renvois.length).toBeGreaterThan(0);
    expect(
      renvois.filter(
        (renvoi) =>
          /\btables?\b/i.test(renvoi) && !/\btables?\b/i.test(traceEcrite),
      ),
    ).toEqual([]);
  });

  it('pose la mission sans geste ni conséquence, avec ses deux questions', () => {
    const mission = ecranNomme('B2-03-A1-03-MISSION');
    const proprietes = mission.brique === 'fp-pro' ? mission.proprietes : null;

    expect(proprietes?.geste).toBeNull();
    expect(proprietes?.consequence).toBeNull();
    expect(proprietes?.questionsLibres?.map(({ id }) => id)).toEqual([
      'b2-03-a1-mission:regles',
      'b2-03-a1-mission:f213',
    ]);
  });

  it('n’affiche plus de consigne au-dessus des deux questions de l’exercice 5', () => {
    const exercice = ecranNomme('B2-03-A3-05-ATELIER-QUANTIF');

    expect(exercice.brique).toBe('questionnaire');
    expect(exercice).not.toHaveProperty('consigne');
  });

  function tracesDesNotionsRetirees(texte: string): readonly string[] {
    return [
      /ordre des|l’ordre|et ordre|-ordre-|"ordre"(?!:)/gi,
      /ordre de ∀ et ∃/g,
      /[∀∃] puis [∀∃]/g,
      /[∀∃] \p{L}+, [∀∃] \p{L}+/gu,
      /il existe\s*…\s*pour tout/gi,
      /même (?:commercial|facture)/gi,
      /\bclients?\b[^.]{0,40}\bcommercia|\bcommercia\w*\b[^.]{0,40}\bclients?\b/gi,
      /facture payée/gi,
      /« A ou B »/gi,
      /ou-compte-deux-fois|ordre-quantificateurs-inverse|compter-ou/g,
      /b2-03-(?:a1-visa|a3-ordre|a3-clients|r-ordre)\b/g,
      /4 \+ 6/g,
      /\b(?:\d+|deux|trois|quatre|cinq|six|sept|huit|neuf|dix|onze|douze|treize|quatorze|quinze|seize) (?:factures )?visées\b/gi,
      /additionn\w*/gi,
      /compt\w* deux fois/gi,
      /NB\.SI\([^;)]*;\\?"Visa/gi,
      /\bfactures à viser\b/gi,
      /faut-il viser/gi,
    ].flatMap((motif) => [...texte.matchAll(motif)].map(([trace]) => trace));
  }

  it('ne parle plus nulle part de l’ordre des quantificateurs ni du comptage de « A ou B »', () => {
    expect(tracesDesNotionsRetirees(JSON.stringify(COURS_B2_03))).toEqual([]);
  });

  it.each([
    'ordre',
    'Cours : quantificateurs au tableur et ordre',
    'Écrivez chaque phrase avec ∀ et ∃, dans l’ordre des mots.',
    '« Chaque client a un commercial » (∀ puis ∃) n’entraîne pas qu’un même commercial les suive tous (∃ puis ∀).',
    'Hélène : ∃ commercial, ∀ client, il le suit. Marc : ∀ client, ∃ commercial qui le suit.',
    'Chacun des cinq clients a un commercial, Léa ou Karim : la phrase de Marc est vraie.',
    'Échanger « pour tout … il existe » et « il existe … pour tout » : la phrase change de sens.',
    'Chaque client a au moins une facture payée',
    'Combien des seize factures faut-il viser ?',
    'b2-03-a3-ordre',
    'b2-03-a3-clients',
    'b2-03-r-ordre',
    '• Pièges : « ou » exclusif ; additionner les deux conditions ; > au lieu de ≥ ; réciproque prise pour la règle.',
    '• Erreurs à chercher : textes sans guillemets ; >= au lieu de > pour la relance ; NB.SI additionnés pour le visa.',
    '=NB.SI(H2:H17;"Relancer") donne 5 et =NB.SI(I2:I17;"Visa") donne 8.',
    'F205 et F210 compteraient deux fois.',
    'En K2 et K3, comptez avec NB.SI les factures à relancer et les factures à viser.',
    'Factures à viser',
    'b2-03-r-compter-ou',
    'Seize factures moins les huit visées : 8 factures.',
    '4 + 6 − 2 = 8 factures.',
  ])('reconnaît la trace retirée « %s »', (retiree) => {
    expect(tracesDesNotionsRetirees(JSON.stringify(retiree))).not.toEqual([]);
  });

  it('ne fait plus compter les visas au tableur de la mini-situation', () => {
    const { plan } = feuilleDe('b2-03-a4-feuille-controle');

    expect(
      Object.keys(plan.cellules).filter((cle) => /^[JK]3$/.test(cle)),
    ).toEqual([]);
    expect(plan.consignes.at(-1)).toBe(
      'En K2, comptez avec NB.SI les factures à relancer.',
    );
  });

  it('numérote les exercices de 1 à 5, chacun renvoyé au même exercice du livret', () => {
    const exercices = COURS.ecrans.flatMap((ecran) => {
      const numero = /^Exercice (\d+) —/.exec(ecran.titre ?? '')?.[1];
      return numero === undefined
        ? []
        : [[numero, /exercice (\d+) du livret/.exec(ecran.notes)?.[1]]];
    });

    expect(exercices.map(([numero]) => numero)).toEqual([
      '1',
      '2',
      '3',
      '4',
      '5',
    ]);
    expect(
      exercices.filter(
        ([numero, papier]) => papier !== undefined && papier !== numero,
      ),
    ).toEqual([]);
  });
});
