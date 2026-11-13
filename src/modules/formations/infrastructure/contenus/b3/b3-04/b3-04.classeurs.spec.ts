import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  classeursPublies,
  lireLeManifeste,
  relireClasseur,
  type OngletCanonique,
} from '../../../../../../../test/helpers/formations/b3/b3-01/classeurs';
import {
  GRAINE_B3_01,
  genererJeuB301,
} from '../../../../../../../test/helpers/formations/b3/b3-01/generateur';
import { partiesDeDate } from '../../../../../../../test/helpers/formations/b3/b3-01/excel';
import {
  nombreDe,
  texteDe,
  type Ligne,
} from '../../../../../../../test/helpers/formations/b3/b3-01/modele';
import { AGENCES } from '../../../../../../../test/helpers/formations/b3/b3-01/referentiels';
import {
  COLONNES_DES_CONTACTS,
  ecrireLesClasseursB304,
  genererClasseursB304,
  octetsDesClasseursB304,
} from '../../../../../../../test/helpers/formations/b3/b3-04/contacts';
import {
  ADRESSES_DE_REMPLISSAGE_B3_04,
  CLASSEURS_B3_04,
  VALEURS_B3_04,
} from './b3-04.donnees';

const DOSSIER = join(__dirname, '../../../classeurs/b3-04');
const DOSSIER_B3_01 = join(__dirname, '../../../classeurs/b3-01');
const DELAI_MS = 120_000;
const BASES = { contacts: 'B3-04_contacts', envoi: 'B3-04_envoi' } as const;

const jeu = genererJeuB301(GRAINE_B3_01);
const classeurs = genererClasseursB304(jeu);
const clientsDuB301 = jeu.reprise1.Clients.lignes;
const commandesDe2026 = jeu.reprise1.Commandes.lignes.filter(
  (ligne) => partiesDeDate(nombreDe(ligne, 'date_commande')).annee === 2026,
);

const idDe = (ligne: Ligne): string => texteDe(ligne, 'client_id');

const premiereCommande = new Map(
  clientsDuB301.map((client) => [
    idDe(client),
    nombreDe(client, 'date_premiere_commande'),
  ]),
);

const ORIGINAL_DU_JUMEAU: ReadonlyMap<string, string> = new Map(
  clientsDuB301.flatMap((client) => {
    const autre = client.doublon_probable;
    return typeof autre === 'string' &&
      (premiereCommande.get(autre) ?? Infinity) <
        (premiereCommande.get(idDe(client)) ?? -Infinity)
      ? [[idDe(client), autre] as const]
      : [];
  }),
);

const empreinte = (octets: Buffer): string =>
  createHash('sha256').update(octets).digest('hex').slice(0, 8);

const relire = async (fichier: string) =>
  relireClasseur(join(DOSSIER, fichier));

const enLignes = ({ colonnes, lignes }: OngletCanonique): Ligne[] =>
  lignes.map((ligne) =>
    Object.fromEntries(colonnes.map((colonne, rang) => [colonne, ligne[rang]])),
  );

const contactsRelus = async () =>
  enLignes((await relire(CLASSEURS_B3_04.contacts)).Contacts);

const centimes = (montant: number): number => Math.round(montant * 100);

const caEnCentimes = (lignes: readonly Ligne[], colonne: string): number =>
  centimes(
    lignes.reduce((total, ligne) => total + nombreDe(ligne, colonne), 0),
  );

const agenceDe = (ville: string): string | undefined =>
  AGENCES.find(({ villesDesClients }) =>
    villesDesClients.some((candidate) => candidate === ville),
  )?.ville;

describe('B3-04 — le classeur des contacts', () => {
  beforeAll(async () => {
    if (process.env.ECRIRE_CLASSEURS === '1') {
      await ecrireLesClasseursB304(classeurs, DOSSIER);
    }
  }, DELAI_MS);

  it(
    'B304-02 publie chaque classeur sous le nom suffixé de l’empreinte de ses octets, seul dans son dossier',
    async () => {
      const octets = await octetsDesClasseursB304(classeurs);

      expect(CLASSEURS_B3_04).toEqual({
        contacts: `${BASES.contacts}.${empreinte(octets.contacts)}.xlsx`,
        envoi: `${BASES.envoi}.${empreinte(octets.envoi)}.xlsx`,
      });
      expect(
        Object.values(CLASSEURS_B3_04).map((fichier) =>
          empreinte(readFileSync(join(DOSSIER, fichier))),
        ),
      ).toEqual([empreinte(octets.contacts), empreinte(octets.envoi)]);
      expect(new Set(readdirSync(DOSSIER))).toEqual(
        new Set(Object.values(CLASSEURS_B3_04)),
      );
    },
    DELAI_MS,
  );

  it('B304-02 laisse les classeurs du B3-01 tels que publiés', () => {
    expect(classeursPublies(jeu).map(({ onglets }) => onglets)).toEqual(
      lireLeManifeste(DOSSIER_B3_01).classeurs.map(({ onglets }) => onglets),
    );
  });

  it(
    'B304-02 n’a qu’un onglet, Contacts, aux colonnes de la lettre type, sans aucune adresse e-mail',
    async () => {
      const relu = await relire(CLASSEURS_B3_04.contacts);

      expect(Object.keys(relu)).toEqual(['Contacts']);
      expect(relu.Contacts.colonnes).toEqual([...COLONNES_DES_CONTACTS]);
      expect(JSON.stringify(relu)).not.toContain('@');
    },
    DELAI_MS,
  );

  it(
    'B304-02 garde un contact par client distinct : chaque jumeau retiré, l’original gardé',
    async () => {
      const ids = (await contactsRelus()).map(idDe);

      expect(ORIGINAL_DU_JUMEAU.size).toBe(4);
      expect(new Set(ids).size).toBe(ids.length);
      expect(ids).toEqual(
        clientsDuB301.map(idDe).filter((id) => !ORIGINAL_DU_JUMEAU.has(id)),
      );
    },
    DELAI_MS,
  );

  it(
    'B304-02 porte à chaque contact le CA de janvier à septembre 2026 de la reprise nettoyée, commandes de son jumeau comprises, au centime',
    async () => {
      const contacts = await contactsRelus();
      const caDe = (id: string): number =>
        caEnCentimes(
          commandesDe2026.filter(
            (ligne) =>
              (ORIGINAL_DU_JUMEAU.get(idDe(ligne)) ?? idDe(ligne)) === id,
          ),
          'ca_ht',
        );

      expect(
        contacts
          .filter(
            (contact) =>
              nombreDe(contact, 'ca_2026') !== caDe(idDe(contact)) / 100,
          )
          .map(idDe),
      ).toEqual([]);
      expect(caEnCentimes(contacts, 'ca_2026')).toBe(
        caEnCentimes(commandesDe2026, 'ca_ht'),
      );
    },
    DELAI_MS,
  );

  it(
    'B304-02 écrit civilité « Mme » ou « M. », code postal en texte de cinq chiffres, la ville du client et la ville de son agence',
    async () => {
      const contacts = await contactsRelus();
      const villeDuClient = new Map(
        clientsDuB301.map((client) => [idDe(client), texteDe(client, 'ville')]),
      );

      expect(new Set(contacts.map(({ civilite }) => civilite))).toEqual(
        new Set(['Mme', 'M.']),
      );
      expect(
        contacts.filter(
          ({ code_postal }) =>
            typeof code_postal !== 'string' || !/^\d{5}$/.test(code_postal),
        ),
      ).toEqual([]);
      expect(
        contacts
          .filter((contact) => {
            const ville = texteDe(contact, 'ville');
            return (
              villeDuClient.get(idDe(contact)) !== ville ||
              agenceDe(ville) !== texteDe(contact, 'agence') ||
              ['prenom', 'nom', 'adresse'].some(
                (champ) => texteDe(contact, champ).trim() === '',
              )
            );
          })
          .map(idDe),
      ).toEqual([]);
    },
    DELAI_MS,
  );

  it(
    'B304-02 tient les réponses notées, recomptées dans le classeur relu',
    async () => {
      const contacts = await contactsRelus();
      const deRennes = contacts.filter(({ agence }) => agence === 'Rennes');

      expect(VALEURS_B3_04).toEqual({
        'b3-04-a1-contacts': contacts.length,
        'b3-04-a2-lettres-rennes': deRennes.length,
        'b3-04-a2-chere-madame': deRennes.filter(
          ({ civilite }) => civilite === 'Mme',
        ).length,
      });
      expect(
        contacts.filter(({ ville }) => ville === 'Rennes'),
      ).not.toHaveLength(deRennes.length);
    },
    DELAI_MS,
  );
});

describe('B3-04 — le classeur d’envoi', () => {
  it(
    'B304-04 reprend les colonnes de Contacts dans le même ordre, plus l’e-mail, sur deux lignes de Rennes, « Mme » puis « M. », aux adresses de remplissage en .example',
    async () => {
      const envoi = await relire(CLASSEURS_B3_04.envoi);
      const contacts = await contactsRelus();
      const lignes = enLignes(envoi.Contacts);

      expect(Object.keys(envoi)).toEqual(['Contacts']);
      expect(envoi.Contacts.colonnes).toEqual([
        ...COLONNES_DES_CONTACTS,
        'email',
      ]);
      expect(
        lignes.map(({ civilite, agence, email }) => [civilite, agence, email]),
      ).toEqual([
        ['Mme', 'Rennes', ADRESSES_DE_REMPLISSAGE_B3_04[0]],
        ['M.', 'Rennes', ADRESSES_DE_REMPLISSAGE_B3_04[1]],
      ]);
      expect(
        ADRESSES_DE_REMPLISSAGE_B3_04.filter(
          (adresse) => !/^[a-z.]+@[a-z]+\.example$/.test(adresse),
        ),
      ).toEqual([]);
      expect(lignes).toEqual(
        lignes.map((ligne) => ({
          ...contacts.find((contact) => idDe(contact) === idDe(ligne)),
          email: ligne.email,
        })),
      );
    },
    DELAI_MS,
  );
});
