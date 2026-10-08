import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  classeursPublies,
  datesSansFormatDeDate,
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
const DOSSIER_D_ESSAI = join(RACINE, '.tmp/b3-01/ecriture');
const DOSSIER_DE_REECRITURE = join(RACINE, '.tmp/b3-01/reecriture');
const DELAI_D_ECRITURE_MS = 120_000;
const LONGUEUR_DU_SUFFIXE = 8;

const jeu = genererJeuB301(GRAINE_B3_01);
const publies = classeursPublies(jeu);
const fichierPublie = (publie: ClasseurAPublier): string =>
  lireLeManifeste(DOSSIER_DES_CLASSEURS).classeurs.find(
    ({ role }) => role === publie.role,
  )?.fichier ?? '';
const cheminDe = (publie: ClasseurAPublier): string =>
  join(DOSSIER_DES_CLASSEURS, fichierPublie(publie));
const nomAttendu = (base: string, empreinte: string): string =>
  `${base}.${empreinte.slice(0, LONGUEUR_DU_SUFFIXE)}.xlsx`;
const classeursDuDossier = (dossier: string): Set<string> =>
  new Set(readdirSync(dossier).filter((nom) => nom.endsWith('.xlsx')));

describe('classeurs du B3-01', () => {
  beforeAll(async () => {
    if (process.env.ECRIRE_CLASSEURS === '1') {
      await ecrireLesClasseurs(jeu, DOSSIER_DES_CLASSEURS);
    }
    if (process.env.ECRIRE_CORRIGE === '1') {
      await ecrireLeCorrigeFormateur(jeu, CORRIGE_FORMATEUR);
    }
  }, DELAI_D_ECRITURE_MS);

  it('publie les classeurs sous les noms que sert le cours, chacun suffixé des huit premiers caractères de l’empreinte de ses octets', () => {
    const { classeurs } = lireLeManifeste(DOSSIER_DES_CLASSEURS);

    for (const publie of publies) {
      expect(fichierPublie(publie)).toBe(
        nomAttendu(publie.base, empreinteDuFichier(cheminDe(publie))),
      );
    }
    expect(
      Object.fromEntries(
        classeurs.map(({ role, fichier }) => [
          role,
          `/assets/cours/b3-01/${fichier}`,
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
        fichier: fichierPublie(publie),
        empreinte: empreinteDuFichier(cheminDe(publie)),
        onglets: publie.onglets,
      })),
    );
  });

  it('ne garde parmi les fixtures aucun classeur hors du manifeste', () => {
    expect(classeursDuDossier(DOSSIER_DES_CLASSEURS)).toEqual(
      new Set(publies.map(fichierPublie)),
    );
  });

  it(
    'nomme chaque classeur écrit d’après ses octets et retire ceux d’une écriture précédente',
    async () => {
      rmSync(DOSSIER_D_ESSAI, { recursive: true, force: true });
      mkdirSync(DOSSIER_D_ESSAI, { recursive: true });
      const perime = 'B3-01_export_ventes.00000000.xlsx';
      writeFileSync(join(DOSSIER_D_ESSAI, perime), '');

      await ecrireLesClasseurs(jeu, DOSSIER_D_ESSAI);
      const { classeurs } = lireLeManifeste(DOSSIER_D_ESSAI);

      expect(classeursDuDossier(DOSSIER_D_ESSAI)).toEqual(
        new Set(classeurs.map(({ fichier }) => fichier)),
      );
      for (const { fichier, empreinte } of classeurs) {
        expect(empreinteDuFichier(join(DOSSIER_D_ESSAI, fichier))).toBe(
          empreinte,
        );
        expect(fichier).toMatch(
          new RegExp(`\\.${empreinte.slice(0, LONGUEUR_DU_SUFFIXE)}\\.xlsx$`),
        );
      }
      rmSync(DOSSIER_D_ESSAI, { recursive: true, force: true });
    },
    DELAI_D_ECRITURE_MS,
  );

  it(
    'récrit le même jeu octet pour octet, sous les noms déjà publiés, quelle que soit l’heure de l’écriture',
    async () => {
      rmSync(DOSSIER_DE_REECRITURE, { recursive: true, force: true });

      await ecrireLesClasseurs(jeu, DOSSIER_DE_REECRITURE);

      expect(lireLeManifeste(DOSSIER_DE_REECRITURE)).toEqual(
        lireLeManifeste(DOSSIER_DES_CLASSEURS),
      );
      rmSync(DOSSIER_DE_REECRITURE, { recursive: true, force: true });
    },
    DELAI_D_ECRITURE_MS,
  );

  it.each(publies.map((publie) => [publie.role, publie] as const))(
    'écrit dans %s chaque date en vraie date, au format jj/mm/aaaa ou au mois',
    async (_role, publie) => {
      expect(
        await datesSansFormatDeDate(cheminDe(publie), publie.classeur),
      ).toEqual([]);
    },
  );

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
