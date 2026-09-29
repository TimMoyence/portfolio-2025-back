import type { ConceptId } from '../../domain/cours/banque/concepts';
import type { ContenuDeCours } from '../../domain/cours/CoursStocke';
import * as moteur from './briques';

const CONCEPTS_DU_COURS = [
  'proposition',
  'connecteur',
  'negation',
  'quantificateur',
  'tableur',
] as const satisfies readonly ConceptId[];

interface Facture {
  readonly numero: string;
  readonly client: string;
  readonly pays: string;
  readonly ht: number;
  readonly delai: number;
  readonly statut: 'Payée' | 'Impayée';
  readonly tva: 'Oui' | 'Non';
}

function facture(
  numero: string,
  client: string,
  pays: string,
  ht: number,
  delai: number,
  statut: Facture['statut'],
  tva: Facture['tva'],
): Facture {
  return { numero, client, pays, ht, delai, statut, tva };
}

const FACTURES: readonly Facture[] = [
  facture('F201', 'Voiles Martin', 'France', 1250, 35, 'Payée', 'Oui'),
  facture('F202', 'Nautic Sud', 'France', 6400, 72, 'Impayée', 'Oui'),
  facture('F203', 'Sailtech GmbH', 'Allemagne', 3100, 48, 'Payée', 'Oui'),
  facture('F204', 'École de voile Ré', 'France', 890, 64, 'Impayée', 'Oui'),
  facture('F205', 'Mar Azul SL', 'Espagne', 5200, 30, 'Payée', 'Non'),
  facture('F206', 'Chantier Duval', 'France', 2300, 58, 'Impayée', 'Oui'),
  facture('F207', 'Blue Sails BV', 'Pays-Bas', 1800, 81, 'Impayée', 'Non'),
  facture('F208', 'Club nautique Oléron', 'France', 740, 22, 'Payée', 'Oui'),
  facture('F209', 'Nautic Sud', 'France', 4950, 61, 'Payée', 'Oui'),
  facture('F210', 'Sailtech GmbH', 'Allemagne', 7300, 40, 'Payée', 'Oui'),
  facture('F211', 'Voiles Martin', 'France', 1600, 90, 'Impayée', 'Oui'),
  facture('F212', 'Vela Italia Srl', 'Italie', 2750, 15, 'Impayée', 'Non'),
  facture('F213', 'Chantier Duval', 'France', 5000, 60, 'Impayée', 'Oui'),
  facture('F214', 'École de voile Ré', 'France', 430, 12, 'Payée', 'Oui'),
  facture('F215', 'Mar Azul SL', 'Espagne', 3900, 95, 'Impayée', 'Oui'),
  facture('F216', 'Club nautique Oléron', 'France', 1150, 45, 'Payée', 'Oui'),
];

function factureNumero(numero: string): Facture {
  const trouvee = FACTURES.find((candidate) => candidate.numero === numero);
  if (trouvee === undefined) {
    throw new Error(`facture ${numero} absente du fichier du B2-03`);
  }
  return trouvee;
}

function enMilliers(montant: number): string {
  const chiffres = String(montant);
  const coupure = chiffres.length - 3;
  return coupure > 0
    ? `${chiffres.slice(0, coupure)} ${chiffres.slice(coupure)}`
    : chiffres;
}

const COLONNES_DES_FACTURES = [
  { key: 'numero', label: 'Facture' },
  { key: 'client', label: 'Client' },
  { key: 'pays', label: 'Pays' },
  { key: 'ht', label: 'Montant HT (€)' },
  { key: 'delai', label: 'Délai (jours)' },
  { key: 'statut', label: 'Statut' },
  { key: 'tva', label: 'N° de TVA renseigné' },
] as const;

const LIGNES_DES_FACTURES = FACTURES.map((ligne) => ({
  numero: ligne.numero,
  client: ligne.client,
  pays: ligne.pays,
  ht: enMilliers(ligne.ht),
  delai: String(ligne.delai),
  statut: ligne.statut,
  tva: ligne.tva,
}));

const DONNEES_FICTIVES =
  'Données fictives Atelier Rivage, créées pour ce cours.';

const CONSIGNE_DES_REGLES =
  'Relance : impayée depuis plus de 60 jours. Visa : au moins 5 000 € HT, ou hors de France.';

const RENVOI_AUX_FACTURES = 'B2-03-A1-04-FACTURES';

type Colonne = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';

function recopiee(modele: string, ligne: number): string {
  return modele.replaceAll(/([A-G])2\b/g, `$1${ligne}`);
}

function auMoinsUn<T>(liste: readonly T[]): moteur.AuMoinsUn<T> {
  const [premier, ...suite] = liste;
  if (premier === undefined) {
    throw new Error('liste d’attendus vide dans le B2-03');
  }
  return [premier, ...suite];
}

function cellulesDesLignes(
  numeros: readonly string[],
  champs: readonly (readonly [Colonne, (ligne: Facture) => string])[],
): Record<string, string> {
  return Object.fromEntries(
    numeros.flatMap((numero, rang) =>
      champs.map(([colonne, lire]) => [
        `${colonne}${rang + 2}`,
        lire(factureNumero(numero)),
      ]),
    ),
  );
}

const lireNumero = (ligne: Facture): string => ligne.numero;
const lirePays = (ligne: Facture): string => ligne.pays;
const lireMontant = (ligne: Facture): string => String(ligne.ht);
const lireTva = (ligne: Facture): string => ligne.tva;

const FORMULE_DU_VISA = '=SI(OU(C2>=5000;B2<>"France");"Visa";"Non")';

const FACTURES_DE_L_EXERCICE_3 = ['F202', 'F203', 'F209', 'F213', 'F201'];

const CELLULES_DE_L_EXERCICE_3 = {
  A1: 'Facture',
  B1: 'Pays',
  C1: 'Montant HT (€)',
  D1: 'Visa',
  ...cellulesDesLignes(FACTURES_DE_L_EXERCICE_3, [
    ['A', lireNumero],
    ['B', lirePays],
    ['C', lireMontant],
  ]),
};

const PLAN_DU_VISA = {
  id: 'b2-03-a1-tableur-si-ou',
  intitule: 'Exercice 3 — La formule du visa',
  lignes: FACTURES_DE_L_EXERCICE_3.length + 1,
  colonnes: 4,
  cellules: CELLULES_DE_L_EXERCICE_3,
  verrouillees: Object.keys(CELLULES_DE_L_EXERCICE_3),
  consignes: [
    'En D2, écrivez avec SI et OU la règle du visa : « Visa » si le montant HT atteint 5 000 € ou si le pays n’est pas la France, « Non » sinon.',
    'Recopiez la formule de D2 jusqu’en D6.',
    'Dans une formule, un texte s’écrit entre guillemets.',
  ],
};

function visaDe(numero: string): string {
  const ligne = factureNumero(numero);
  return ligne.ht >= 5000 || ligne.pays !== 'France' ? 'Visa' : 'Non';
}

const ATTENDUS_DU_VISA = auMoinsUn(
  FACTURES_DE_L_EXERCICE_3.map((numero, rang) =>
    moteur.attendu(
      `D${rang + 2}`,
      recopiee(FORMULE_DU_VISA, rang + 2),
      visaDe(numero),
      rang === 0 ? 'references' : { memeQue: 'D2' },
      [],
      'critere-sans-guillemets',
    ),
  ),
);

const FORMULE_NON_OU = '=SI(NON(OU(B2="France";C2="Oui"));"Anomalie";"OK")';
const FORMULE_ET = '=SI(ET(B2<>"France";C2="Non");"Anomalie";"OK")';

const FACTURES_DE_L_EXERCICE_5 = ['F203', 'F205', 'F206', 'F212', 'F215'];

const CELLULES_DE_L_EXERCICE_5 = {
  A1: 'Facture',
  B1: 'Pays',
  C1: 'N° de TVA renseigné',
  D1: 'Contrôle avec NON et OU',
  E1: 'Contrôle avec ET',
  ...cellulesDesLignes(FACTURES_DE_L_EXERCICE_5, [
    ['A', lireNumero],
    ['B', lirePays],
    ['C', lireTva],
  ]),
};

const PLAN_DE_LA_TVA = {
  id: 'b2-03-a2-tableur-non-ou',
  intitule: 'Exercice 5 — Deux contrôles de la TVA',
  lignes: FACTURES_DE_L_EXERCICE_5.length + 1,
  colonnes: 5,
  cellules: CELLULES_DE_L_EXERCICE_5,
  verrouillees: Object.keys(CELLULES_DE_L_EXERCICE_5),
  consignes: [
    'En D2, avec SI, NON et OU : « Anomalie » s’il est faux que le client soit en France ou que son numéro de TVA soit renseigné, « OK » sinon.',
    'En E2, écrivez le même contrôle avec SI et ET, sans NON.',
    'Recopiez D2 et E2 jusqu’à la ligne 6 : les deux colonnes doivent afficher la même chose.',
  ],
};

function controleTvaDe(numero: string): string {
  const ligne = factureNumero(numero);
  return ligne.pays !== 'France' && ligne.tva === 'Non' ? 'Anomalie' : 'OK';
}

const ATTENDUS_DE_LA_TVA = auMoinsUn(
  (
    [
      ['D', FORMULE_NON_OU],
      ['E', FORMULE_ET],
    ] as const
  ).flatMap(([colonne, formule]) =>
    FACTURES_DE_L_EXERCICE_5.map((numero, rang) =>
      moteur.attendu(
        `${colonne}${rang + 2}`,
        recopiee(formule, rang + 2),
        controleTvaDe(numero),
        rang === 0 ? 'references' : { memeQue: `${colonne}2` },
        [],
        'critere-sans-guillemets',
      ),
    ),
  ),
);

const LIGNES_DE_LA_TABLE = ['F205', 'F203', 'F202', 'F201'];

function verite(valeur: boolean): number {
  return valeur ? 1 : 0;
}

const HORS_DE_FRANCE = LIGNES_DE_LA_TABLE.map(
  (numero) => factureNumero(numero).pays !== 'France',
);
const GROS_MONTANT = LIGNES_DE_LA_TABLE.map(
  (numero) => factureNumero(numero).ht >= 5000,
);

const RANG_DU_OU_EXCLUSIF = 0;
const RANG_DE_LA_RECIPROQUE = 2;

const [PREMIERE_CASE, ...AUTRES_CASES] = LIGNES_DE_LA_TABLE.flatMap(
  (_, rang) => {
    const p = HORS_DE_FRANCE[rang];
    const q = GROS_MONTANT[rang];
    const ou = verite(p || q);
    const implication = verite(!p || q);
    return [
      { rang, cle: 'nonP', valeur: verite(!p), pieges: [] },
      { rang, cle: 'pEtQ', valeur: verite(p && q), pieges: [] },
      {
        rang,
        cle: 'pOuQ',
        valeur: ou,
        pieges:
          rang === RANG_DU_OU_EXCLUSIF
            ? [{ valeur: 1 - ou, confusion: 'ou-lu-exclusif' as const }]
            : [],
      },
      {
        rang,
        cle: 'pImpQ',
        valeur: implication,
        pieges:
          rang === RANG_DE_LA_RECIPROQUE
            ? [
                {
                  valeur: 1 - implication,
                  confusion: 'implication-lue-comme-equivalence' as const,
                },
              ]
            : [],
      },
    ];
  },
);

function colonneDeVerite(
  cle: string,
  intitule: string,
  valeurs?: readonly boolean[],
) {
  return {
    cle,
    intitule,
    role: valeurs === undefined ? ('saisie' as const) : ('donnee' as const),
    format: 'booleen' as const,
    ...(valeurs === undefined ? {} : { valeurs: valeurs.map(verite) }),
    decimales: 0,
    totalise: false,
  };
}

const ACTE_1: moteur.Acte = [
  {
    screenId: 'B2-03-A1-01-DIAGNOSTIC',
    titre: 'Diagnostic : la remise à 1 000 €',
    diffusion: 'seance',
    brique: 'fp-recall',
    dureeMinutes: 4,
    concepts: ['proposition'],
    notes: moteur.puces(
      'Avant de lancer : vérifier au pupitre que tous les postes ont rejoint la séance.',
      'Annoncer « seule la participation compte ». Chacun répond sans calculatrice.',
      'Piège : lire >= comme > et refuser la remise à 1 000 € pile.',
      'Papier : la question est en tête du livret ; vote à main levée.',
    ),
    proprietes: {
      modalite: 'solo',
      questions: [
        moteur.vote(
          'b2-03-a1-diagnostic',
          'proposition',
          true,
          'La cellule B2 contient 1000. Qu’affiche la formule =SI(B2>=1000;"Remise";"Plein tarif") ?',
          'Remise : 1 000 est bien supérieur ou égal à 1 000',
          [
            [
              'Plein tarif : 1 000 n’est pas supérieur à 1 000',
              'borne-stricte-large',
            ],
          ],
        ),
      ],
      delaiMs: 0,
    },
  },
  moteur.ecranV2(
    {
      screenId: 'B2-03-A1-02-ACCROCHE',
      titre: 'Écrire et contrôler une règle',
      diffusion: 'catalogue',
      dureeMinutes: 1,
      concepts: ['proposition'],
      notes: moteur.puces(
        'Rappeler en une phrase B2-02 : Atelier Rivage a répondu à sa banque ; l’expert-comptable prépare maintenant la clôture.',
        'Annoncer le plan : trois notions, chacune en trois temps (réfléchir, comprendre, s’exercer), puis une mini-situation CCF.',
        'Annoncer les deux pauses de 15 minutes, après l’acte 1 et après l’acte 3.',
      ),
    },
    'hero',
    {
      title: 'Écrire et contrôler une règle',
      subtitle:
        'Atelier Rivage, voilerie de La Rochelle. Avant la clôture, l’expert-comptable fait contrôler les factures clients avec trois règles : relancer, vérifier la TVA, faire viser.',
      bullets: [
        'BTS Comptabilité et gestion · 2e année · troisième cours de mathématiques',
        'Trois notions : combiner des conditions, nier une règle, dire « tous » ou « au moins un »',
        'Une mini-situation CCF et sa question tableur',
      ],
    },
  ),
  {
    screenId: 'B2-03-A1-03-MISSION',
    titre: 'Votre mission : le contrôle des factures clients',
    diffusion: 'seance',
    brique: 'fp-pro',
    dureeMinutes: 5,
    concepts: ['proposition', 'connecteur'],
    notes: moteur.puces(
      'Lecture à voix haute du courriel (1 min), puis 3 min d’écriture individuelle et 1 min de mise en commun au pupitre.',
      'Question 1 : faire dire que la relance et la TVA demandent deux conditions ensemble, le visa une seule des deux.',
      'Question 2 : faire trancher par le mot « dépasse » ; écrire au tableau « dépasse 60 : > 60 », repris en trace écrite.',
      'Question 3 : faire émerger qu’une seule facture suffit à contredire « toutes » ; c’est l’acte 3.',
      'Papier : trois lignes d’écriture dans le livret.',
    ),
    proprietes: {
      metier:
        'Assistant·e comptable — Atelier Rivage (voilerie artisanale, 14 salariés, La Rochelle)',
      situation:
        'Mardi, 9 h. Marc Lefèvre, l’expert-comptable d’Atelier Rivage, prépare la révision des comptes clients. Il écrit : « Avant la clôture, contrôlez les seize factures du trimestre avec trois règles. Relance : une facture impayée dont le délai dépasse 60 jours, le maximum prévu par vos conditions générales de vente ; chaque relance réclame l’indemnité forfaitaire de 40 € due pour tout retard. TVA : une facture à un client professionnel d’un autre pays de l’Union européenne porte son numéro de TVA intracommunautaire. Visa : Hélène vise toute facture d’au moins 5 000 € HT ou adressée hors de France. » Hélène Garnier, la dirigeante, ajoute : « F213, de Chantier Duval, est impayée depuis exactement 60 jours. Et toutes nos factures hors de France portent un numéro de TVA. »',
      geste:
        'Sans rien calculer, répondez aux trois questions à partir du courriel.',
      consequence:
        'Une règle mal lue relance un bon client, oublie une indemnité due ou laisse passer une facture sans visa : l’expert-comptable le relèvera à la clôture.',
      questionsLibres: [
        {
          id: 'b2-03-a1-mission:regles',
          question:
            'Chaque règle combine deux conditions. Pour chacune, les deux conditions doivent-elles être vraies ensemble, ou une seule suffit-elle ?',
          placeholder: 'Relance : … TVA : … Visa : …',
        },
        {
          id: 'b2-03-a1-mission:f213',
          question:
            'Faut-il relancer F213 aujourd’hui ? Quel mot de la règle permet de trancher ?',
          placeholder: 'Oui / Non, parce que le mot « … »',
        },
        {
          id: 'b2-03-a1-mission:preuve',
          question:
            'Hélène affirme que toutes les factures hors de France portent un numéro de TVA. Que faudrait-il trouver dans le fichier pour prouver qu’elle se trompe ?',
          placeholder: 'Il suffirait de trouver…',
        },
      ],
    },
  },
  moteur.ecranV2(
    {
      screenId: 'B2-03-A1-04-FACTURES',
      titre: 'Les seize factures du trimestre',
      diffusion: 'catalogue',
      dureeMinutes: 2,
      concepts: ['proposition'],
      notes: moteur.puces(
        '1 min de lecture silencieuse ; ne rien calculer.',
        'Faire repérer F213 (impayée, 60 jours pile) et F209 (payée, 61 jours) : elles serviront à tester les bornes.',
      ),
    },
    'table',
    {
      title: 'Les seize factures du trimestre',
      subtitle:
        'Factures d’Atelier Rivage aux clients professionnels, situation au jour du contrôle.',
      columns: [...COLONNES_DES_FACTURES],
      rows: LIGNES_DES_FACTURES,
      note: `Délai : jours depuis l’émission, jusqu’au paiement ou au jour du contrôle. Clients étrangers : entreprises de l’Union européenne. ${DONNEES_FICTIVES}`,
    },
  ),
  {
    screenId: 'B2-03-A1-05-VOTE-OU',
    titre: 'Vote : « ou » et « plus de »',
    diffusion: 'seance',
    brique: 'fp-vote',
    dureeMinutes: 5,
    concepts: ['connecteur', 'proposition'],
    notes: moteur.puces(
      'Temps « réfléchir » de la notion 1 : votes non notés.',
      'Vote individuel ; entre 30 et 70 % de bonnes réponses, débat en binôme puis revote ; sinon, révéler directement.',
      'Papier : vote à main levée, puis revote après discussion en binôme.',
    ),
    proprietes: {
      modalite: 'solo',
      questions: [
        moteur.vote(
          'b2-03-a1-ou-inclusif',
          'connecteur',
          false,
          'Règle d’une boutique : « remise si le client est fidèle ou si la commande atteint 1 000 € ». Un client fidèle commande pour 1 500 €. A-t-il la remise ?',
          'Oui : il remplit au moins une des deux conditions',
          [
            [
              'Non : il remplit les deux conditions, il faut en choisir une',
              'ou-lu-exclusif',
            ],
          ],
        ),
        moteur.vote(
          'b2-03-a1-plus-de',
          'proposition',
          false,
          'Règle de paie : « prime pour plus de trois ans d’ancienneté ». Léo a exactement trois ans d’ancienneté. Touche-t-il la prime ?',
          'Non : « plus de trois ans » exclut trois ans tout juste',
          [['Oui : trois ans suffisent', 'borne-stricte-large']],
        ),
      ],
      corrige: {
        type: 'revelation',
        titre: 'Lire « ou » et « plus de »',
        lignes: [
          '« Ou » est inclusif : la remise tient dès qu’une condition est vraie, et aussi quand les deux le sont.',
          '« Plus de trois ans » se traduit par > 3 : la valeur 3 est exclue. « Au moins trois ans » se traduit par ≥ 3.',
          'La trace écrite donne la table de ces connecteurs.',
        ],
      },
    },
  },
  moteur.ecranV2(
    {
      screenId: 'B2-03-A1-06-COURS-CONNECTEURS',
      titre: 'Cours : propositions et connecteurs',
      diffusion: 'catalogue',
      dureeMinutes: 3,
      concepts: ['proposition', 'connecteur', 'tableur'],
      notes: moteur.puces(
        '3 min ; la trace écrite est imprimée dans le livret : on lit et on commente, on ne recopie pas.',
        'Avant l’exemple, demander : « Dans quel seul cas le client n’a-t-il pas la remise ? » Laisser venir « ni fidèle, ni 1 000 € ».',
        'Faire lire la ligne V, V de « ou » : c’est la réponse au vote précédent.',
        'Lien au dossier : « La règle du visa est-elle un “et” ou un “ou” ? » Un « ou ».',
      ),
    },
    'lesson',
    {
      title: 'Propositions et connecteurs : non, et, ou',
      subtitle: 'Trace écrite · notion 1 · page 1 sur 2',
      blocks: [
        {
          kind: 'definition',
          title: 'Une phrase vraie ou fausse',
          text: 'Une proposition est une phrase qui est soit vraie (V), soit fausse (F), jamais les deux : « la facture est impayée », « le délai dépasse 60 jours ». Les connecteurs fabriquent une proposition à partir d’autres. « Non P » est vraie quand P est fausse. « P et Q » est vraie seulement quand P et Q sont vraies toutes les deux. « P ou Q » est vraie dès qu’au moins l’une des deux l’est, y compris quand les deux le sont. Les règles de contrôle d’Atelier Rivage sont de telles propositions : on les applique facture par facture.',
          formula: '¬P (non P) · P ∧ Q (P et Q) · P ∨ Q (P ou Q)',
        },
        {
          kind: 'example',
          title: 'Pour débuter : la remise de la boutique',
          text: 'Règle : remise si le client est fidèle (P) ou si la commande atteint 1 000 € (Q). Quatre clients.',
          steps: [
            'Client fidèle, 1 500 € : P vraie et Q vraie, donc P ∨ Q vraie : remise.',
            'Client fidèle, 300 € : P vraie, Q fausse : remise.',
            'Nouveau client, 1 300 € : P fausse, Q vraie : remise.',
            'Nouveau client, 300 € : P et Q fausses : pas de remise. C’est le seul cas où « ou » est faux.',
            'Au tableur : =SI(OU(B2="Fidèle";C2>=1000);"Remise";"") ; ET et NON s’écrivent de la même façon.',
          ],
        },
        {
          kind: 'method',
          title: 'La table de vérité, et les pièges du « ou »',
          text: 'Une table de vérité donne la valeur d’un connecteur dans chaque cas. Pièges : lire « ou » comme « l’un ou l’autre, mais pas les deux » ; compter « A ou B » en additionnant les A et les B, ce qui compte deux fois les lignes qui vérifient les deux. Réflexe CCF : nommer chaque condition par une lettre, puis remplir la table.',
          steps: [
            'P ∧ Q n’est vraie que sur la ligne V, V.',
            'P ∨ Q n’est fausse que sur la ligne F, F.',
            'Nombre de « A ou B » = nombre de A + nombre de B − nombre de « A et B ».',
            'Au tableur, un texte s’écrit entre guillemets : "France", "Payée".',
          ],
        },
      ],
    },
  ),
  moteur.ecranV2(
    {
      screenId: 'B2-03-A1-07-COURS-IMPLICATION',
      titre: 'Cours : implication, réciproque et bornes',
      diffusion: 'catalogue',
      dureeMinutes: 3,
      concepts: ['connecteur', 'proposition'],
      notes: moteur.puces(
        '3 min, enchaînées sur la page 1 : 6 min pour les deux pages.',
        'Question : « Chloé a une prime avec un an d’ancienneté. La règle est-elle violée ? » Non : la règle ne parle que des plus de trois ans.',
        'Faire tester les bornes à voix haute : 60 jours pile, 5 000 € pile.',
        'Relier au vote : « plus de trois ans » exclut trois ans pile.',
      ),
    },
    'lesson',
    {
      title: 'Implication, réciproque et bornes',
      subtitle: 'Trace écrite · notion 1 · page 2 sur 2',
      blocks: [
        {
          kind: 'definition',
          title: 'Si P, alors Q',
          text: 'L’implication « si P, alors Q », notée P ⇒ Q, est fausse dans un seul cas : P vraie et Q fausse. Ce cas s’appelle un contre-exemple. Quand P est fausse, l’implication n’impose rien et reste vraie. La réciproque de P ⇒ Q est Q ⇒ P : elle peut être fausse alors que l’implication est vraie. Quand les deux sont vraies, P et Q sont équivalentes (P ⇔ Q). Une règle de gestion est souvent une implication : « si la facture est en retard, on la relance ».',
          formula: 'P ⇒ Q est fausse seulement si P est vraie et Q fausse',
        },
        {
          kind: 'example',
          title: 'Pour débuter : la prime d’ancienneté',
          text: 'Règle de paie : « si un salarié a plus de trois ans d’ancienneté, il touche une prime ». Quatre salariés.',
          steps: [
            'Anna, cinq ans, prime : P vraie, Q vraie, la règle est respectée.',
            'Bruno, cinq ans, pas de prime : P vraie, Q fausse. C’est un contre-exemple, la règle est violée.',
            'Chloé, un an, prime décidée pour une autre raison : P fausse, la règle n’interdit rien.',
            'Réciproque « s’il touche une prime, il a plus de trois ans » : Chloé la contredit, alors que la règle est respectée.',
          ],
        },
        {
          kind: 'exam',
          title: 'Au CCF : bornes et contre-exemples',
          text: 'Les mots de la règle fixent la borne : « plus de », « au-delà de », « dépasse » se traduisent par > ; « au moins », « à partir de », « atteint » par ≥ ; « moins de » par <, « au plus » par ≤. Piège : lire une implication comme une équivalence, et croire que Q vraie entraîne P vraie.',
          steps: [
            'Écrire chaque condition avec son symbole avant d’écrire la formule.',
            'Tester la valeur de la borne : trois ans pile, 60 jours pile, 5 000 € pile.',
            'Pour prouver qu’une implication est fausse, un seul contre-exemple suffit.',
          ],
        },
      ],
    },
  ),
  moteur.corrigeEtapeParEtape(
    {
      screenId: 'B2-03-A1-08-EXEMPLE-TABLE',
      titre: 'Exemple guidé : la règle de relance',
      diffusion: 'seance',
      brique: 'fp-worked',
      dureeMinutes: 4,
      concepts: ['connecteur', 'tableur'],
      notes: moteur.puces(
        'Chacun répond sous chaque étape, puis la correction se dévoile étape par étape sur ce même écran.',
        'Papier : réponses sous chaque étape du livret.',
      ),
      proprietes: {
        modalite: 'solo',
        exemple: {
          id: 'b2-03-a1-exemple-table',
          enonce:
            'Règle de relance : une facture est relancée si elle est impayée (P) et si son délai dépasse 60 jours (Q). On l’applique à quatre factures du fichier : F202, F206, F209 et F201.',
          etapes: [
            {
              id: 'propositions',
              intitule: 'Nommer les propositions',
              raisonnement:
                'P : « la facture est impayée ». Q : « le délai dépasse 60 jours », soit délai > 60. La relance est P ∧ Q.',
              invite:
                'Quelles sont les deux propositions de la règle, et quel connecteur les relie ?',
            },
            {
              id: 'valeurs',
              intitule: 'Les valeurs de vérité',
              raisonnement:
                'F202 : impayée, 72 jours, P et Q vraies. F206 : impayée, 58 jours, P vraie, Q fausse. F209 : payée, 61 jours, P fausse, Q vraie. F201 : payée, 35 jours, P et Q fausses.',
              invite:
                'Pour chaque facture, P et Q sont-elles vraies ou fausses ?',
            },
            {
              id: 'relance',
              intitule: 'Appliquer « et »',
              raisonnement:
                'Seule F202 a P et Q vraies : elle seule est relancée. F209 dépasse 60 jours, mais elle est payée.',
              invite: 'Quelles factures relancer ?',
            },
            {
              id: 'piege',
              intitule: 'Le piège du « ou »',
              raisonnement:
                'Avec P ∨ Q, on relancerait F202, F206 et F209 : F209 est pourtant payée, et F206 n’est pas encore en retard. « Et » exige les deux conditions.',
              invite: 'Que donnerait la règle écrite avec « ou » ?',
            },
            {
              id: 'tableur',
              intitule: 'La formule',
              raisonnement:
                'Statut en B2, délai en C2 : =SI(ET(B2="Impayée";C2>60);"Relancer";"Non"). Les textes sont entre guillemets ; > et non ≥, car « dépasse » exclut 60.',
              invite:
                'Écrivez la formule de la relance, avec le statut en B2 et le délai en C2.',
            },
          ],
        },
        etayage: 0,
      },
    },
    {
      minutes: 2,
      notes: [
        'S’arrêter sur F209 (étape 3) et sur le choix de > (étape 5).',
        'Transition : « À vous, sur la règle du visa : exercice 1. »',
      ],
    },
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B2-03-A1-09-TABLE-VERITE',
      titre: 'Exercice 1 — La table de vérité du visa',
      diffusion: 'seance',
      brique: 'fp-table-build',
      dureeMinutes: 6,
      concepts: ['connecteur'],
      notes: moteur.puces(
        'Temps : réflexion 1 min · travail 5 min',
        'Réflexion : chacun écrit P et Q pour la première facture avant de remplir.',
        'Pièges : « ou » lu exclusif sur la ligne V, V ; implication lue comme une équivalence sur la ligne F, V.',
        'Papier : tableau du livret, V ou F à entourer dans chaque case.',
      ),
      proprietes: {
        modalite: 'solo',
        plan: {
          id: 'b2-03-a1-table-verite',
          intitule: 'La table de vérité du visa',
          consignes: [
            'P : « le client est hors de France ». Q : « le montant HT atteint 5 000 € ».',
            'Pour chaque facture, choisissez V (vrai) ou F (faux) dans chaque case.',
            'Dernière colonne : la phrase « si le client est hors de France, alors le montant atteint 5 000 € ».',
          ],
          echeances: LIGNES_DE_LA_TABLE.length,
          intituleDesLignes: 'Facture',
          libellesLignes: [...LIGNES_DE_LA_TABLE],
          parametres: {},
          colonnes: [
            colonneDeVerite('p', 'P', HORS_DE_FRANCE),
            colonneDeVerite('q', 'Q', GROS_MONTANT),
            colonneDeVerite('nonP', 'non P (¬P)'),
            colonneDeVerite('pEtQ', 'P et Q (P ∧ Q)'),
            colonneDeVerite('pOuQ', 'P ou Q (P ∨ Q)'),
            colonneDeVerite('pImpQ', 'si P alors Q (P ⇒ Q)'),
          ],
          synthese: [],
        },
        questions: [
          moteur.questionDeTableau('b2-03-a1-table-verite', 'connecteur', [
            PREMIERE_CASE,
            ...AUTRES_CASES,
          ]),
        ],
      },
    },
    {
      minutes: 2,
      notes: [
        'Projeter la table juste, colonne par colonne, en commençant par la moins réussie.',
        'Transition : « Appliquons ces connecteurs aux seize factures : exercice 2. »',
      ],
    },
    [
      [
        'b2-03-a1-table-verite',
        'Non P inverse P. P et Q n’est vraie que pour F205. P ou Q n’est fausse que pour F201 : F205 vérifie les deux conditions, et « ou » l’accepte. Si P alors Q n’est fausse que pour F203, hors de France avec 3 100 € : c’est le contre-exemple. F202 ne la contredit pas, puisque P y est fausse.',
      ],
    ],
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B2-03-A1-10-ATELIER-CONNECTEURS',
      titre: 'Exercice 2 — Appliquer les règles aux factures',
      diffusion: 'seance',
      brique: 'questionnaire',
      dureeMinutes: 6,
      concepts: ['connecteur', 'proposition'],
      notes: moteur.puces(
        'Temps : réflexion 1 min · travail 5 min',
        'Réflexion : écrire chaque règle avec ses lettres et ses symboles avant de compter.',
        'Pièges : « ou » exclusif ; additionner les deux conditions ; > au lieu de ≥ ; réciproque prise pour la règle.',
        'Papier : exercice 2 du livret.',
      ),
      proprietes: {
        renvoi: RENVOI_AUX_FACTURES,
        intitule: 'Exercice 2 — Appliquer les règles aux factures',
        consigne: CONSIGNE_DES_REGLES,
        regime: 'focus',
        ordre: 'fixe',
        questions: [
          moteur.numerique(
            'b2-03-a1-visa',
            'connecteur',
            'Combien des seize factures faut-il viser ?',
            'factures',
            8,
            moteur.TOLERANCE_NULLE,
            '8 factures',
            [
              [6, 'ou-lu-exclusif'],
              [10, 'ou-compte-deux-fois'],
              [7, 'borne-stricte-large'],
            ],
          ),
          moteur.vote(
            'b2-03-a1-implication',
            'connecteur',
            true,
            'Samir conclut : « une facture visée fait toujours au moins 5 000 € ». Que lui répondre ?',
            'Il se trompe : F203, hors de France, est visée avec 3 100 € HT',
            [
              [
                'Il a raison : c’est la règle du visa',
                'implication-lue-comme-equivalence',
              ],
            ],
          ),
          moteur.vote(
            'b2-03-a1-f213',
            'proposition',
            true,
            'F213 est impayée depuis 60 jours pile. Faut-il la relancer ?',
            'Non : son délai atteint 60 jours sans les dépasser',
            [['Oui : 60 jours, c’est le délai maximum', 'borne-stricte-large']],
          ),
          moteur.vote(
            'b2-03-a1-f205',
            'connecteur',
            true,
            'F205 part en Espagne pour 5 200 € HT. Faut-il la viser ?',
            'Oui : deux conditions vraies, « ou » l’accepte',
            [['Non : deux conditions au lieu d’une', 'ou-lu-exclusif']],
          ),
        ],
      },
    },
    {
      minutes: 2,
      notes: [
        'Corriger question par question, en commençant par la moins réussie (score sous chaque correction).',
        'Transition : « Écrivons la règle du visa au tableur : exercice 3. »',
      ],
    },
    [
      [
        'b2-03-a1-visa',
        'Quatre factures atteignent 5 000 € (F202, F205, F210, F213) et six partent hors de France ; F205 et F210 sont dans les deux listes. 4 + 6 − 2 = 8 factures. Additionner donne 10 ; exclure les deux donne 6 ; oublier F213 (> au lieu de ≥) donne 7.',
      ],
      [
        'b2-03-a1-implication',
        'La règle dit « montant d’au moins 5 000 € ou hors de France ⇒ visa ». Samir prend la réciproque : F203, visée avec 3 100 €, la contredit.',
      ],
      [
        'b2-03-a1-f213',
        '« Dépasse 60 jours » se traduit par délai > 60 : F213, à 60 jours pile, n’est pas encore relancée.',
      ],
      [
        'b2-03-a1-f205',
        'Le « ou » est inclusif : F205 vérifie les deux conditions, elle est visée.',
      ],
    ],
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B2-03-A1-11-TABLEUR-SI-OU',
      titre: 'Exercice 3 — La formule du visa',
      diffusion: 'seance',
      brique: 'fp-sheet',
      dureeMinutes: 6,
      concepts: ['tableur', 'connecteur'],
      notes: moteur.puces(
        'Temps : réflexion 1 min · travail 5 min',
        'Réflexion : écrire sur papier les deux conditions avec leurs symboles.',
        'Erreurs à chercher : "France" sans guillemets ; > au lieu de >= (F213) ; ET au lieu de OU.',
        'Papier : formule écrite sur la copie, puis appliquée aux cinq lignes.',
      ),
      proprietes: {
        modalite: 'solo',
        plan: PLAN_DU_VISA,
        questions: [
          {
            type: 'feuille',
            id: PLAN_DU_VISA.id,
            concept: 'tableur',
            noteCompte: true,
            corrige: {
              type: 'feuille',
              plan: PLAN_DU_VISA,
              attendus: ATTENDUS_DU_VISA,
              seuilReussite: 0.8,
            },
          },
        ],
      },
    },
    {
      minutes: 2,
      notes: [
        'Projeter la feuille d’un poste volontaire et relire la formule de D2.',
        'Transition : jalon 1, puis pause de 15 minutes.',
      ],
    },
    [
      [
        'D2',
        `${FORMULE_DU_VISA} : OU pour « ou », >= pour « au moins », "France" entre guillemets.`,
      ],
      [
        'D3 à D6',
        'F203 est visée (hors de France), F209 ne l’est pas (4 950 € en France), F213 l’est (5 000 € pile), F201 ne l’est pas.',
      ],
    ],
  ),
  {
    screenId: 'B2-03-A1-12-JALON',
    titre: 'Jalon 1 : lire une règle',
    diffusion: 'seance',
    brique: 'fp-pulse',
    dureeMinutes: 1,
    concepts: ['connecteur'],
    notes: moteur.puces(
      '30 s de vote anonyme.',
      'Si plus de 30 % « Perdu » : reprendre la trace écrite A1-06 après la pause.',
      'Pause de 15 minutes, hors durée programmée.',
    ),
    proprietes: {
      sondage: {
        id: 'b2-03-a1-jalon',
        invite:
          'Je sais traduire une règle avec non, et, ou, si… alors, et placer la borne.',
      },
    },
  },
];

const ACTE_2: moteur.Acte = [
  moteur.ecranV2(
    {
      screenId: 'B2-03-A2-01-CONTRAIRE',
      titre: 'Réfléchir : le contraire d’une règle',
      diffusion: 'seance',
      dureeMinutes: 5,
      concepts: ['negation'],
      notes: moteur.puces(
        'Temps « réfléchir » de la notion 2 : 3 min d’écriture individuelle, puis lire trois réponses au pupitre.',
        'Ne rien trancher : la trace écrite suivante répond.',
        'Relance : « F209 est payée à 61 jours. Est-elle dans votre liste ? »',
        'Papier : cadre de réponse du livret.',
      ),
    },
    'reflection',
    {
      promptData: {
        id: 'b2-03-a2-contraire',
        type: 'reflection',
        question:
          'Marc veut la liste des factures qu’on ne relance pas. La règle de relance est « impayée et délai de plus de 60 jours ». Écrivez la règle contraire sans employer le mot « non ».',
        placeholder: 'Une facture n’est pas relancée si…',
        competency: 'Raisonner · nier une proposition composée',
      },
    },
    {
      correction: {
        expected:
          'Une facture n’est pas relancée si elle est payée, ou si son délai est d’au plus 60 jours : le contraire d’un « et » est un « ou », et le contraire de « plus de 60 » est « au plus 60 ».',
        nextAction:
          'Gardez votre réponse : la trace écrite donne la règle pour nier.',
      },
      renvoi: RENVOI_AUX_FACTURES,
    },
  ),
  moteur.ecranV2(
    {
      screenId: 'B2-03-A2-02-COURS-NEGATION',
      titre: 'Cours : la négation d’une condition',
      diffusion: 'catalogue',
      dureeMinutes: 3,
      concepts: ['negation', 'tableur'],
      notes: moteur.puces(
        '3 min ; garder la réflexion précédente sous les yeux.',
        'Question : « Léo a trois ans pile. Est-il dans la règle ou dans son contraire ? » Dans le contraire.',
        'Faire dire pourquoi « < 3 » oublie Léo : il ne serait nulle part.',
      ),
    },
    'lesson',
    {
      title: 'La négation : nier une condition',
      subtitle: 'Trace écrite · notion 2 · page 1 sur 2',
      blocks: [
        {
          kind: 'definition',
          title: 'Le contraire d’une proposition',
          text: 'La négation de P, notée ¬P (non P), est vraie quand P est fausse et fausse quand P est vraie. Nier une comparaison, c’est garder tous les cas qu’elle exclut, borne comprise : le contraire de « x > 60 » est « x ≤ 60 », pas « x < 60 ». Nier deux fois ramène au départ : ¬(¬P) a la valeur de P. Pour Marc, nier la règle de relance donne la liste des factures qui n’appellent aucune action.',
          formula: '¬(x > a) : x ≤ a · ¬(x ≥ a) : x < a · ¬(x = a) : x ≠ a',
        },
        {
          kind: 'example',
          title: 'Pour débuter : la prime d’ancienneté',
          text: 'Règle : prime pour plus de trois ans d’ancienneté, soit ancienneté > 3.',
          steps: [
            'Contraire : ancienneté ≤ 3, c’est-à-dire « au plus trois ans ».',
            'Léo, trois ans pile : il est dans le contraire, sans prime.',
            'L’erreur « ancienneté < 3 » oublierait Léo : il ne serait ni dans la règle, ni dans son contraire.',
            'Contraire de « le client est en France » : « le client n’est pas en France », au tableur B2<>"France".',
          ],
        },
        {
          kind: 'method',
          title: 'Nier sans perdre la borne',
          text: 'Piège : retourner le signe sans changer sa largeur. Chaque valeur tombe d’un seul côté : dans la règle ou dans son contraire. Réflexe : tester la borne dans les deux.',
          steps: [
            '> devient ≤ ; ≥ devient < ; = devient ≠ (<> au tableur).',
            'Au tableur : NON(C2>60) donne le même résultat que C2<=60.',
            'Contrôle : les lignes de la règle et celles de son contraire font toutes les lignes, sans doublon.',
          ],
        },
      ],
    },
  ),
  moteur.ecranV2(
    {
      screenId: 'B2-03-A2-03-COURS-MORGAN',
      titre: 'Cours : les lois de Morgan',
      diffusion: 'catalogue',
      dureeMinutes: 3,
      concepts: ['negation', 'connecteur'],
      notes: moteur.puces(
        '3 min, enchaînées sur la page 1 : 6 min pour les deux pages.',
        'Faire vérifier sur le client à 1 300 € que la négation sans Morgan se trompe.',
        'Relier à la réflexion A2-01 : faire relire les réponses qui ont gardé « et ».',
      ),
    },
    'lesson',
    {
      title: 'Les lois de Morgan : nier « et », nier « ou »',
      subtitle: 'Trace écrite · notion 2 · page 2 sur 2',
      blocks: [
        {
          kind: 'definition',
          title: 'Nier une règle à deux conditions',
          text: 'Pour nier une proposition composée, on nie chaque condition et l’on échange les connecteurs : le contraire de « P et Q » est « non P ou non Q » ; le contraire de « P ou Q » est « non P et non Q ». Ce sont les lois de Morgan. Nier le « et » de la règle de relance fait apparaître un « ou » : une seule condition manquante suffit pour ne pas relancer.',
          formula: '¬(P ∧ Q) ⇔ ¬P ∨ ¬Q · ¬(P ∨ Q) ⇔ ¬P ∧ ¬Q',
        },
        {
          kind: 'example',
          title: 'Pour débuter : la remise de la boutique',
          text: 'Règle : remise si le client est fidèle ou si la commande atteint 1 000 €.',
          steps: [
            'Contraire : le client n’est pas fidèle et sa commande reste sous 1 000 €.',
            'Nouveau client, 300 € : les deux conditions manquent, pas de remise.',
            'Nouveau client, 1 300 € : « non fidèle ou moins de 1 000 € » serait vrai, alors qu’il a la remise. C’est l’erreur sans Morgan.',
            'Au tableur : NON(OU(B2="Fidèle";C2>=1000)) donne le même résultat que ET(B2<>"Fidèle";C2<1000).',
          ],
        },
        {
          kind: 'exam',
          title: 'Au CCF : nier une règle',
          text: 'Pièges : nier chaque condition sans échanger le connecteur ; oublier la borne. Rédiger la négation en phrase, puis la vérifier sur une ligne où une seule condition est vraie.',
          steps: [
            'Écrire la règle avec ses lettres et ses symboles.',
            'Nier chaque condition, borne comprise.',
            'Échanger « et » et « ou ».',
            'Contrôle : règle et contraire se partagent toutes les lignes du fichier.',
          ],
        },
      ],
    },
  ),
  moteur.corrigeEtapeParEtape(
    {
      screenId: 'B2-03-A2-04-EXEMPLE-MORGAN',
      titre: 'Exemple guidé : les factures conformes à la TVA',
      diffusion: 'seance',
      brique: 'fp-worked',
      dureeMinutes: 4,
      concepts: ['negation', 'connecteur'],
      notes: moteur.puces(
        'Chacun répond sous chaque étape, puis la correction se dévoile étape par étape sur ce même écran.',
        'Papier : réponses sous chaque étape du livret.',
      ),
      proprietes: {
        modalite: 'solo',
        exemple: {
          id: 'b2-03-a2-exemple-morgan',
          enonce:
            'Règle TVA : une facture est en anomalie si le client est hors de France (A) et si son numéro de TVA n’est pas renseigné (N). Marc veut la règle des factures conformes, puis leur nombre.',
          etapes: [
            {
              id: 'regle',
              intitule: 'Écrire la règle',
              raisonnement:
                'Anomalie : A ∧ N, avec A « le pays n’est pas la France » et N « le numéro de TVA n’est pas renseigné ».',
              invite: 'Quelles propositions, et quel connecteur ?',
            },
            {
              id: 'morgan',
              intitule: 'Nier avec Morgan',
              raisonnement:
                'Conforme : ¬(A ∧ N), soit ¬A ∨ ¬N : le client est en France, ou son numéro est renseigné.',
              invite: 'Quelle est la règle des factures conformes ?',
            },
            {
              id: 'anomalies',
              intitule: 'Repérer les anomalies',
              raisonnement:
                'Hors de France et sans numéro : F205, F207 et F212, trois factures.',
              invite: 'Quelles factures sont en anomalie ?',
            },
            {
              id: 'conformes',
              intitule: 'Compter les conformes',
              raisonnement:
                'Seize factures moins trois anomalies : treize conformes. Contrôle par la règle : les dix factures françaises, plus F203, F210 et F215, étrangères avec un numéro.',
              invite: 'Combien de factures sont conformes ?',
            },
            {
              id: 'piege',
              intitule: 'Le piège sans Morgan',
              raisonnement:
                '« En France et numéro renseigné » ne garde que les dix factures françaises : les trois factures étrangères en règle disparaîtraient.',
              invite:
                'Que donnerait la négation écrite sans échanger le connecteur ?',
            },
          ],
        },
        etayage: 0,
      },
    },
    {
      minutes: 2,
      notes: [
        'S’arrêter sur l’échange du connecteur (étape 2) et sur le contrôle par le total (étape 4).',
        'Transition : « À vous, sur la relance et le visa : exercice 4. »',
      ],
    },
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B2-03-A2-05-ATELIER-MORGAN',
      titre: 'Exercice 4 — Nier la relance et le visa',
      diffusion: 'seance',
      brique: 'questionnaire',
      dureeMinutes: 9,
      concepts: ['negation', 'tableur'],
      notes: moteur.puces(
        'Temps : réflexion 2 min · travail 7 min',
        'Réflexion : écrire chaque règle avec ses lettres, puis sa négation, sans rien compter.',
        'Pièges : nier sans échanger le connecteur ; > nié en < au lieu de ≤.',
        'Papier : exercice 4 du livret.',
      ),
      proprietes: {
        renvoi: RENVOI_AUX_FACTURES,
        intitule: 'Exercice 4 — Nier la relance et le visa',
        consigne: CONSIGNE_DES_REGLES,
        regime: 'focus',
        ordre: 'fixe',
        questions: [
          moteur.vote(
            'b2-03-a2-non-relance',
            'negation',
            true,
            'Quelles factures ne relance-t-on pas ?',
            'Payée, ou délai d’au plus 60 jours',
            [['Payée, ou délai de moins de 60 jours', 'negation-comparaison']],
          ),
          moteur.vote(
            'b2-03-a2-non-visa',
            'negation',
            true,
            'Quelles factures ne vise-t-on pas ?',
            'Moins de 5 000 € HT, et client en France',
            [
              [
                'Moins de 5 000 € HT, ou client en France',
                'negation-sans-morgan',
              ],
            ],
          ),
          moteur.numerique(
            'b2-03-a2-sans-visa',
            'negation',
            'Combien de factures ne sont pas à viser ?',
            'factures',
            8,
            moteur.TOLERANCE_NULLE,
            '8 factures',
            [
              [9, 'negation-comparaison'],
              [14, 'negation-sans-morgan'],
            ],
          ),
          moteur.vote(
            'b2-03-a2-formule',
            'negation',
            true,
            'Pays en C2, TVA en G2 : quelle formule équivaut à =NON(ET(C2<>"France";G2="Non")) ?',
            '=OU(C2="France";G2="Oui")',
            [['=ET(C2="France";G2="Oui")', 'negation-sans-morgan']],
          ),
        ],
      },
    },
    {
      minutes: 2,
      notes: [
        'Corriger question par question, en commençant par la moins réussie.',
        'Transition : « Vérifions Morgan au tableur : exercice 5. »',
      ],
    },
    [
      [
        'b2-03-a2-non-relance',
        'Relance : impayée ∧ délai > 60. Contraire : payée ∨ délai ≤ 60. Le « et » devient « ou », et > devient ≤.',
      ],
      [
        'b2-03-a2-non-visa',
        'Visa : montant ≥ 5 000 ∨ hors de France. Contraire : montant < 5 000 ∧ en France.',
      ],
      [
        'b2-03-a2-sans-visa',
        'Seize factures moins les huit visées : 8 factures. Contrôle : les huit factures françaises sous 5 000 €. Avec ≤ 5 000, on garderait F213 à tort (9) ; avec « ou », on en compterait 14.',
      ],
      [
        'b2-03-a2-formule',
        'Morgan : NON(ET(A;B)) = OU(NON A;NON B). NON(C2<>"France") donne C2="France", NON(G2="Non") donne G2="Oui".',
      ],
    ],
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B2-03-A2-06-TABLEUR-NON-OU',
      titre: 'Exercice 5 — Deux contrôles de la TVA',
      diffusion: 'seance',
      brique: 'fp-sheet',
      dureeMinutes: 8,
      concepts: ['tableur', 'negation'],
      notes: moteur.puces(
        'Temps : réflexion 2 min · travail 6 min',
        'Réflexion : écrire la règle d’anomalie avec ses lettres, puis sa forme avec NON et OU.',
        'Erreurs à chercher : textes sans guillemets ; les deux colonnes qui ne s’accordent pas (Morgan oublié).',
        'Papier : les deux formules écrites sur la copie, puis appliquées aux cinq lignes.',
      ),
      proprietes: {
        modalite: 'solo',
        plan: PLAN_DE_LA_TVA,
        questions: [
          {
            type: 'feuille',
            id: PLAN_DE_LA_TVA.id,
            concept: 'negation',
            noteCompte: true,
            corrige: {
              type: 'feuille',
              plan: PLAN_DE_LA_TVA,
              attendus: ATTENDUS_DE_LA_TVA,
              seuilReussite: 0.8,
            },
          },
        ],
      },
    },
    {
      minutes: 2,
      notes: [
        'Projeter une feuille où les deux colonnes s’accordent, puis une où elles divergent.',
        'Transition : jalon 2.',
      ],
    },
    [
      [
        'D2',
        `${FORMULE_NON_OU} : l’anomalie est le contraire de la conformité.`,
      ],
      [
        'E2',
        `${FORMULE_ET} : même résultat par Morgan, ¬(France ∨ numéro) = hors de France ∧ sans numéro.`,
      ],
      [
        'D3 à E6',
        'F205 et F212 sont en anomalie ; F203, F206 et F215 sont conformes. Les deux colonnes s’accordent ligne à ligne.',
      ],
    ],
  ),
  {
    screenId: 'B2-03-A2-07-JALON',
    titre: 'Jalon 2 : nier une règle',
    diffusion: 'seance',
    brique: 'fp-pulse',
    dureeMinutes: 1,
    concepts: ['negation'],
    notes: moteur.puces(
      '30 s de vote anonyme.',
      'Si plus de 30 % « Perdu » : reprendre la trace écrite A2-03 sur Morgan.',
    ),
    proprietes: {
      sondage: {
        id: 'b2-03-a2-jalon',
        invite:
          'Je sais nier une comparaison et une règle à deux conditions avec les lois de Morgan.',
      },
    },
  },
];

const ACTE_3: moteur.Acte = [
  {
    screenId: 'B2-03-A3-01-VOTE-TOUTES',
    titre: 'Vote : « toutes » et « il existe »',
    diffusion: 'seance',
    brique: 'fp-vote',
    dureeMinutes: 5,
    concepts: ['quantificateur'],
    notes: moteur.puces(
      'Temps « réfléchir » de la notion 3 : votes non notés.',
      'Vote individuel ; entre 30 et 70 % de bonnes réponses, débat en binôme puis revote ; sinon, révéler directement.',
      'Papier : vote à main levée, puis revote après discussion en binôme.',
    ),
    proprietes: {
      modalite: 'solo',
      questions: [
        moteur.vote(
          'b2-03-a3-toutes',
          'quantificateur',
          false,
          'Hélène : « toutes nos factures hors de France ont un numéro de TVA ». Que suffit-il de trouver pour prouver qu’elle a tort ?',
          'Une seule facture hors de France sans numéro de TVA',
          [
            [
              'Que toutes les factures hors de France soient sans numéro',
              'negation-pour-tout-en-aucun',
            ],
          ],
        ),
        moteur.vote(
          'b2-03-a3-il-existe',
          'quantificateur',
          false,
          'Marc : « il existe une facture de plus de 90 jours ». Qu’affirme le contraire de sa phrase ?',
          'Toutes les factures ont au plus 90 jours',
          [
            [
              'Il existe une facture d’au plus 90 jours',
              'negation-il-existe-gardee',
            ],
          ],
        ),
      ],
      corrige: {
        type: 'revelation',
        titre: 'Pour tout, il existe',
        lignes: [
          'Pour contredire « toutes… », un seul contre-exemple suffit : « au moins une… ne… pas ».',
          'Le contraire de « il existe… » est « aucune… », c’est-à-dire « pour toutes…, non… ».',
          'La trace écrite donne ces deux règles et leur vérification au tableur.',
        ],
      },
    },
  },
  moteur.ecranV2(
    {
      screenId: 'B2-03-A3-02-COURS-PREDICATS',
      titre: 'Cours : prédicats et quantificateurs',
      diffusion: 'catalogue',
      dureeMinutes: 3,
      concepts: ['quantificateur'],
      notes: moteur.puces(
        '3 min ; la trace écrite est imprimée dans le livret.',
        'Question : « Faut-il vérifier les trois commerciaux pour dire que “tous ont vendu au moins 10 voiles” est faux ? » Non : Karim suffit.',
        'Relier au vote : « aucune » n’est pas le contraire de « toutes ».',
      ),
    },
    'lesson',
    {
      title: 'Prédicats et quantificateurs',
      subtitle: 'Trace écrite · notion 3 · page 1 sur 2',
      blocks: [
        {
          kind: 'definition',
          title: 'Une phrase qui dépend d’une ligne',
          text: 'Un prédicat est une phrase qui dépend d’un élément : P(x) : « la facture x est impayée » est vraie pour certaines factures, fausse pour d’autres. Le quantificateur universel ∀ (« pour tout ») affirme qu’un prédicat est vrai pour tous les éléments ; le quantificateur existentiel ∃ (« il existe ») affirme qu’il est vrai pour au moins un. Les affirmations d’Hélène sur « toutes nos factures » sont des phrases en ∀ : une seule ligne suffit à les contredire.',
          formula:
            '∀x, P(x) : pour tout x · ∃x, P(x) : il existe au moins un x',
        },
        {
          kind: 'example',
          title: 'Pour débuter : l’équipe de vente',
          text: 'Trois commerciaux : Léa a vendu 12 voiles, Karim 7, Sofia 15. P(x) : « x a vendu au moins 10 voiles ».',
          steps: [
            '∃x, P(x) est vraie : Léa suffit.',
            '∀x, P(x) est fausse : Karim est un contre-exemple.',
            'Contraire de ∀x, P(x) : ∃x, ¬P(x), « au moins un commercial a vendu moins de 10 voiles ». Karim le prouve.',
            'Contraire de ∃x, P(x) : ∀x, ¬P(x), « aucun commercial n’a vendu au moins 10 voiles ».',
          ],
        },
        {
          kind: 'method',
          title: 'Nier une phrase quantifiée',
          text: 'On échange ∀ et ∃, puis on nie le prédicat. Pièges : nier « toutes… » en « aucune… » ; nier « il existe… » en gardant « il existe ». Réflexe : écrire la phrase avec ∀ ou ∃ avant de la nier.',
          steps: [
            '¬(∀x, P(x)) ⇔ ∃x, ¬P(x).',
            '¬(∃x, P(x)) ⇔ ∀x, ¬P(x).',
            'Le prédicat nié suit les règles de la notion 2 : borne et Morgan.',
          ],
        },
      ],
    },
  ),
  moteur.ecranV2(
    {
      screenId: 'B2-03-A3-03-COURS-QUANTIFICATEURS',
      titre: 'Cours : quantificateurs au tableur et ordre',
      diffusion: 'catalogue',
      dureeMinutes: 3,
      concepts: ['quantificateur', 'tableur'],
      notes: moteur.puces(
        '3 min, enchaînées sur la page 1 : 6 min pour les deux pages.',
        'Faire taper NB.SI sans guillemets sur un poste volontaire : l’erreur fixe la règle.',
        'Question : « Chaque client a un commercial. Un même commercial suit-il tous les clients ? » Pas forcément.',
      ),
    },
    'lesson',
    {
      title: 'Quantificateurs au tableur, et l’ordre des quantificateurs',
      subtitle: 'Trace écrite · notion 3 · page 2 sur 2',
      blocks: [
        {
          kind: 'method',
          title: 'Vérifier ∀ et ∃ avec NB.SI',
          text: 'NB.SI(plage;critère) compte les cellules qui vérifient le critère. « Il existe » se vérifie par un NB.SI d’au moins 1 ; « pour tout » par un NB.SI du contraire égal à 0. Le critère s’écrit entre guillemets : ">=5000", "Impayée", "<>France". Sans guillemets, le tableur renvoie une erreur.',
          formula:
            '∃ : NB.SI(plage;"critère") ≥ 1 · ∀ : NB.SI(plage;"contraire") = 0',
        },
        {
          kind: 'example',
          title: 'Pour débuter : les voiles vendues',
          text: 'Ventes de Léa, Karim et Sofia en B2:B4 : 12, 7 et 15 voiles.',
          steps: [
            '=NB.SI(B2:B4;">=10") compte deux commerciaux : il en existe au moins un à 10 voiles ou plus.',
            '=NB.SI(B2:B4;"<10") compte Karim : « tous ont vendu au moins 10 voiles » est faux.',
            '=NB.SI(B2:B4;>=10), sans guillemets, renvoie une erreur.',
          ],
        },
        {
          kind: 'exam',
          title: 'Au CCF : l’ordre des quantificateurs',
          text: '« Pour chaque client, il existe un commercial qui le suit » (∀ puis ∃) n’a pas le sens de « il existe un commercial qui suit tous les clients » (∃ puis ∀) : la seconde phrase est bien plus forte. Piège : échanger l’ordre en traduisant. Réflexe : lire la phrase de gauche à droite et placer les quantificateurs dans cet ordre.',
          steps: [
            '∀ client, ∃ commercial : chaque client a le sien, pas forcément le même.',
            '∃ commercial, ∀ client : un même commercial pour tous.',
            'La seconde entraîne la première, pas l’inverse.',
          ],
        },
      ],
    },
  ),
  moteur.corrigeEtapeParEtape(
    {
      screenId: 'B2-03-A3-04-EXEMPLE-QUANTIF',
      titre: 'Exemple guidé : les commerciaux et leurs clients',
      diffusion: 'seance',
      brique: 'fp-worked',
      dureeMinutes: 4,
      concepts: ['quantificateur', 'tableur'],
      notes: moteur.puces(
        'Chacun répond sous chaque étape, puis la correction se dévoile étape par étape sur ce même écran.',
        'Papier : réponses sous chaque étape du livret.',
      ),
      proprietes: {
        modalite: 'solo',
        exemple: {
          id: 'b2-03-a3-exemple-quantif',
          enonce:
            'Pour cet exemple, cinq clients et deux commerciaux : Léa suit Nautic Sud, Voiles Martin et Chantier Duval ; Karim suit Sailtech GmbH et Mar Azul SL. Hélène écrit : « il existe un commercial qui suit tous nos clients ». Marc répond : « chaque client est suivi par un commercial ».',
          etapes: [
            {
              id: 'phrases',
              intitule: 'Écrire les deux phrases',
              raisonnement:
                'Hélène : ∃ commercial, ∀ client, il le suit. Marc : ∀ client, ∃ commercial qui le suit.',
              invite:
                'Écrivez chaque phrase avec ∀ et ∃, dans l’ordre des mots.',
            },
            {
              id: 'marc',
              intitule: 'La phrase de Marc',
              raisonnement:
                'Chacun des cinq clients a un commercial, Léa ou Karim : la phrase de Marc est vraie.',
              invite: 'La phrase de Marc est-elle vraie ?',
            },
            {
              id: 'helene',
              intitule: 'La phrase d’Hélène',
              raisonnement:
                'Léa ne suit pas Sailtech GmbH, Karim ne suit pas Nautic Sud : aucun commercial ne suit les cinq clients. La phrase d’Hélène est fausse.',
              invite: 'La phrase d’Hélène est-elle vraie ?',
            },
            {
              id: 'negation',
              intitule: 'Nier la phrase d’Hélène',
              raisonnement:
                'Contraire : ∀ commercial, ∃ client qu’il ne suit pas. Chaque commercial a au moins un client qui n’est pas le sien.',
              invite: 'Écrivez le contraire de la phrase d’Hélène.',
            },
            {
              id: 'tableur',
              intitule: 'Au tableur',
              raisonnement:
                'Liste client par client, commercial en B2:B6 : =NB.SI(B2:B6;"Léa") compte trois clients sur cinq, donc Léa ne les suit pas tous.',
              invite: 'Quelle formule compte les clients de Léa ?',
            },
          ],
        },
        etayage: 0,
      },
    },
    {
      minutes: 2,
      notes: [
        'S’arrêter sur l’ordre des mots (étape 1) et sur la négation (étape 4).',
        'Transition : « À vous, sur les seize factures : exercice 6. »',
      ],
    },
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B2-03-A3-05-ATELIER-QUANTIF',
      titre: 'Exercice 6 — Contredire une affirmation',
      diffusion: 'seance',
      brique: 'questionnaire',
      dureeMinutes: 9,
      concepts: ['quantificateur', 'negation'],
      notes: moteur.puces(
        'Temps : réflexion 2 min · travail 7 min',
        'Réflexion : écrire chaque affirmation avec ∀ ou ∃, puis sa négation.',
        'Pièges : « toutes » nié en « aucune » ; ≥ nié en ≤ ; l’ordre des quantificateurs ; « il existe » gardé en niant.',
        'Papier : exercice 6 du livret.',
      ),
      proprietes: {
        renvoi: RENVOI_AUX_FACTURES,
        intitule: 'Exercice 6 — Contredire une affirmation',
        consigne: 'Un client peut avoir plusieurs factures.',
        regime: 'focus',
        ordre: 'fixe',
        questions: [
          moteur.vote(
            'b2-03-a3-non-toutes',
            'quantificateur',
            true,
            'Hélène : « toutes nos impayées ont au moins 60 jours ». Quel est le contraire ?',
            'Au moins une impayée a moins de 60 jours',
            [
              [
                'Aucune impayée n’a au moins 60 jours',
                'negation-pour-tout-en-aucun',
              ],
              [
                'Au moins une impayée a au plus 60 jours',
                'negation-comparaison',
              ],
            ],
          ),
          moteur.numerique(
            'b2-03-a3-impayees-recentes',
            'quantificateur',
            'Combien de factures contredisent l’affirmation d’Hélène ?',
            'factures',
            2,
            moteur.TOLERANCE_NULLE,
            '2 factures',
            [[3, 'negation-comparaison']],
          ),
          moteur.vote(
            'b2-03-a3-ordre',
            'quantificateur',
            true,
            'Quelle phrase traduit « ∀ client, ∃ facture payée de ce client » ?',
            'Chaque client a au moins une facture payée',
            [
              [
                'Il existe une facture payée par tous les clients',
                'ordre-quantificateurs-inverse',
              ],
            ],
          ),
          moteur.numerique(
            'b2-03-a3-clients',
            'quantificateur',
            'Combien de clients contredisent la phrase juste ci-dessus ?',
            'clients',
            3,
            moteur.TOLERANCE_NULLE,
            '3 clients',
            [[7, 'negation-il-existe-gardee']],
          ),
        ],
      },
    },
    {
      minutes: 2,
      notes: [
        'Corriger question par question, en commençant par la moins réussie.',
        'Transition : « Une IA a vérifié les mêmes affirmations. »',
      ],
    },
    [
      [
        'b2-03-a3-non-toutes',
        '¬(∀ impayée, délai ≥ 60) ⇔ ∃ impayée, délai < 60. « Aucune » n’est pas le contraire de « toutes ».',
      ],
      [
        'b2-03-a3-impayees-recentes',
        'Impayées sous 60 jours : F206 (58 jours) et F212 (15 jours), soit 2 factures. F213, à 60 jours pile, respecte l’affirmation : avec ≤ 60, on la compterait à tort.',
      ],
      [
        'b2-03-a3-ordre',
        '∀ puis ∃ : chaque client a sa facture payée, pas une même facture pour tous.',
      ],
      [
        'b2-03-a3-clients',
        'Contraire : ∃ client, ∀ facture de ce client, impayée. Chantier Duval, Blue Sails BV et Vela Italia Srl n’ont aucune facture payée : 3 clients. Compter les clients qui ont au moins une facture impayée donne 7 : c’est garder « il existe » en niant.',
      ],
    ],
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B2-03-A3-06-DEFI-IA',
      titre: 'Exercice 7 — Corriger le contrôle d’une IA',
      diffusion: 'seance',
      brique: 'fp-challenge',
      dureeMinutes: 8,
      concepts: ['quantificateur', 'negation', 'connecteur'],
      notes: moteur.puces(
        'Temps : réflexion 2 min · travail 6 min',
        'Réflexion : relire les deux pages de trace écrite de la notion 3.',
        'Repérer qui trouve la négation, le connecteur et l’ordre ; faire trouver la piste fausse avant de révéler.',
        'Papier : exercice 7 du livret.',
      ),
      proprietes: {
        modalite: 'solo',
        probleme: {
          id: 'b2-03-a3-defi-ia',
          enonce:
            'Samir a demandé à un assistant IA de contrôler le fichier. Réponse : « 1. “Toutes les factures impayées de plus de 60 jours sont relancées” est fausse, donc aucune facture impayée de plus de 60 jours n’est relancée. 2. Factures à relancer : celles qui sont impayées ou dont le délai dépasse 60 jours, soit 9 factures. 3. “Chaque client a un commercial” signifie qu’un même commercial suit tous les clients. »',
          invite:
            'Trouvez les erreurs de l’IA, corrigez chacune et dites comment la vérifier dans le fichier.',
        },
        corrige: {
          type: 'defi',
          strategies: [
            moteur.strategie(
              'negation',
              'Le contraire de « toutes… sont relancées » est « au moins une… n’est pas relancée », pas « aucune ».',
            ),
            moteur.strategie(
              'et',
              'La relance exige les deux conditions : impayée et délai de plus de 60 jours, soit 5 factures, pas 9.',
            ),
            moteur.strategie(
              'ordre',
              '« Chaque client a un commercial » (∀ puis ∃) n’entraîne pas qu’un même commercial les suive tous (∃ puis ∀).',
            ),
            moteur.strategie(
              'controle',
              'Vérifier sur une ligne : F209, payée à 61 jours, ne doit pas être relancée.',
            ),
            moteur.strategie(
              'garder',
              'Garder la réponse : l’IA a lu tout le fichier, elle ne peut pas se tromper.',
              true,
            ),
          ],
        },
        renvoi: RENVOI_AUX_FACTURES,
      },
    },
    {
      minutes: 2,
      notes: [
        'Faire lire deux corrections écrites par la classe, puis dévoiler les pistes une à une.',
        'Transition : jalon 3, puis pause de 15 minutes.',
      ],
    },
    [
      [
        'negation',
        'Nier « toutes » donne « au moins une ne… pas » : l’IA a confondu contraire et « aucune ».',
      ],
      [
        'et',
        'Avec « ou », F206 (impayée à 58 jours) et F209 (payée à 61 jours) seraient relancées : la règle est un « et », 5 factures.',
      ],
      [
        'ordre',
        'L’ordre ∀ puis ∃ laisse à chaque client son commercial ; ∃ puis ∀ en exigerait un seul pour tous.',
      ],
      [
        'controle',
        'Une ligne où une seule condition est vraie suffit à départager « et » et « ou ».',
      ],
      [
        'garder',
        'Piste fausse : une réponse d’IA se contrôle sur les données, ligne à ligne.',
      ],
    ],
  ),
  {
    screenId: 'B2-03-A3-07-JALON',
    titre: 'Jalon 3 : quantifier',
    diffusion: 'seance',
    brique: 'fp-pulse',
    dureeMinutes: 1,
    concepts: ['quantificateur'],
    notes: moteur.puces(
      '30 s de vote anonyme.',
      'Pause de 15 minutes, hors durée programmée.',
    ),
    proprietes: {
      sondage: {
        id: 'b2-03-a3-jalon',
        invite:
          'Je sais nier une phrase avec « tous » ou « il existe » et la vérifier avec NB.SI.',
      },
    },
  },
];

const LETTRES_DU_FICHIER = ['A', 'B', 'C', 'D', 'E', 'F', 'G'] as const;
const PREMIERE_LIGNE_DU_FICHIER = 2;
const DERNIERE_LIGNE_DU_FICHIER =
  PREMIERE_LIGNE_DU_FICHIER + FACTURES.length - 1;
const PLAGE_DES_RELANCES = `H${PREMIERE_LIGNE_DU_FICHIER}:H${DERNIERE_LIGNE_DU_FICHIER}`;
const PLAGE_DES_VISAS = `I${PREMIERE_LIGNE_DU_FICHIER}:I${DERNIERE_LIGNE_DU_FICHIER}`;

const FORMULE_DE_RELANCE = '=SI(ET(F2="Impayée";E2>60);"Relancer";"Non")';
const FORMULE_DU_VISA_DU_FICHIER =
  '=SI(OU(D2>=5000;C2<>"France");"Visa";"Non")';

const ENTETES_DU_FICHIER = {
  A1: 'Facture',
  B1: 'Client',
  C1: 'Pays',
  D1: 'Montant HT (€)',
  E1: 'Délai (jours)',
  F1: 'Statut',
  G1: 'N° de TVA renseigné',
  H1: 'Relance',
  I1: 'Visa',
  J1: 'Indicateur',
  K1: 'Valeur',
  J2: 'Factures à relancer',
  J3: 'Factures à viser',
};

const CELLULES_DU_FICHIER = {
  ...ENTETES_DU_FICHIER,
  ...cellulesDesLignes(
    FACTURES.map((ligne) => ligne.numero),
    LETTRES_DU_FICHIER.map((colonne, rang) => [
      colonne,
      (ligne: Facture) =>
        [
          ligne.numero,
          ligne.client,
          ligne.pays,
          String(ligne.ht),
          String(ligne.delai),
          ligne.statut,
          ligne.tva,
        ][rang],
    ]),
  ),
};

const PLAN_DU_CONTROLE = {
  id: 'b2-03-a4-feuille-controle',
  intitule: 'Question tableur (3 points) — Contrôler les seize factures',
  lignes: DERNIERE_LIGNE_DU_FICHIER,
  colonnes: 11,
  cellules: CELLULES_DU_FICHIER,
  verrouillees: Object.keys(CELLULES_DU_FICHIER),
  consignes: [
    `En H2, avec SI et ET : « Relancer » si la facture est impayée et si son délai dépasse 60 jours, « Non » sinon. Recopiez jusqu’en H${DERNIERE_LIGNE_DU_FICHIER}.`,
    `En I2, avec SI et OU : « Visa » si le montant HT atteint 5 000 € ou si le pays n’est pas la France, « Non » sinon. Recopiez jusqu’en I${DERNIERE_LIGNE_DU_FICHIER}.`,
    'En K2 et K3, comptez avec NB.SI les factures à relancer et les factures à viser.',
  ],
};

function ligneDuFichier(numero: string): number {
  return (
    PREMIERE_LIGNE_DU_FICHIER +
    FACTURES.findIndex((ligne) => ligne.numero === numero)
  );
}

function attenduDeColonne(
  colonne: 'H' | 'I',
  formule: string,
  numero: string,
  valeur: string,
) {
  const ligne = ligneDuFichier(numero);
  return moteur.attendu(
    `${colonne}${ligne}`,
    recopiee(formule, ligne),
    valeur,
    ligne === PREMIERE_LIGNE_DU_FICHIER
      ? 'references'
      : { memeQue: `${colonne}${PREMIERE_LIGNE_DU_FICHIER}` },
    [],
    'critere-sans-guillemets',
  );
}

function relanceDe(numero: string): string {
  const ligne = factureNumero(numero);
  return ligne.statut === 'Impayée' && ligne.delai > 60 ? 'Relancer' : 'Non';
}

const ATTENDUS_DU_CONTROLE = auMoinsUn([
  ...FACTURES.map(({ numero }) =>
    attenduDeColonne('H', FORMULE_DE_RELANCE, numero, relanceDe(numero)),
  ),
  ...FACTURES.map(({ numero }) =>
    attenduDeColonne('I', FORMULE_DU_VISA_DU_FICHIER, numero, visaDe(numero)),
  ),
  moteur.attendu(
    'K2',
    `=NB.SI(${PLAGE_DES_RELANCES};"Relancer")`,
    5,
    'references',
    [[6, 'borne-stricte-large']],
    'critere-sans-guillemets',
    moteur.TOLERANCE_NULLE,
  ),
  moteur.attendu(
    'K3',
    `=NB.SI(${PLAGE_DES_VISAS};"Visa")`,
    8,
    'references',
    [
      [10, 'ou-compte-deux-fois'],
      [6, 'ou-lu-exclusif'],
    ],
    'critere-sans-guillemets',
    moteur.TOLERANCE_NULLE,
  ),
]);

const PARCOURS_DU_COFFRE = 'b2-03-a4-coffre-controle';

const ACTE_4: moteur.Acte = [
  moteur.ecranV2(
    {
      screenId: 'B2-03-A4-01-SITUATION-FACTURES',
      titre: 'Mini-situation CCF : contrôler les comptes clients',
      diffusion: 'catalogue',
      dureeMinutes: 3,
      concepts: ['connecteur', 'tableur'],
      notes: moteur.puces(
        'Mini-situation de 33 min (tableur 17, coffre 16), calculatrice, poste individuel ; barème sur 10 : tableur 3, énigmes 2, 2, 1,5 et 1,5.',
        'Papier : la situation est en tête de la partie 4 du livret.',
      ),
    },
    'table',
    {
      title: 'Mini-situation CCF : contrôler les comptes clients',
      subtitle:
        'Le fichier de Marc Lefèvre, colonnes A à G. Barème sur 10 : une question tableur, puis quatre énigmes.',
      columns: COLONNES_DES_FACTURES.map((colonne, rang) => ({
        key: colonne.key,
        label: `${LETTRES_DU_FICHIER[rang]} · ${colonne.label}`,
      })),
      rows: LIGNES_DES_FACTURES,
      note: `Relance : facture impayée dont le délai dépasse 60 jours ; indemnité forfaitaire de 40 €, due pour tout retard (Code de commerce), réclamée avec chaque relance. Visa (procédure interne fictive) : montant HT d’au moins 5 000 € ou client hors de France. ${DONNEES_FICTIVES}`,
    },
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B2-03-A4-02-TABLEUR-CONTROLE',
      titre: 'Question tableur (3 points sur 10) : contrôler le fichier',
      diffusion: 'seance',
      brique: 'fp-sheet',
      dureeMinutes: 15,
      concepts: ['tableur', 'connecteur'],
      notes: moteur.puces(
        'Temps : réflexion 3 min · travail 12 min',
        'Réflexion : chacun écrit sur papier les deux règles avec leurs symboles, puis les fonctions à utiliser.',
        'Erreurs à chercher : textes sans guillemets ; >= au lieu de > pour la relance ; NB.SI additionnés pour le visa.',
        'Papier : formules écrites sur la copie, résultats comptés à la main ; en CCF, la question se fait devant l’examinateur.',
      ),
      proprietes: {
        modalite: 'solo',
        plan: PLAN_DU_CONTROLE,
        questions: [
          {
            type: 'feuille',
            id: PLAN_DU_CONTROLE.id,
            concept: 'tableur',
            noteCompte: true,
            corrige: {
              type: 'feuille',
              plan: PLAN_DU_CONTROLE,
              attendus: ATTENDUS_DU_CONTROLE,
              seuilReussite: 0.8,
            },
          },
        ],
      },
    },
    {
      minutes: 2,
      notes: [
        'Projeter la feuille d’un poste volontaire et relire chaque formule.',
        'Transition : « Avec ce fichier, ouvrez le coffre de la mini-situation. »',
      ],
    },
    [
      [
        `H2 à H${DERNIERE_LIGNE_DU_FICHIER}`,
        `${FORMULE_DE_RELANCE} : ET pour « et », > pour « dépasse ». F213, à 60 jours pile, n’est pas relancée.`,
      ],
      [
        `I2 à I${DERNIERE_LIGNE_DU_FICHIER}`,
        `${FORMULE_DU_VISA_DU_FICHIER} : OU pour « ou », >= pour « au moins ». F213 est visée, F209 (4 950 €) ne l’est pas.`,
      ],
      [
        'K2 et K3',
        `=NB.SI(${PLAGE_DES_RELANCES};"Relancer") donne 5 et =NB.SI(${PLAGE_DES_VISAS};"Visa") donne 8. Additionner deux NB.SI pour le visa donnerait 10 : F205 et F210 compteraient deux fois.`,
      ],
    ],
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B2-03-A4-03-COFFRE-CONTROLE',
      titre: 'Mini-situation : conclure le contrôle',
      diffusion: 'seance',
      brique: 'fp-escape',
      dureeMinutes: 14,
      concepts: ['connecteur', 'negation'],
      notes: moteur.puces(
        'Temps : réflexion 2 min · travail 12 min',
        'Réflexion : écrire la négation de la règle de relance avant d’ouvrir le coffre.',
        'Indices disponibles après 60 s. À 10 min, projeter l’énigme la moins résolue.',
        'Papier : quatre questions rédigées du livret, sans code de coffre.',
      ),
      proprietes: {
        modalite: 'solo',
        parcours: {
          id: PARCOURS_DU_COFFRE,
          intitule:
            'Conclure le contrôle : quatre réponses pour ouvrir le coffre',
          delaiIndiceMs: 60000,
          budgetEnigmeMs: 150000,
          tentativesMax: 10,
          enigmes: [
            {
              id: 'b2-03-a4-e1-indemnites',
              intitule: 'Les indemnités de retard (2 points)',
              enonce:
                'Marc joint à chaque relance l’indemnité forfaitaire de 40 €. Quel montant total d’indemnités réclame-t-il, en euros ?',
              indice:
                'Comptez d’abord les factures qui vérifient les deux conditions de la relance, borne comprise.',
            },
            {
              id: 'b2-03-a4-e2-sans-relance',
              intitule: 'Les factures sans relance (2 points)',
              enonce: 'Combien de factures ne sont pas à relancer ?',
              indice:
                'Niez la règle de relance avec Morgan sans oublier la borne, ou retirez les factures à relancer du total.',
            },
            {
              id: 'b2-03-a4-e3-visa',
              intitule: 'Visées sous le seuil (1,5 point)',
              enonce:
                'Samir pense que toute facture visée a un montant d’au moins 5 000 € HT. Combien de factures visées le contredisent ?',
              indice:
                'Cherchez les contre-exemples : visées, mais sous le seuil du montant.',
            },
            {
              id: 'b2-03-a4-e4-requete',
              intitule: 'La requête du logiciel (1,5 point)',
              enonce:
                "Le logiciel de facturation range les factures dans une table factures(numero, pays, tva). Combien de lignes renvoie la requête SELECT numero FROM factures WHERE pays <> 'France' AND tva = 'Non' ?",
              indice:
                'Traduisez la clause WHERE en français : les deux conditions doivent être vraies ensemble.',
            },
          ],
        },
        questions: [
          moteur.enigme(
            PARCOURS_DU_COFFRE,
            0,
            'b2-03-a4-e1-indemnites',
            'connecteur',
            200,
            0,
            '200 euros',
            'V4',
            [
              [240, 'borne-stricte-large'],
              [360, 'et-traduit-par-ou'],
            ],
          ),
          moteur.enigme(
            PARCOURS_DU_COFFRE,
            1,
            'b2-03-a4-e2-sans-relance',
            'negation',
            11,
            0,
            '11 factures',
            'F2',
            [
              [7, 'negation-sans-morgan'],
              [10, 'negation-comparaison'],
            ],
          ),
          moteur.enigme(
            PARCOURS_DU_COFFRE,
            2,
            'b2-03-a4-e3-visa',
            'connecteur',
            4,
            0,
            '4 factures',
            'R7',
            [[0, 'implication-lue-comme-equivalence']],
          ),
          moteur.enigme(
            PARCOURS_DU_COFFRE,
            3,
            'b2-03-a4-e4-requete',
            'connecteur',
            3,
            0,
            '3 lignes',
            'A9',
            [[6, 'et-traduit-par-ou']],
          ),
        ],
      },
    },
    {
      minutes: 2,
      notes: [
        'Dévoiler énigme par énigme, en s’attardant sur la moins résolue (pupitre).',
        'Finir sur la requête : le même « et » s’écrit ET au tableur et AND en SQL.',
      ],
    },
    [
      [
        'b2-03-a4-e1-indemnites',
        'Cinq factures à relancer (F202, F204, F207, F211, F215) : 5 × 40 = 200 €. Avec ≥ 60, F213 s’ajoute (240 €) ; avec « ou », neuf factures (360 €).',
      ],
      [
        'b2-03-a4-e2-sans-relance',
        'Contraire : payée ou délai d’au plus 60 jours, soit 16 − 5 = 11 factures. Sans Morgan (payée et au plus 60 jours) : 7 ; avec < 60 au lieu de ≤ 60 : 10.',
      ],
      [
        'b2-03-a4-e3-visa',
        'Visées sous 5 000 € : F203, F207, F212 et F215, toutes hors de France, soit 4 factures. Répondre 0, c’est lire la règle du visa comme une équivalence.',
      ],
      [
        'b2-03-a4-e4-requete',
        'AND exige les deux conditions : F205, F207 et F212, soit 3 lignes. Avec OR, la requête en renverrait 6.',
      ],
    ],
  ),
  moteur.ecranDeRappel(
    { screenId: 'B2-03-A4-04-RAPPEL', concepts: [...CONCEPTS_DU_COURS] },
    'Tous reçoivent les deux questions obligatoires (Morgan, négation de « tous »), en plus de leurs points faibles.',
    'b2-03-a4-rappel',
    {
      questions: [
        moteur.rappel(
          'b2-03-r-ou',
          'connecteur',
          'P est vraie et Q est vraie. Que vaut « P ou Q » ?',
          'Vrai : « ou » accepte les deux conditions vraies',
          [['Faux : il faut une seule condition vraie', 'ou-lu-exclusif']],
        ),
        moteur.rappel(
          'b2-03-r-implication',
          'connecteur',
          'Règle : « si P, alors Q ». Quel cas la contredit ?',
          'P est vraie alors que Q est fausse',
          [['P fausse et Q vraie', 'implication-lue-comme-equivalence']],
        ),
        moteur.rappel(
          'b2-03-r-borne',
          'proposition',
          '« Au-delà de 30 jours », délai en B2 : quelle condition écrire au tableur ?',
          'B2>30',
          [['B2>=30', 'borne-stricte-large']],
        ),
        moteur.rappel(
          'b2-03-r-morgan-et',
          'negation',
          'Quel est le contraire de « payée et livrée » ?',
          'Non payée ou non livrée',
          [['Non payée et non livrée', 'negation-sans-morgan']],
        ),
        moteur.rappel(
          'b2-03-r-morgan-ou',
          'negation',
          'Quel est le contraire de « urgente ou importante » ?',
          'Ni urgente ni importante',
          [['Non urgente ou non importante', 'negation-sans-morgan']],
        ),
        moteur.rappel(
          'b2-03-r-comparaison',
          'negation',
          'Quel est le contraire de « stock ≥ 20 » ?',
          'Stock < 20',
          [['Stock ≤ 20', 'negation-comparaison']],
        ),
        moteur.rappel(
          'b2-03-r-pour-tout',
          'quantificateur',
          'Quel est le contraire de « tous les clients ont payé » ?',
          'Au moins un client n’a pas payé',
          [['Aucun client n’a payé', 'negation-pour-tout-en-aucun']],
        ),
        moteur.rappel(
          'b2-03-r-il-existe',
          'quantificateur',
          'Quel est le contraire de « il existe une facture en retard » ?',
          'Aucune facture n’est en retard',
          [
            [
              'Il existe une facture qui n’est pas en retard',
              'negation-il-existe-gardee',
            ],
          ],
        ),
        moteur.rappel(
          'b2-03-r-ordre',
          'quantificateur',
          '« Chaque salarié a un badge » veut-il dire « un même badge sert à tous les salariés » ?',
          'Non : l’ordre des quantificateurs change le sens',
          [
            [
              'Oui : les deux phrases disent la même chose',
              'ordre-quantificateurs-inverse',
            ],
          ],
        ),
        moteur.rappel(
          'b2-03-r-guillemets',
          'tableur',
          'Quel critère NB.SI compte les montants d’au moins 1 000 ?',
          '">=1000", entre guillemets',
          [['>=1000, sans guillemets', 'critere-sans-guillemets']],
        ),
        moteur.rappel(
          'b2-03-r-compter-ou',
          'connecteur',
          '12 lignes vérifient A, 9 vérifient B, 4 vérifient les deux. Combien vérifient « A ou B » ?',
          '17, soit 12 + 9 − 4',
          [['21, soit 12 + 9', 'ou-compte-deux-fois']],
        ),
        moteur.rappel(
          'b2-03-r-sql',
          'connecteur',
          'Règle « client fidèle et commande d’au moins 1 000 € » : quelle clause WHERE écrire ?',
          "fidele = 'Oui' AND montant >= 1000",
          [["fidele = 'Oui' OR montant >= 1000", 'et-traduit-par-ou']],
        ),
      ],
      obligatoires: ['b2-03-r-morgan-et', 'b2-03-r-pour-tout'],
    },
  ),
  moteur.ficheMemo(
    {
      screenId: 'B2-03-A4-05-FICHE-MEMO',
      titre: 'Fiche mémo : écrire et contrôler une règle',
      concepts: [...CONCEPTS_DU_COURS],
    },
    [
      {
        title: 'Proposition',
        description: 'Vraie ou fausse ?',
        back: 'Une phrase qui est V ou F. Nommer chaque condition par une lettre.',
      },
      {
        title: 'Et, ou',
        description: 'Deux conditions ?',
        back: 'P ∧ Q : les deux. P ∨ Q : au moins une, les deux comprises. Compter « A ou B » : A + B − (A et B).',
      },
      {
        title: 'Si… alors',
        description: 'Une règle ?',
        back: 'P ⇒ Q est fausse seulement si P est vraie et Q fausse. La réciproque est une autre phrase.',
      },
      {
        title: 'Bornes',
        description: 'Quel symbole ?',
        back: '« Plus de », « au-delà de », « dépasse » : >. « Au moins », « à partir de », « atteint » : ≥.',
      },
      {
        title: 'Négation',
        description: 'Le contraire d’une comparaison ?',
        back: '> devient ≤, ≥ devient <. Tester la borne des deux côtés.',
      },
      {
        title: 'Morgan',
        description: 'Nier deux conditions ?',
        back: '¬(P ∧ Q) = ¬P ∨ ¬Q ; ¬(P ∨ Q) = ¬P ∧ ¬Q.',
      },
      {
        title: 'Quantificateurs',
        description: 'Tous, ou au moins un ?',
        back: '¬(∀x, P(x)) = ∃x, ¬P(x) ; ¬(∃x, P(x)) = ∀x, ¬P(x). L’ordre de ∀ et ∃ compte.',
      },
      {
        title: 'Tableur',
        description: 'Quelle formule ?',
        back: 'SI, ET, OU, NON ; NB.SI(plage;"critère"). Textes et critères entre guillemets.',
      },
      {
        title: 'Requête',
        description: 'Filtrer une table ?',
        back: 'WHERE traduit la règle : AND pour « et », OR pour « ou », <> pour « différent de ».',
      },
      moteur.REFERENTIEL_DU_BTS_CG,
    ],
  ),
  {
    screenId: 'B2-03-A4-06-BILLET-DE-SORTIE',
    titre: 'Billet de sortie : la formule pour l’expert-comptable',
    diffusion: 'seance',
    brique: 'fp-exit',
    dureeMinutes: 4,
    concepts: ['connecteur', 'tableur'],
    notes: moteur.puces(
      '4 min ; clore la séance quand le compteur de billets est complet.',
      'Pièges : OU au lieu de ET, >= au lieu de >, texte sans guillemets.',
    ),
    proprietes: {
      modalite: 'solo',
      questions: [
        moteur.vote(
          'b2-03-a4-billet',
          'connecteur',
          true,
          'Marc veut une formule de relance à recopier dans tout le fichier, statut en F2 et délai en E2. Laquelle peut partir telle quelle ?',
          '=SI(ET(F2="Impayée";E2>60);"À relancer";"")',
          [
            [
              '=SI(OU(F2="Impayée";E2>60);"À relancer";"")',
              'et-traduit-par-ou',
            ],
            [
              '=SI(ET(F2="Impayée";E2>=60);"À relancer";"")',
              'borne-stricte-large',
            ],
            [
              '=SI(ET(F2=Impayée;E2>60);"À relancer";"")',
              'critere-sans-guillemets',
            ],
          ],
        ),
      ],
      invite:
        'Quelle facture du fichier montre que la borne compte, et pourquoi ?',
    },
  },
];

const REMEDIATIONS: ContenuDeCours['remediations'] = {
  'ou-lu-exclusif': 'B2-03-A1-06-COURS-CONNECTEURS',
  'ou-compte-deux-fois': 'B2-03-A1-06-COURS-CONNECTEURS',
  'implication-lue-comme-equivalence': 'B2-03-A1-07-COURS-IMPLICATION',
  'borne-stricte-large': 'B2-03-A1-07-COURS-IMPLICATION',
  'et-traduit-par-ou': 'B2-03-A1-08-EXEMPLE-TABLE',
  'negation-comparaison': 'B2-03-A2-02-COURS-NEGATION',
  'negation-sans-morgan': 'B2-03-A2-03-COURS-MORGAN',
  'negation-pour-tout-en-aucun': 'B2-03-A3-02-COURS-PREDICATS',
  'negation-il-existe-gardee': 'B2-03-A3-02-COURS-PREDICATS',
  'critere-sans-guillemets': 'B2-03-A3-03-COURS-QUANTIFICATEURS',
  'ordre-quantificateurs-inverse': 'B2-03-A3-04-EXEMPLE-QUANTIF',
};

export const COURS_B2_03 = moteur.coursB2(
  [ACTE_1, ACTE_2, ACTE_3, ACTE_4],
  REMEDIATIONS,
  [],
  {
    slug: 'b2-03-logique',
    titre: 'Logique : écrire et contrôler une règle',
    gabarit: 'v3',
    dureeMinutes: 180,
    concepts: [...CONCEPTS_DU_COURS],
  },
);
