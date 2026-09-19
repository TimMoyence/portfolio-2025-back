import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { B2_COURS_V3 } from '../src/migrations/data/b2-v3.cours';
import type { Cours } from '../src/modules/formations/domain/contrats/cours';
import { deroulePresentateur } from '../src/modules/formations/domain/cours/DeroulePresentateur';
import { projeterCatalogue } from '../src/modules/formations/domain/cours/Diffusion';
import { ouvrirTirages } from '../src/modules/formations/domain/cours/OuvertureTirages';
import { verifierStructure } from '../src/modules/formations/domain/cours/StructureCours';
import { tirer } from '../src/modules/formations/domain/cours/Tirage';
import { tireurSequentiel } from './factories/cours.factory';
import { describeDb } from './helpers/db-integration-datasource';
import {
  DELAI_OUVERTURE_CONTEXTE_MS,
  ouvrirContexteFormations,
  type ContexteFormations,
} from './helpers/formations-db';
import { empreinte } from './helpers/portrait-tirages-b2';

const GRAINE_DE_REFERENCE = 0;
const INSTANTANE = JSON.parse(
  readFileSync(
    join(__dirname, 'fixtures/formations/b2-01-v3.instantane.json'),
    'utf8',
  ),
) as { readonly empreinte: string };

describeDb('contenu V3 du B2-01 en base', () => {
  let contexte: ContexteFormations;
  let cours: Cours;

  async function inserer(): Promise<string> {
    const [{ id }]: { id: string }[] = await contexte.dataSource.query(
      `INSERT INTO "formation_course_contents"
         ("slug", "version", "titre", "niveau", "duree_minutes", "concepts", "remediations", "medias")
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8::jsonb) RETURNING "id"`,
      [
        B2_COURS_V3.slug,
        B2_COURS_V3.version,
        B2_COURS_V3.titre,
        B2_COURS_V3.niveau,
        B2_COURS_V3.dureeMinutes,
        JSON.stringify(B2_COURS_V3.concepts),
        JSON.stringify(B2_COURS_V3.remediations),
        JSON.stringify(B2_COURS_V3.medias),
      ],
    );
    for (const [position, ecran] of B2_COURS_V3.ecrans.entries()) {
      await contexte.dataSource.query(
        `INSERT INTO "formation_screen_contents"
           ("course_id", "position", "screen_id", "titre", "diffusion", "brique", "duree_minutes", "concepts", "notes", "proprietes")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10::jsonb)`,
        [
          id,
          position,
          ecran.screenId,
          ecran.titre,
          ecran.diffusion,
          ecran.brique,
          ecran.dureeMinutes,
          JSON.stringify(ecran.concepts),
          ecran.notes,
          JSON.stringify(ecran.proprietes),
        ],
      );
    }
    return id;
  }

  beforeAll(async () => {
    contexte = await ouvrirContexteFormations();
    await inserer();
    const lu = await contexte.catalogue.trouver(B2_COURS_V3.slug, 3);
    if (lu === null) {
      throw new Error('la version 3 du B2-01 n’a pas été relue du catalogue');
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
});
