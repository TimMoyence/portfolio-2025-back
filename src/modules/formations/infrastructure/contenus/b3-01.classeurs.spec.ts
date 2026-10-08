import { join } from 'node:path';
import {
  classeursPublies,
  ecrireLesClasseurs,
  empreinteDuFichier,
  lireLeManifeste,
  ongletCanonique,
  ouvrirClasseur,
  relireClasseur,
  type ClasseurAPublier,
} from '../../../../../test/helpers/cours-b3-01/classeurs';
import {
  colonnesCalculeesDuGenerateur,
  ecrireLeCorrigeFormateur,
  lireLeCorrigeRecalcule,
} from '../../../../../test/helpers/cours-b3-01/corrige';
import {
  GRAINE_B3_01,
  genererJeuB301,
} from '../../../../../test/helpers/cours-b3-01/generateur';
import { CLASSEURS_B3_01, VALEURS_B3_01 } from './b3-01.donnees';

const RACINE = join(__dirname, '../../../../..');
const DOSSIER_DES_CLASSEURS = join(RACINE, 'test/fixtures/formations/b3-01');
const CORRIGE_FORMATEUR = join(
  RACINE,
  '.tmp/b3-01/B3-01_corrige_formateur.xlsx',
);
const DELAI_D_ECRITURE_MS = 120_000;

const jeu = genererJeuB301(GRAINE_B3_01);
const publies = classeursPublies(jeu);
const cheminDe = (publie: ClasseurAPublier): string =>
  join(DOSSIER_DES_CLASSEURS, publie.fichier);

describe('classeurs du B3-01', () => {
  beforeAll(async () => {
    if (process.env.ECRIRE_CLASSEURS === '1') {
      await ecrireLesClasseurs(jeu, DOSSIER_DES_CLASSEURS);
      await ecrireLeCorrigeFormateur(jeu, CORRIGE_FORMATEUR);
    }
  }, DELAI_D_ECRITURE_MS);

  it('publie les classeurs sous les noms que sert le cours, chacun suffixé de son empreinte', () => {
    expect(
      Object.fromEntries(
        publies.map((publie) => [
          publie.role,
          `/assets/cours/b3-01/${publie.fichier}`,
        ]),
      ),
    ).toEqual(CLASSEURS_B3_01);
    expect(CLASSEURS_B3_01.brut).toMatch(
      /^\/assets\/cours\/b3-01\/B3-01_export_ventes\.[0-9a-f]{8}\.xlsx$/,
    );
    expect(CLASSEURS_B3_01.repriseActe2).toMatch(
      /^\/assets\/cours\/b3-01\/B3-01_reprise_acte_2\.[0-9a-f]{8}\.xlsx$/,
    );
    expect(CLASSEURS_B3_01.repriseActe3).toMatch(
      /^\/assets\/cours\/b3-01\/B3-01_reprise_acte_3\.[0-9a-f]{8}\.xlsx$/,
    );
  });

  it.each(publies.map((publie) => [publie.role, publie] as const))(
    'relit %s à l’identique du générateur, onglet par onglet, dates comprises',
    async (_role, publie) => {
      const relu = await relireClasseur(cheminDe(publie));

      expect(Object.keys(relu)).toEqual(Object.keys(publie.classeur));
      for (const [nom, onglet] of Object.entries(publie.classeur)) {
        expect(relu[nom]).toEqual(ongletCanonique(onglet));
      }
    },
  );

  it('porte au manifeste l’empreinte de chaque fichier et de chaque onglet', () => {
    const manifeste = lireLeManifeste(DOSSIER_DES_CLASSEURS);

    expect(manifeste.graine).toBe(GRAINE_B3_01);
    expect(manifeste.classeurs).toEqual(
      publies.map((publie) => ({
        role: publie.role,
        fichier: publie.fichier,
        empreinte: empreinteDuFichier(cheminDe(publie)),
        onglets: publie.onglets,
      })),
    );
  });

  it('fige la ligne d’en-tête de chaque onglet', async () => {
    for (const publie of publies) {
      const classeur = await ouvrirClasseur(cheminDe(publie));

      for (const feuille of classeur.worksheets) {
        expect(feuille.views).toEqual([
          expect.objectContaining({ state: 'frozen', ySplit: 1 }),
        ]);
      }
    }
  });

  it('structure les commandes de la reprise de l’acte 3 en tableau T_Commandes', async () => {
    const reprise3 = publies.find((publie) => publie.role === 'repriseActe3');
    if (reprise3 === undefined) {
      throw new Error('Reprise de l’acte 3 absente');
    }
    const classeur = await ouvrirClasseur(cheminDe(reprise3));
    const commandes = classeur.getWorksheet('Commandes');
    const lignes = reprise3.classeur.Commandes.lignes.length;

    expect(plageRelue(commandes?.getTable('T_Commandes') ?? {})).toBe(
      `A1:U${lignes + 1}`,
    );
  });
});

function plageRelue(tableau: object): unknown {
  return 'table' in tableau &&
    typeof tableau.table === 'object' &&
    tableau.table !== null &&
    'tableRef' in tableau.table
    ? tableau.table.tableRef
    : undefined;
}

const CORRIGE_RECALCULE_PAR_EXCEL = process.env.CORRIGE_RECALCULE_PAR_EXCEL;

(CORRIGE_RECALCULE_PAR_EXCEL === undefined ? describe.skip : describe)(
  'corrigé formateur recalculé par Microsoft Excel',
  () => {
    const chemin = CORRIGE_RECALCULE_PAR_EXCEL ?? '';

    it('rend chaque valeur attendue du § 5.1 avec les formules enseignées', async () => {
      const recalcule = await lireLeCorrigeRecalcule(chemin);

      expect(recalcule.valeurs).toEqual(VALEURS_B3_01);
    });

    it('calcule les colonnes de la reprise de l’acte 3 comme le générateur, ligne par ligne', async () => {
      const recalcule = await lireLeCorrigeRecalcule(chemin);

      expect(recalcule.colonnesCalculees).toEqual(
        colonnesCalculeesDuGenerateur(jeu),
      );
    });
  },
);
