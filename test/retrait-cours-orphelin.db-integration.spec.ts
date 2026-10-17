import { RetireLeCoursOrphelin1792500000000 } from '../src/migrations/1792500000000-RetireLeCoursOrphelin';
import { buildBareme } from './factories/formation.factory';
import {
  baseMigreeDeLaSuite,
  describeDb,
  inscrireUtilisateur,
  jouerLaMigration,
  migrationsAnterieuresA,
} from './helpers/db-integration-datasource';

const ANCIEN_B2_02 = 'b2-02-serie-statistique-une-variable';
const B2_02_SERVI = 'b2-02-series-statistiques';

interface LignesDuCours {
  contenus: number;
  ecrans: number;
  publications: number;
  seances: number;
}

describeDb(
  'Retrait de l ancien B2-02, publie sans contenu dans le depot',
  () => {
    const base = baseMigreeDeLaSuite(
      [],
      migrationsAnterieuresA('1792500000000-RetireLeCoursOrphelin'),
    );

    const publier = async (slug: string): Promise<string> => {
      const [cours]: { id: string }[] = await base().query(
        `INSERT INTO "formation_course_contents" ("slug", "version", "titre", "niveau", "duree_minutes", "concepts")
       VALUES ($1, 1, 'Series statistiques', 'B2', 5, '["moyenne"]'::jsonb) RETURNING "id"`,
        [slug],
      );
      await base().query(
        `INSERT INTO "formation_screen_contents" ("course_id", "position", "screen_id", "brique", "duree_minutes", "concepts", "notes", "proprietes")
       VALUES ($1, 0, 'ECRAN-1', 'fp-story', 5, '["moyenne"]'::jsonb, '• Lancer', '{}'::jsonb),
              ($1, 1, 'ECRAN-2', 'fp-story', 5, '["moyenne"]'::jsonb, '• Conclure', '{}'::jsonb)`,
        [cours.id],
      );
      await base().query(
        `INSERT INTO "formation_course_publications" ("slug", "version_publiee") VALUES ($1, 1)`,
        [slug],
      );
      return cours.id;
    };

    const compter = async (sql: string, slug: string): Promise<number> => {
      const [{ n }]: { n: number }[] = await base().query(sql, [slug]);
      return n;
    };

    const lignesDu = async (slug: string): Promise<LignesDuCours> => ({
      contenus: await compter(
        `SELECT count(*)::int AS n FROM "formation_course_contents" WHERE "slug" = $1`,
        slug,
      ),
      ecrans: await compter(
        `SELECT count(*)::int AS n FROM "formation_screen_contents" e
       JOIN "formation_course_contents" c ON c."id" = e."course_id" WHERE c."slug" = $1`,
        slug,
      ),
      publications: await compter(
        `SELECT count(*)::int AS n FROM "formation_course_publications" WHERE "slug" = $1`,
        slug,
      ),
      seances: await compter(
        `SELECT count(*)::int AS n FROM "formation_sessions" WHERE "course_slug" = $1`,
        slug,
      ),
    });

    it('refuse de retirer l ancien B2-02 tant qu une seance en attente ou en cours le porte, sans rien retirer', async () => {
      await publier(ANCIEN_B2_02);
      const formateur = await inscrireUtilisateur(
        base(),
        'formateur-ancien@example.com',
        'teacher',
      );
      await base().query(
        `INSERT INTO "formation_sessions" ("course_slug", "teacher_id", "code", "etat", "bareme")
       VALUES ($1, $2, '4270', 'attente', $3), ($1, $2, '4269', 'en_cours', $3)`,
        [ANCIEN_B2_02, formateur, JSON.stringify(buildBareme())],
      );

      await expect(
        jouerLaMigration(
          base(),
          new RetireLeCoursOrphelin1792500000000(),
          'up',
        ),
      ).rejects.toThrow('2 seance(s) non terminee(s)');

      expect(await lignesDu(ANCIEN_B2_02)).toEqual({
        contenus: 1,
        ecrans: 2,
        publications: 1,
        seances: 2,
      });
      await base().query(
        `UPDATE "formation_sessions" SET "etat" = 'terminee', "fermee_le" = now() WHERE "course_slug" = $1`,
        [ANCIEN_B2_02],
      );
    });

    it('retire la publication, la version et les ecrans de l ancien B2-02, et garde le B2-02 servi et ses seances', async () => {
      await publier(B2_02_SERVI);
      const formateur = await inscrireUtilisateur(
        base(),
        'formateur@example.com',
        'teacher',
      );
      await base().query(
        `INSERT INTO "formation_sessions" ("course_slug", "teacher_id", "code", "bareme") VALUES ($1, $2, '4271', $3)`,
        [B2_02_SERVI, formateur, JSON.stringify(buildBareme())],
      );
      const avant = {
        ancien: await lignesDu(ANCIEN_B2_02),
        servi: await lignesDu(B2_02_SERVI),
      };

      await jouerLaMigration(
        base(),
        new RetireLeCoursOrphelin1792500000000(),
        'up',
      );

      const servi = { contenus: 1, ecrans: 2, publications: 1, seances: 1 };
      expect(avant).toEqual({
        ancien: { contenus: 1, ecrans: 2, publications: 1, seances: 2 },
        servi,
      });
      expect({
        ancien: await lignesDu(ANCIEN_B2_02),
        servi: await lignesDu(B2_02_SERVI),
      }).toEqual({
        ancien: { contenus: 0, ecrans: 0, publications: 0, seances: 2 },
        servi,
      });
    });

    it('laisse immuables les versions publiees qui restent', async () => {
      await expect(
        base().query(
          `DELETE FROM "formation_screen_contents" WHERE "course_id" IN
           (SELECT "id" FROM "formation_course_contents" WHERE "slug" = $1)`,
          [B2_02_SERVI],
        ),
      ).rejects.toThrow('version publiée immuable');
      await expect(
        base().query(
          `UPDATE "formation_course_contents" SET "titre" = 'Retouche' WHERE "slug" = $1`,
          [B2_02_SERVI],
        ),
      ).rejects.toThrow('version publiée immuable');
    });

    it('refuse de republier l ancien B2-02 au retour arriere', async () => {
      await expect(
        new RetireLeCoursOrphelin1792500000000().down(),
      ).rejects.toThrow(/definitif/);
      expect(await lignesDu(ANCIEN_B2_02)).toEqual({
        contenus: 0,
        ecrans: 0,
        publications: 0,
        seances: 2,
      });
    });
  },
);
