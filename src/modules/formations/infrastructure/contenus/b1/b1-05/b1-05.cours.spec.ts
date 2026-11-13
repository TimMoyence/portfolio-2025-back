import { COURS_B1_05 } from './b1-05.cours';
import { buildCoursDuContenu } from '../../../../../../../test/factories/formations/cours/contenus-de-cours.factory';
import { questionsDuCours } from '../../../../domain/cours/structure/Cours';
import * as fiche from '../../../../../../../test/helpers/formations/cours/fiche-de-cours';
import * as feuilleDeCours from '../../../../../../../test/helpers/formations/cours/feuille-de-cours';
import { valeursAuCatalogue } from '../../../../../../../test/helpers/formations/cours/relecture-de-cours';
import { verifierStructure } from '../../../../domain/cours/structure/StructureCours';
import { corrigerFeuille } from '../../../../domain/cours/correction/CorrectionProduction';
import { CLIENTS, COMMANDES_DU_SAMEDI } from './b1-05.donnees';

const COURS = buildCoursDuContenu(COURS_B1_05);
const TABLES_DE_VERITE = 'B1-05-A1-09-TABLES-DE-VERITE';
const FICHIER_DES_CLIENTS = 'B1-05-A3-05-FICHIER-CLIENTS';

interface Client {
  readonly nom: string;
  readonly fidele: boolean;
  readonly panier: number;
  readonly abonne: boolean;
}

const compter = (
  clients: readonly Client[],
  regle: (client: Client) => boolean,
): number => clients.filter(regle).length;
const implique = (p: boolean, q: boolean): boolean => !p || q;

const CONTRE_EXEMPLES = compter(
  CLIENTS,
  (client) => !implique(client.panier >= 50, client.fidele),
);
const NON_FIDELES = compter(CLIENTS, (client) => !client.fidele);
const HORS_EQUIVALENCE = compter(
  CLIENTS,
  (client) => client.panier >= 50 !== client.fidele,
);
const LIVRAISONS = compter(
  CLIENTS,
  (client) => client.panier >= 60 || client.abonne,
);
const LIVRAISONS_ADDITIONNEES =
  compter(CLIENTS, (client) => client.panier >= 60) +
  compter(CLIENTS, (client) => client.abonne);
const LIVRAISONS_EXCLUSIVES = compter(
  CLIENTS,
  (client) => client.panier >= 60 !== client.abonne,
);

const REPONSES_PAR_EXERCICE = [
  [
    'A3-06-ATELIER-CLIENTS',
    [`${CONTRE_EXEMPLES} clients`, `${LIVRAISONS} clients`],
  ],
] as const;

const MOTS_DU_COURS =
  /connecteur|vérité|vrai|faux|implication|équivalen|négation|contraire|prédicat|quantificateur|pour tout|il existe|morgan|condition|proposition|\d/i;

fiche.decrireLaFicheDuCours('B1-05', COURS, {
  ...fiche.FORME_DES_COURS_B1,
  conception: 'b1/cours-b1-05-conception.md',
  ecrans: 33,
  minutesParActe: [45, 36, 32, 8, 0, 0],
  rythme: { expositionContinueMax: 6, interactives: 93, exposition: 28 },
  noteesParType: [12, 2, 0, 1, 0],
  enigmes: 0,
  rappels: 12,
  options: 28,
  catalogue: fiche.CATALOGUE_ILLUSTRE_JUSQU_A_LA_PAGE_A4_02,
  ateliersNotes: ['A1-10 (14)', 'A2-05 (8)', 'A3-06 (13)'],
  remediations: 11,
  corrigesSurPlace: [
    'B1-05-A1-10-ATELIER-CONNECTEURS',
    'B1-05-A2-05-ATELIER-NEGATIONS',
    'B1-05-A2-06-TABLEUR-CONTROLES',
    'B1-05-A3-06-ATELIER-CLIENTS',
  ],
});

const ECRANS_POUR_COMPRENDRE = [
  [
    'A1-06',
    'SERRURES',
    'CONNECTEURS',
    'serrures-portes',
    ['connecteurs', '« et »', '« ou »'],
  ],
  [
    'A1-07',
    'PLUIE',
    'IMPLICATION',
    'pluie-arrosoir',
    ['implication', 'équivalence'],
  ],
  ['A2-02', 'PORTILLON', 'MORGAN', 'portillon-casque', ['lois de Morgan']],
  ['A2-03', 'TOISE', 'PREDICATS', 'toise-manege', ['prédicat', 'négation']],
  [
    'A3-02',
    'PANIER',
    'QUANTIFICATEURS',
    'panier-pommes',
    ['pour tout', 'il existe'],
  ],
  ['A3-03', 'CLES', 'ORDRE', 'cles-cadenas', ['ordre des quantificateurs']],
] as const;

describe('B1-05 — les écrans « pour comprendre »', () => {
  feuilleDeCours.decrireLesEcransPourComprendre(
    'B1-05',
    COURS_B1_05,
    ECRANS_POUR_COMPRENDRE,
    MOTS_DU_COURS,
  );

  it('B105-M2 · garde une seule page par notion, chacune avec sa méthode et sans encadré « Au CCF »', () => {
    expect(fiche.pagesDeCours(COURS_B1_05).map((id) => id.slice(12))).toEqual([
      'COURS-CONNECTEURS',
      'COURS-IMPLICATION',
      'COURS-MORGAN',
      'COURS-PREDICATS',
      'COURS-QUANTIFICATEURS',
      'COURS-ORDRE',
    ]);
    expect(fiche.pagesSansMethodeOuAvecEncadreCcf(COURS_B1_05)).toEqual([]);
  });
});

const lettre = (valeur: boolean): string => (valeur ? 'V' : 'F');

describe('B1-05 — les tables dessinées par le code', () => {
  it('B105-M3 · montre avant l’exercice 1 les tables de vérité des cinq connecteurs, en séance', () => {
    const ecran = COURS_B1_05.ecrans.find(
      ({ screenId }) => screenId === TABLES_DE_VERITE,
    );
    const props = feuilleDeCours.proprietesV2(COURS_B1_05, TABLES_DE_VERITE);
    const combinaisons = [
      [true, true],
      [true, false],
      [false, true],
      [false, false],
    ] as const;

    expect(ecran?.diffusion).toBe('seance');
    expect(props.rows).toEqual(
      combinaisons.map(([p, q]) => ({
        p: lettre(p),
        q: lettre(q),
        nonP: lettre(!p),
        et: lettre(p && q),
        ou: lettre(p || q),
        implique: lettre(implique(p, q)),
        equivaut: lettre(p === q),
      })),
    );
  });

  it('B105-M3 · montre avant l’exercice 4 le fichier des huit clients, en séance', () => {
    const ecran = COURS_B1_05.ecrans.find(
      ({ screenId }) => screenId === FICHIER_DES_CLIENTS,
    );
    const props = feuilleDeCours.proprietesV2(COURS_B1_05, FICHIER_DES_CLIENTS);
    const ouiNon = (valeur: boolean): string => (valeur ? 'oui' : 'non');

    expect(ecran?.diffusion).toBe('seance');
    expect(props.rows).toEqual(
      CLIENTS.map((client) => ({
        client: client.nom,
        fidele: ouiNon(client.fidele),
        panier: `${client.panier} €`,
        abonne: ouiNon(client.abonne),
      })),
    );
    expect(CLIENTS).toHaveLength(8);
  });
});

function confusionsDuVote(id: string): string[] {
  const question = questionsDuCours(COURS).find(
    (candidate) => candidate.id === id,
  );
  return question?.type === 'vote' ? [...question.confusions] : [];
}

describe('B1-05 — les réponses recalculées depuis les données', () => {
  it('B105-M4 · compte les contre-exemples de l’implication et les livraisons offertes, avec leurs pièges', () => {
    fiche.attendreLesNumeriques(COURS, {
      'b1-05-a3-contre-exemples': [
        CONTRE_EXEMPLES,
        NON_FIDELES,
        HORS_EQUIVALENCE,
      ],
      'b1-05-a3-livraison': [
        LIVRAISONS,
        LIVRAISONS_ADDITIONNEES,
        LIVRAISONS_EXCLUSIVES,
      ],
    });
  });

  it('B105-M4 · distingue chaque piège compté de la bonne réponse', () => {
    expect(new Set([CONTRE_EXEMPLES, NON_FIDELES, HORS_EQUIVALENCE]).size).toBe(
      3,
    );
    expect(
      new Set([LIVRAISONS, LIVRAISONS_ADDITIONNEES, LIVRAISONS_EXCLUSIVES])
        .size,
    ).toBe(3);
  });

  it('B105-M4 · tient vraie « pour tout fidèle, il existe un panier plus grand » et fausse l’ordre inverse', () => {
    const fideles = CLIENTS.filter((client) => client.fidele);
    const pourToutIlExiste = fideles.every((fidele) =>
      CLIENTS.some((client) => client.panier > fidele.panier),
    );
    const ilExistePourTout = fideles.some((fidele) =>
      CLIENTS.every(
        (client) => client === fidele || fidele.panier > client.panier,
      ),
    );

    expect([pourToutIlExiste, ilExistePourTout]).toEqual([true, false]);
    expect(CLIENTS.some((client) => client.abonne && !client.fidele)).toBe(
      true,
    );
  });

  it('B105-M6 · nomme l’implication à prémisse fausse, la réciproque et le « ou » exclusif dans l’exercice 1', () => {
    expect({
      ou: confusionsDuVote('b1-05-a1-livraison-farid'),
      premisse: confusionsDuVote('b1-05-a1-implication-hugo'),
      reciproque: confusionsDuVote('b1-05-a1-reciproque-ana'),
      borne: confusionsDuVote('b1-05-a1-remise-chloe'),
    }).toEqual({
      ou: ['ou-lu-exclusif'],
      premisse: ['implication-fausse-si-premisse-fausse'],
      reciproque: ['implication-lue-comme-equivalence'],
      borne: ['borne-stricte-large'],
    });
  });

  it('B105-M4 · nomme Morgan et la borne dans les négations de l’exercice 2', () => {
    expect({
      livraison: confusionsDuVote('b1-05-a2-contraire-livraison'),
      remise: confusionsDuVote('b1-05-a2-contraire-remise'),
      predicat: confusionsDuVote('b1-05-a2-predicat'),
      tableur: confusionsDuVote('b1-05-a2-non-et-tableur'),
    }).toEqual({
      livraison: ['negation-sans-morgan'],
      remise: ['negation-sans-morgan', 'negation-comparaison'],
      predicat: ['negation-comparaison'],
      tableur: ['negation-sans-morgan'],
    });
  });

  it('B105-M4 · nomme les quantificateurs niés ou échangés dans l’exercice 4', () => {
    expect({
      tous: confusionsDuVote('b1-05-a3-negation-tous'),
      existe: confusionsDuVote('b1-05-a3-negation-existe'),
      ordre: confusionsDuVote('b1-05-a3-ordre'),
    }).toEqual({
      tous: ['negation-pour-tout-en-aucun'],
      existe: ['negation-il-existe-gardee'],
      ordre: ['ordre-quantificateurs-inverse'],
    });
  });
});

const PORT = 6;
const remise = (client: Client, ou = false, stricte = false): number => {
  const panier = stricte ? client.panier > 50 : client.panier >= 50;
  const accordee = ou ? client.fidele || panier : client.fidele && panier;
  return accordee ? client.panier / 10 : 0;
};
const port = (client: Client, sansMorgan = false, large = false): number => {
  const petit = large ? client.panier <= 60 : client.panier < 60;
  const paye = sansMorgan ? petit || !client.abonne : petit && !client.abonne;
  const net = client.panier - remise(client);
  return paye ? net + PORT : net;
};
const avecPieges = (juste: number, pieges: readonly number[]): number[] => [
  juste,
  ...pieges.filter((piege) => piege !== juste),
];

describe('B1-05 — la feuille des contrôles', () => {
  const PLAN = 'b1-05-a2-tableur-controles';
  const lignes = COMMANDES_DU_SAMEDI.map((_, rang) => rang + 2);
  const formules = (
    remiseDe: (ligne: number) => string,
    portDe: (ligne: number) => string,
  ): Record<string, string> =>
    Object.fromEntries(
      lignes.flatMap((ligne) => [
        [`E${ligne}`, remiseDe(ligne)],
        [`F${ligne}`, portDe(ligne)],
      ]),
    );
  const JUSTES = formules(
    (ligne) => `=SI(ET(B${ligne}="oui";C${ligne}>=50);C${ligne}/10;0)`,
    (ligne) =>
      `=SI(ET(C${ligne}<60;D${ligne}="non");C${ligne}-E${ligne}+6;C${ligne}-E${ligne})`,
  );
  const verdictDe = (
    envoi: Readonly<Record<string, string>>,
    cellule: string,
  ) =>
    corrigerFeuille(fiche.corrigeDeFeuille(COURS, PLAN), envoi).verdicts.find(
      (verdict) => verdict.reference === cellule,
    );

  it('B105-M4 · attend la remise et le port de chaque commande, recopiés vers le bas, avec leurs pièges', () => {
    fiche.attendreLaFeuille(
      fiche.corrigeDeFeuille(COURS, PLAN),
      Object.fromEntries(
        COMMANDES_DU_SAMEDI.flatMap((client, rang) => [
          [
            `E${rang + 2}`,
            avecPieges(remise(client), [
              remise(client, true),
              remise(client, false, true),
            ]),
          ],
          [
            `F${rang + 2}`,
            avecPieges(
              port(client),
              [port(client, true)].filter(
                (piege) => piege !== port(client, false, true),
              ),
            ),
          ],
        ]),
      ),
    );
  });

  it('B105-M4 · reconnaît juste la feuille écrite puis recopiée', () => {
    expect(
      corrigerFeuille(fiche.corrigeDeFeuille(COURS, PLAN), JUSTES).score,
    ).toBe(1);
  });

  it.each([
    [
      'nomme le « ou » écrit à la place du « et »',
      'E',
      (client: Client) => remise(client, true) !== remise(client),
      (ligne: number) =>
        `=SI(OU(B${ligne}="oui";C${ligne}>=50);C${ligne}/10;0)`,
      'et-traduit-par-ou',
    ],
    [
      'nomme le contraire écrit sans Morgan',
      'F',
      (client: Client) => port(client, true) !== port(client),
      (ligne: number) =>
        `=SI(OU(C${ligne}<60;D${ligne}="non");C${ligne}-E${ligne}+6;C${ligne}-E${ligne})`,
      'negation-sans-morgan',
    ],
    [
      'nomme la borne stricte à 50 € pile',
      'E',
      (client: Client) => remise(client, false, true) !== remise(client),
      (ligne: number) => `=SI(ET(B${ligne}="oui";C${ligne}>50);C${ligne}/10;0)`,
      'borne-stricte-large',
    ],
    [
      'ne nomme pas Morgan pour la livraison payée à 60 € pile',
      'F',
      (client: Client) => port(client, false, true) !== port(client),
      (ligne: number) =>
        `=SI(ET(C${ligne}<=60;D${ligne}="non");C${ligne}-E${ligne}+6;C${ligne}-E${ligne})`,
      null,
    ],
  ] as const)(
    'B105-M4 · %s',
    (_titre, colonne, differe, formule, confusion) => {
      const fautive = COMMANDES_DU_SAMEDI.findIndex(differe);
      const cellule = `${colonne}${fautive + 2}`;

      expect(fautive).toBeGreaterThanOrEqual(0);
      expect(
        verdictDe({ ...JUSTES, [cellule]: formule(fautive + 2) }, cellule),
      ).toEqual(expect.objectContaining({ juste: false, confusion }));
    },
  );

  it.each([
    [
      'un seuil de remise pris à 45 €',
      (ligne: number) =>
        `=SI(ET(B${ligne}="oui";C${ligne}>=45);C${ligne}/10;0)`,
      (ligne: number) =>
        `=SI(ET(C${ligne}<60;D${ligne}="non");C${ligne}-E${ligne}+6;C${ligne}-E${ligne})`,
    ],
    [
      'la livraison payée à 60 € pile',
      (ligne: number) =>
        `=SI(ET(B${ligne}="oui";C${ligne}>=50);C${ligne}/10;0)`,
      (ligne: number) =>
        `=SI(ET(C${ligne}<=60;D${ligne}="non");C${ligne}-E${ligne}+6;C${ligne}-E${ligne})`,
    ],
  ])('B105-M4 · refuse %s', (_cas, remiseFausse, portFaux) => {
    expect(
      corrigerFeuille(
        fiche.corrigeDeFeuille(COURS, PLAN),
        formules(remiseFausse, portFaux),
      ).score,
    ).toBeLessThan(1);
  });
});

describe('B1-05 — confidentialité des réponses', () => {
  it('B105-M5 · ne sert au catalogue aucune réponse d’exercice', () => {
    expect(
      valeursAuCatalogue(
        COURS,
        REPONSES_PAR_EXERCICE.flatMap(([, reponses]) => reponses),
      ),
    ).toEqual([]);
  });

  it.each(REPONSES_PAR_EXERCICE)(
    'B105-M5 · ne montre aucune réponse de %s dans un écran antérieur',
    (ecran, reponses) => {
      expect(
        feuilleDeCours.reponsesDejaMontrees(
          COURS_B1_05,
          `B1-05-${ecran}`,
          reponses,
        ),
      ).toEqual([]);
    },
  );

  it('B105-M5 · ne lève aucune violation de structure, sans dérogation', () => {
    expect(verifierStructure(COURS, [])).toEqual([]);
  });
});
