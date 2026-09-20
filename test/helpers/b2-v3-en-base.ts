import { B2_COURS_V3 } from '../../src/migrations/data/b2-v3.cours';
import type { DataSource } from 'typeorm';

export async function insererB2V3(dataSource: DataSource): Promise<string> {
  const [{ id }]: { id: string }[] = await dataSource.query(
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
    await dataSource.query(
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
