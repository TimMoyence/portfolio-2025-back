import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { InsertB2CoursV31789893879954 } from '../src/migrations/1789893879954-InsertB2CoursV3';
import { B2_COURS_V3 } from '../src/migrations/data/b2-v3.cours';
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
import { deroulePresentateur } from '../src/modules/formations/domain/cours/DeroulePresentateur';
import { evaluerFeuille } from '../src/modules/formations/domain/cours/Formule';
import { projeterCatalogue } from '../src/modules/formations/domain/cours/Diffusion';
import { ouvrirTirages } from '../src/modules/formations/domain/cours/OuvertureTirages';
import { verifierStructure } from '../src/modules/formations/domain/cours/StructureCours';
import { tirer } from '../src/modules/formations/domain/cours/Tirage';
import { tireurSequentiel } from './factories/cours.factory';
import { buildBareme } from './factories/formation.factory';
import { describeDb } from './helpers/db-integration-datasource';
import {
  DELAI_OUVERTURE_CONTEXTE_MS,
  ouvrirContexteFormations,
  type ContexteFormations,
} from './helpers/formations-db';
import { empreinte } from './helpers/portrait-tirages-b2';

const GRAINE_DE_REFERENCE = 0;
const FORMATEUR = 'a1111111-1111-4111-8111-111111111111';
const INSTANTANE = JSON.parse(
  readFileSync(
    join(__dirname, 'fixtures/formations/b2-01-v3.instantane.json'),
    'utf8',
  ),
) as { readonly empreinte: string };

describeDb('contenu V3 du B2-01 en base', () => {
  let contexte: ContexteFormations;
  let cours: Cours;

  const comptesDeLaV3 = async (): Promise<{
    cours: number;
    ecrans: number;
  }> => {
    const [{ cours: nombreDeCours, ecrans }]: {
      cours: number;
      ecrans: number;
    }[] = await contexte.dataSource.query(
      `SELECT COUNT(DISTINCT "cours"."id")::int AS "cours",
              COUNT("ecran"."id")::int AS "ecrans"
       FROM "formation_course_contents" AS "cours"
       LEFT JOIN "formation_screen_contents" AS "ecran" ON "ecran"."course_id" = "cours"."id"
       WHERE "cours"."slug" = $1 AND "cours"."version" = 3`,
      [B2_COURS_V3.slug],
    );
    return { cours: nombreDeCours, ecrans };
  };

  beforeAll(async () => {
    contexte = await ouvrirContexteFormations();
    const lu = await contexte.catalogue.trouver(B2_COURS_V3.slug, 3);
    if (lu === null) {
      throw new Error(
        'la migration InsertB2CoursV3 n’a pas posé la version 3 du B2-01',
      );
    }
    cours = lu;
  }, DELAI_OUVERTURE_CONTEXTE_MS);

  afterAll(async () => contexte.fermer());

  it('relit les 52 écrans avec leur titre public et leur diffusion', () => {
    expect(cours.ecrans).toHaveLength(52);
    expect(cours.dureeMinutes).toBe(210);
    expect(cours.ecrans.filter((ecran) => ecran.titre === null)).toEqual([]);
    expect(
      cours.ecrans.filter((ecran) => ecran.diffusion === 'catalogue'),
    ).toHaveLength(13);
  });

  it('relit les 38 remédiations et les 5 médias persistés en jsonb', () => {
    expect(cours.remediations).toEqual(B2_COURS_V3.remediations);
    expect(cours.medias).toEqual(B2_COURS_V3.medias);
  });

  it('ne lève aucune violation de structure sur le cours relu de la base', () => {
    expect(verifierStructure(cours)).toEqual([]);
  });

  it('ouvre un barème v2 et sert le même instantané que le fichier livré', () => {
    const bareme = ouvrirTirages(cours, tireurSequentiel(1), 3);

    expect(bareme.version).toBe(2);
    expect(bareme.tirages).toHaveLength(60);
    expect(
      empreinte({
        sujet: tirer(cours, GRAINE_DE_REFERENCE).sujet,
        deroule: deroulePresentateur(cours, GRAINE_DE_REFERENCE),
        catalogue: projeterCatalogue(cours),
      }),
    ).toBe(INSTANTANE.empreinte);
  });

  function corrigeDe(id: string): CorrigeProduction | undefined {
    const question = questionsDuCours(cours).find(
      (candidate) => candidate.id === id,
    );
    return question?.type === 'feuille' || question?.type === 'tableau'
      ? question.corrige
      : undefined;
  }

  function corrigeDeLaFeuille(): CorrigeFeuille {
    const corrige = corrigeDe('b2-01-a4-feuille-canaux');
    if (corrige?.type !== 'feuille') {
      throw new Error('la feuille A4-02 n’a pas été relue de la base');
    }
    return corrige;
  }

  function corrigeDuTableau(): CorrigeTableau {
    const corrige = corrigeDe('b2-01-a4-indice-toile');
    if (corrige?.type !== 'tableau') {
      throw new Error('le tableau A4-05 n’a pas été relu de la base');
    }
    return corrige;
  }

  it('recalcule depuis la base les 17 valeurs du corrigé de A4-02 (AC-11)', () => {
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

    expect(corrige.attendus).toHaveLength(17);
    for (const attendu of corrige.attendus) {
      expect(
        resultats.get(attendu.reference)?.valeur ?? Number.NaN,
      ).toBeCloseTo(attendu.valeur, 5);
    }
  });

  it('corrige les deux productions relues de la base sans aucune cellule à revoir', () => {
    const feuille = corrigeDeLaFeuille();
    const tableau = corrigeDuTableau();
    const saisies = [0, 1, 2, 3].map((rang) =>
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

    expect(surFeuille.verdicts.filter((cellule) => !cellule.juste)).toEqual([]);
    expect(surTableau.verdicts.filter((ligne) => !ligne.juste)).toEqual([]);
    expect([surFeuille.correcte, surTableau.correcte]).toEqual([true, true]);
  });

  it('refuse en base une diffusion hors catalogue et séance', async () => {
    const [{ id }]: { id: string }[] = await contexte.dataSource.query(
      `SELECT "id" FROM "formation_course_contents" WHERE "slug" = $1 AND "version" = 3`,
      [B2_COURS_V3.slug],
    );

    await expect(
      contexte.dataSource.query(
        `INSERT INTO "formation_screen_contents"
           ("course_id", "position", "screen_id", "titre", "diffusion", "brique", "duree_minutes", "concepts", "notes", "proprietes")
         VALUES ($1, 99, 'B2-01-A9-99-DIFFUSION', 'Diffusion inconnue', 'partout', 'fp-quote', 1, '["proportion"]'::jsonb, 'Action : projeter.', '{}'::jsonb)`,
        [id],
      ),
    ).rejects.toThrow('chk_formation_screen_diffusion');
  });

  it('ne duplique rien quand la migration InsertB2CoursV3 est rejouée', async () => {
    const runner = contexte.dataSource.createQueryRunner();
    try {
      await new InsertB2CoursV31789893879954().up(runner);
    } finally {
      await runner.release();
    }

    expect(await comptesDeLaV3()).toEqual({ cours: 1, ecrans: 52 });
  });

  it('refuse le retour arrière tant qu’une séance sert la version 3', async () => {
    const seance = await contexte.sessions.create({
      courseSlug: B2_COURS_V3.slug,
      courseVersion: 3,
      teacherId: FORMATEUR,
      code: '4821',
      bareme: buildBareme(),
    });
    const runner = contexte.dataSource.createQueryRunner();

    try {
      await expect(
        new InsertB2CoursV31789893879954().down(runner),
      ).rejects.toThrow('utilise par une seance');
    } finally {
      await runner.release();
      await contexte.dataSource.query(
        'DELETE FROM formation_sessions WHERE id = $1',
        [seance.id],
      );
    }

    expect(await comptesDeLaV3()).toEqual({ cours: 1, ecrans: 52 });
  });
});
