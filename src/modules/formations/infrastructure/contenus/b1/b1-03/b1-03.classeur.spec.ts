import { readdirSync } from 'node:fs';
import {
  empreinteDuFichier,
  octetsDUnClasseur,
  ongletCanonique,
  relireClasseur,
  type ExportDuClasseur,
  type OngletCanonique,
} from '../../../../../../../test/helpers/formations/b3/b3-01/classeurs';
import { dateExcel } from '../../../../../../../test/helpers/formations/b3/b3-01/excel';
import type {
  Classeur,
  Onglet,
} from '../../../../../../../test/helpers/formations/b3/b3-01/modele';
import {
  cheminDuClasseur,
  ecrireLeFichierServi,
  empreinteDe,
  nomServiDe,
} from '../../../../../../../test/helpers/formations/cours/classeurs-reserves';
import {
  CANAUX,
  CLASSEUR_DES_VENTES,
  NOMBRE_DE_VENTES,
  TCD_DES_CANAUX,
  TOTAL_GENERAL,
  VENTES_D_OCTOBRE,
} from './b1-03.donnees';

const ONGLET = 'Ventes';
const BASE = 'B1-03_ventes_octobre';
const DELAI_MS = 60_000;
const EXPORT: ExportDuClasseur = {
  auteur: 'Partie Libre — service gestion',
  date: new Date(Date.UTC(2026, 10, 2, 8, 0, 0)),
};

const VENTES: Onglet = {
  colonnes: [
    { nom: 'Date', format: 'date' },
    { nom: 'Boutique', format: 'texte' },
    { nom: 'Canal', format: 'texte' },
    { nom: 'Catégorie', format: 'texte' },
    { nom: 'CA_HT', format: 'euros' },
    { nom: 'Cout_achat_HT', format: 'euros' },
  ],
  lignes: VENTES_D_OCTOBRE.map((vente) => ({
    Date: dateExcel(2026, 10, vente.jour),
    Boutique: vente.boutique,
    Canal: vente.canal,
    Catégorie: vente.categorie,
    CA_HT: vente.ca,
    Cout_achat_HT: vente.cout,
  })),
};
const CLASSEUR: Classeur = { [ONGLET]: VENTES };

const DOSSIER = cheminDuClasseur('b1-03');
async function ecrireLeClasseur(): Promise<void> {
  ecrireLeFichierServi(
    DOSSIER,
    BASE,
    await octetsDUnClasseur(CLASSEUR, EXPORT),
    'xlsx',
  );
}

function tcdRelu(onglet: OngletCanonique) {
  const rang = (colonne: string): number => onglet.colonnes.indexOf(colonne);
  const somme = (canal: string | null, colonne: string): number =>
    onglet.lignes
      .filter((ligne) => canal === null || ligne[rang('Canal')] === canal)
      .reduce((total, ligne) => total + Number(ligne[rang(colonne)]), 0);
  return [...CANAUX, null].map((canal) => ({
    canal: canal ?? 'Total général',
    ca: somme(canal, 'CA_HT'),
    cout: somme(canal, 'Cout_achat_HT'),
  }));
}

describe('B1-03 — le classeur des ventes d’octobre', () => {
  beforeAll(async () => {
    if (process.env.ECRIRE_CLASSEURS === '1') {
      await ecrireLeClasseur();
    }
  }, DELAI_MS);

  it(
    'B103-M3 · sert un classeur nommé d’après ses octets, que le générateur récrit à l’identique',
    async () => {
      const octets = await octetsDUnClasseur(CLASSEUR, EXPORT);

      expect(empreinteDuFichier(cheminDuClasseur(CLASSEUR_DES_VENTES))).toBe(
        empreinteDe(octets),
      );
      expect(CLASSEUR_DES_VENTES).toBe(
        `b1-03/${nomServiDe(BASE, octets, 'xlsx')}`,
      );
      expect(readdirSync(DOSSIER)).toEqual([CLASSEUR_DES_VENTES.split('/')[1]]);
    },
    DELAI_MS,
  );

  it(
    'B103-M3 · relit les ventes du générateur, ligne à ligne',
    async () => {
      const relu = await relireClasseur(cheminDuClasseur(CLASSEUR_DES_VENTES));

      expect(Object.keys(relu)).toEqual([ONGLET]);
      expect(relu[ONGLET]).toEqual(ongletCanonique(VENTES));
      expect(relu[ONGLET].lignes).toHaveLength(NOMBRE_DE_VENTES);
    },
    DELAI_MS,
  );

  it(
    'B103-M4 · retrouve dans le classeur relu les sommes par canal que le cours attend du TCD',
    async () => {
      const relu = await relireClasseur(cheminDuClasseur(CLASSEUR_DES_VENTES));

      expect(tcdRelu(relu[ONGLET])).toEqual(
        [...TCD_DES_CANAUX, TOTAL_GENERAL].map(({ canal, ca, cout }) => ({
          canal,
          ca,
          cout,
        })),
      );
    },
    DELAI_MS,
  );
});
