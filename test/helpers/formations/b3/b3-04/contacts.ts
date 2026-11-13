import { arrondi } from '../../../../../src/common/domain/nombres/arrondi';
import {
  creerRng,
  creerTirage,
  type Tirage,
} from '../../../../../src/modules/formations/domain/cours/tirage/Aleatoire';
import { ADRESSES_DE_REMPLISSAGE_B3_04 } from '../../../../../src/modules/formations/infrastructure/contenus/b3/b3-04/b3-04.donnees';
import { octetsDUnClasseur, type ExportDuClasseur } from '../b3-01/classeurs';
import { partiesDeDate } from '../b3-01/excel';
import { GRAINE_B3_01 } from '../b3-01/generateur';
import {
  nombreDe,
  texteDe,
  type Classeur,
  type Colonne,
  type JeuB301,
  type Ligne,
} from '../b3-01/modele';
import { AGENCES, NOMS_DE_FAMILLE } from '../b3-01/referentiels';
import { ecrireLeFichierServi } from '../../cours/classeurs-reserves';

const GRAINE_DES_CONTACTS = GRAINE_B3_01 + 304;
const ANNEE_DU_CA = 2026;
const AGENCE_DE_L_ENVOI = 'Rennes';
const NUMERO_MAXIMAL_DE_RUE = 120;

const EXPORT_DU_B3_04: ExportDuClasseur = {
  auteur: 'Norvane Équipement — service commercial',
  date: new Date(Date.UTC(2026, 11, 1, 7, 0, 0)),
};

const BASES = { contacts: 'B3-04_contacts', envoi: 'B3-04_envoi' } as const;

const COLONNES: readonly Colonne[] = [
  { nom: 'client_id', format: 'texte' },
  { nom: 'raison_sociale', format: 'texte' },
  { nom: 'civilite', format: 'texte' },
  { nom: 'prenom', format: 'texte' },
  { nom: 'nom', format: 'texte' },
  { nom: 'adresse', format: 'texte' },
  { nom: 'code_postal', format: 'texte' },
  { nom: 'ville', format: 'texte' },
  { nom: 'agence', format: 'texte' },
  { nom: 'ca_2026', format: 'euros' },
];

export const COLONNES_DES_CONTACTS: readonly string[] = COLONNES.map(
  ({ nom }) => nom,
);

const CODES_POSTAUX: Readonly<Record<string, string>> = {
  Lille: '59000',
  Roubaix: '59100',
  Tourcoing: '59200',
  Douai: '59500',
  Rouen: '76000',
  'Le Havre': '76600',
  Évreux: '27000',
  Dieppe: '76200',
  Paris: '75011',
  Montreuil: '93100',
  Vincennes: '94300',
  Créteil: '94000',
  Nanterre: '92000',
  'Boulogne-Billancourt': '92100',
  Versailles: '78000',
  Courbevoie: '92400',
  Nantes: '44000',
  'Saint-Nazaire': '44600',
  Angers: '49000',
  Cholet: '49300',
  Rennes: '35000',
  'Saint-Malo': '35400',
  Vannes: '56000',
  Fougères: '35300',
  Bordeaux: '33000',
  Mérignac: '33700',
  Pessac: '33600',
  Libourne: '33500',
  Toulouse: '31000',
  Blagnac: '31700',
  Colomiers: '31770',
  Montauban: '82000',
  Marseille: '13002',
  Aubagne: '13400',
  Martigues: '13500',
  Toulon: '83000',
  Montpellier: '34000',
  Nîmes: '30000',
  Béziers: '34500',
  Sète: '34200',
  Lyon: '69003',
  Villeurbanne: '69100',
  Vénissieux: '69200',
  'Saint-Étienne': '42000',
  Strasbourg: '67000',
  Colmar: '68000',
  Mulhouse: '68100',
  Haguenau: '67500',
};

const PRENOMS = {
  Mme: [
    'Camille',
    'Claire',
    'Élise',
    'Hélène',
    'Inès',
    'Julie',
    'Laure',
    'Léa',
    'Manon',
    'Nathalie',
    'Pauline',
    'Sophie',
  ],
  'M.': [
    'Antoine',
    'Bruno',
    'Damien',
    'Éric',
    'Hugo',
    'Julien',
    'Karim',
    'Louis',
    'Mathieu',
    'Nicolas',
    'Olivier',
    'Pierre',
  ],
} as const satisfies Record<string, readonly [string, ...string[]]>;

const VOIES = [
  'rue des Artisans',
  'avenue de la Gare',
  'boulevard du Commerce',
  'rue des Ateliers',
  'allée des Entrepreneurs',
  'rue du Marché',
  'zone d’activités des Prés',
  'rue de l’Industrie',
] as const satisfies readonly [string, ...string[]];

interface ClasseursB304 {
  readonly contacts: Classeur;
  readonly envoi: Classeur;
}

function exiger<T>(valeur: T | undefined, quoi: string): T {
  if (valeur === undefined) {
    throw new RangeError(`${quoi} introuvable`);
  }
  return valeur;
}

const agenceDe = (ville: string): string =>
  exiger(
    AGENCES.find(({ villesDesClients }) =>
      villesDesClients.some((candidate) => candidate === ville),
    ),
    `Agence de ${ville}`,
  ).ville;

function originaux(clients: readonly Ligne[]): ReadonlyMap<string, string> {
  const dates = new Map(
    clients.map((client) => [
      texteDe(client, 'client_id'),
      nombreDe(client, 'date_premiere_commande'),
    ]),
  );
  return new Map(
    clients.flatMap((client) => {
      const id = texteDe(client, 'client_id');
      const autre = client.doublon_probable;
      return typeof autre === 'string' &&
        exiger(dates.get(autre), autre) < exiger(dates.get(id), id)
        ? [[id, autre] as const]
        : [];
    }),
  );
}

function caParClient(
  jeu: JeuB301,
  original: ReadonlyMap<string, string>,
): ReadonlyMap<string, number> {
  const ca = new Map<string, number>();
  for (const ligne of jeu.reprise1.Commandes.lignes) {
    if (partiesDeDate(nombreDe(ligne, 'date_commande')).annee === ANNEE_DU_CA) {
      const id = texteDe(ligne, 'client_id');
      const client = original.get(id) ?? id;
      ca.set(client, (ca.get(client) ?? 0) + nombreDe(ligne, 'ca_ht'));
    }
  }
  return ca;
}

function contactDe(tirage: Tirage, client: Ligne, ca: number): Ligne {
  const civilite = tirage.choix<keyof typeof PRENOMS>(['Mme', 'M.']);
  const ville = texteDe(client, 'ville');
  return {
    client_id: texteDe(client, 'client_id'),
    raison_sociale: texteDe(client, 'raison_sociale'),
    civilite,
    prenom: tirage.choix(PRENOMS[civilite]),
    nom: tirage.choix(NOMS_DE_FAMILLE),
    adresse: `${tirage.entier(1, NUMERO_MAXIMAL_DE_RUE)} ${tirage.choix(VOIES)}`,
    code_postal: exiger(CODES_POSTAUX[ville], `Code postal de ${ville}`),
    ville,
    agence: agenceDe(ville),
    ca_2026: arrondi(ca, 2),
  };
}

function lignesDeLEnvoi(contacts: readonly Ligne[]): Ligne[] {
  const deLAgence = contacts.filter(
    (contact) => contact.agence === AGENCE_DE_L_ENVOI,
  );
  return (['Mme', 'M.'] as const).map((civilite, rang) => ({
    ...exiger(
      deLAgence.find((contact) => contact.civilite === civilite),
      `Contact ${civilite} de ${AGENCE_DE_L_ENVOI}`,
    ),
    email: ADRESSES_DE_REMPLISSAGE_B3_04[rang],
  }));
}

export function genererClasseursB304(jeu: JeuB301): ClasseursB304 {
  const tirage = creerTirage(creerRng(GRAINE_DES_CONTACTS));
  const clients = jeu.reprise1.Clients.lignes;
  const original = originaux(clients);
  const ca = caParClient(jeu, original);
  const contacts = clients
    .filter((client) => !original.has(texteDe(client, 'client_id')))
    .map((client) =>
      contactDe(tirage, client, ca.get(texteDe(client, 'client_id')) ?? 0),
    );
  return {
    contacts: { Contacts: { colonnes: COLONNES, lignes: contacts } },
    envoi: {
      Contacts: {
        colonnes: [...COLONNES, { nom: 'email', format: 'texte' }],
        lignes: lignesDeLEnvoi(contacts),
      },
    },
  };
}

export async function octetsDesClasseursB304(
  classeurs: ClasseursB304,
): Promise<Record<keyof ClasseursB304, Buffer>> {
  return {
    contacts: await octetsDUnClasseur(classeurs.contacts, EXPORT_DU_B3_04),
    envoi: await octetsDUnClasseur(classeurs.envoi, EXPORT_DU_B3_04),
  };
}

export async function ecrireLesClasseursB304(
  classeurs: ClasseursB304,
  dossier: string,
): Promise<void> {
  const octets = await octetsDesClasseursB304(classeurs);
  for (const role of ['contacts', 'envoi'] as const) {
    ecrireLeFichierServi(dossier, BASES[role], octets[role], 'xlsx');
  }
}
