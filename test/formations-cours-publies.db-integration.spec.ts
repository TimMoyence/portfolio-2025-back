import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Cours } from '../src/modules/formations/domain/contrats/cours';
import type {
  CorrigeFeuille,
  CorrigeProduction,
  CorrigeTableau,
} from '../src/modules/formations/domain/cours/Corrige';
import {
  corrigerFeuille,
  corrigerTableau,
} from '../src/modules/formations/domain/cours/CorrectionProduction';
import { questionsDuCours } from '../src/modules/formations/domain/cours/Cours';
import type { ContenuDeCours } from '../src/modules/formations/domain/cours/CoursStocke';
import { deroulePresentateur } from '../src/modules/formations/domain/cours/DeroulePresentateur';
import { projeterCatalogue } from '../src/modules/formations/domain/cours/Diffusion';
import { empreinteCanonique } from '../src/modules/formations/domain/cours/EmpreinteCanonique';
import { evaluerFeuille } from '../src/modules/formations/domain/cours/Formule';
import { ouvrirTirages } from '../src/modules/formations/domain/cours/OuvertureTirages';
import { verifierStructure } from '../src/modules/formations/domain/cours/StructureCours';
import { tirer } from '../src/modules/formations/domain/cours/Tirage';
import { COURS_B2_01 } from '../src/modules/formations/infrastructure/contenus/b2-01.cours';
import { COURS_B2_02 } from '../src/modules/formations/infrastructure/contenus/b2-02.cours';
import { prefixeDuCours } from './factories/contenus-de-cours.factory';
import { tireurSequentiel } from './factories/cours.factory';
import { describeDb } from './helpers/db-integration-datasource';
import {
  DELAI_OUVERTURE_CONTEXTE_MS,
  ouvrirContexteFormations,
  type ContexteFormations,
} from './helpers/formations-db';

const GRAINE_DE_REFERENCE = 0;

interface AttenduDuCours {
  readonly contenu: ContenuDeCours;
  readonly cellulesDeLaFeuille: number;
}

const COURS_PUBLIES: readonly AttenduDuCours[] = [
  { contenu: COURS_B2_01, cellulesDeLaFeuille: 17 },
  { contenu: COURS_B2_02, cellulesDeLaFeuille: 9 },
];

function instantaneDe(contenu: ContenuDeCours): { readonly empreinte: string } {
  return JSON.parse(
    readFileSync(
      join(
        __dirname,
        `fixtures/formations/${prefixeDuCours(contenu).toLowerCase()}.instantane.json`,
      ),
      'utf8',
    ),
  ) as { readonly empreinte: string };
}

for (const { contenu, cellulesDeLaFeuille } of COURS_PUBLIES) {
  const prefixe = prefixeDuCours(contenu);

  describeDb(`cours ${prefixe} publié en base`, () => {
    let contexte: ContexteFormations;
    let cours: Cours;

    beforeAll(async () => {
      contexte = await ouvrirContexteFormations();
      const publie = await contexte.catalogue.trouverCourant(contenu.slug);
      if (publie === null) {
        throw new Error(`la synchronisation n’a pas publié le ${prefixe}`);
      }
      cours = publie.cours;
    }, DELAI_OUVERTURE_CONTEXTE_MS);

    afterAll(async () => contexte.fermer());

    function corrigesDesProductions(): CorrigeProduction[] {
      return questionsDuCours(cours).flatMap((question) =>
        question.type === 'feuille' || question.type === 'tableau'
          ? [question.corrige]
          : [],
      );
    }

    function corrigeDeLaFeuille(): CorrigeFeuille {
      const corrige = corrigesDesProductions().find(
        (candidat) => candidat.type === 'feuille',
      );
      if (corrige?.type !== 'feuille') {
        throw new Error(
          `la feuille du ${prefixe} n’a pas été relue de la base`,
        );
      }
      return corrige;
    }

    function corrigeDuTableau(): CorrigeTableau {
      const corrige = corrigesDesProductions().find(
        (candidat) => candidat.type === 'tableau',
      );
      if (corrige?.type !== 'tableau') {
        throw new Error(`le tableau du ${prefixe} n’a pas été relu de la base`);
      }
      return corrige;
    }

    it('relit tous les écrans du fichier, dans l’ordre, avec leur titre public', () => {
      expect(cours.ecrans.map((ecran) => ecran.id)).toEqual(
        contenu.ecrans.map((ecran) => ecran.screenId),
      );
      expect(cours.dureeMinutes).toBe(contenu.dureeMinutes);
      expect(cours.ecrans.filter((ecran) => ecran.titre === null)).toEqual([]);
    });

    it('relit les remédiations et les médias persistés en jsonb', () => {
      expect(cours.remediations).toEqual(contenu.remediations);
      expect(cours.medias).toEqual(contenu.medias);
    });

    it('ne lève aucune violation de structure sur le cours relu de la base', () => {
      expect(verifierStructure(cours)).toEqual([]);
    });

    it('ouvre un barème v2 et sert le même instantané que le fichier livré', () => {
      expect(ouvrirTirages(cours, tireurSequentiel(1)).version).toBe(2);
      expect(
        empreinteCanonique({
          sujet: tirer(cours, GRAINE_DE_REFERENCE).sujet,
          deroule: deroulePresentateur(cours, GRAINE_DE_REFERENCE),
          catalogue: projeterCatalogue(cours),
        }),
      ).toBe(instantaneDe(contenu).empreinte);
    });

    it('recalcule depuis la base chaque valeur du corrigé de la feuille (AC-11)', () => {
      const corrige = corrigeDeLaFeuille();
      const formules = Object.fromEntries(
        corrige.attendus.map((attendu) => [
          attendu.reference,
          attendu.formuleReference,
        ]),
      );

      const resultats = evaluerFeuille({
        lignes: corrige.plan.lignes,
        colonnes: corrige.plan.colonnes,
        cellules: { ...corrige.plan.cellules, ...formules },
      });

      expect(corrige.attendus).toHaveLength(cellulesDeLaFeuille);
      for (const attendu of corrige.attendus) {
        expect(
          resultats.get(attendu.reference)?.valeur ?? Number.NaN,
        ).toBeCloseTo(attendu.valeur, 5);
      }
    });

    it('corrige les deux productions relues de la base sans aucune cellule à revoir', () => {
      const feuille = corrigeDeLaFeuille();
      const tableau = corrigeDuTableau();
      const rangs = [
        ...new Set(tableau.attendus.map((attendu) => attendu.rang)),
      ];
      const saisies = rangs.map((rang) =>
        Object.fromEntries(
          tableau.attendus
            .filter((attendu) => attendu.rang === rang)
            .map((attendu) => [attendu.cle, attendu.valeur]),
        ),
      );

      const surFeuille = corrigerFeuille(
        feuille,
        Object.fromEntries(
          feuille.attendus.map((attendu) => [
            attendu.reference,
            attendu.formuleReference,
          ]),
        ),
      );
      const surTableau = corrigerTableau(tableau, saisies);

      expect(surFeuille.verdicts.filter((cellule) => !cellule.juste)).toEqual(
        [],
      );
      expect(surTableau.verdicts.filter((ligne) => !ligne.juste)).toEqual([]);
      expect([surFeuille.correcte, surTableau.correcte]).toEqual([true, true]);
    });

    it('refuse en base une diffusion hors catalogue et séance', async () => {
      const [{ id }]: { id: string }[] = await contexte.dataSource.query(
        `SELECT "id" FROM "formation_course_contents" WHERE "slug" = $1`,
        [contenu.slug],
      );

      await expect(
        contexte.dataSource.query(
          `INSERT INTO "formation_screen_contents"
           ("course_id", "position", "screen_id", "titre", "diffusion", "brique", "duree_minutes", "concepts", "notes", "proprietes")
         VALUES ($1, 99, $2, 'Diffusion inconnue', 'partout', 'fp-quote', 1, '["proportion"]'::jsonb, 'Action : projeter.', '{}'::jsonb)`,
          [id, `${prefixe}-A9-99-DIFFUSION`],
        ),
      ).rejects.toThrow('chk_formation_screen_diffusion');
    });
  });
}
