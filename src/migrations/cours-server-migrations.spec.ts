import type { QueryRunner } from 'typeorm';
import { AddFormationCourseVersion1779550000000 } from './1779550000000-AddFormationCourseVersion';
import { AddFormationSessionCourseVersion1780050000000 } from './1780050000000-AddFormationSessionCourseVersion';
import { SeedB2PresentationNotes1780060000000 } from './1780060000000-SeedB2PresentationNotes';
import { VersionFormationCourseContent1780100000000 } from './1780100000000-VersionFormationCourseContent';
import { AmorcerPublicationsDeCours1789871600000 } from './1789871600000-AmorcerPublicationsDeCours';
import { NotesFormateurFacultatives1790300000000 } from './1790300000000-NotesFormateurFacultatives';

function runner(
  query: jest.Mock = jest.fn().mockResolvedValue(undefined),
): QueryRunner {
  return { query } as unknown as QueryRunner;
}

describe('amorcage des publications de cours', () => {
  it('ne depublie au retour arriere que les lignes qu aucun administrateur n a posees', async () => {
    const query = jest.fn().mockResolvedValue(undefined);

    await new AmorcerPublicationsDeCours1789871600000().down(runner(query));

    const [[sql]] = query.mock.calls as [string][];
    expect(sql).toContain('DELETE FROM "formation_course_publications"');
    expect(sql).toContain('WHERE "publiee_par" IS NULL');
  });
});

describe('schéma du contenu de cours servi par le serveur', () => {
  it('applique et annule les contraintes de version et d immutabilité', async () => {
    const query = jest.fn().mockResolvedValue(undefined);
    const migrations = [
      new AddFormationCourseVersion1779550000000(),
      new AddFormationSessionCourseVersion1780050000000(),
      new VersionFormationCourseContent1780100000000(),
    ];
    for (const migration of migrations) {
      await migration.up(runner(query));
      await migration.down(runner(query));
    }

    expect(query).toHaveBeenCalled();
    expect(
      query.mock.calls.some(([sql]) => String(sql).includes('CREATE TRIGGER')),
    ).toBe(true);
  });

  it('pose et retire la contrainte des notes non vides, sans toucher aux données', async () => {
    const query = jest.fn().mockResolvedValue(undefined);
    const notes = new SeedB2PresentationNotes1780060000000();

    await notes.up(runner(query));
    await notes.down(runner(query));

    expect(query.mock.calls.map(([sql]) => String(sql))).toEqual([
      expect.stringContaining(
        'ADD CONSTRAINT "chk_formation_screen_notes_not_blank"',
      ),
      expect.stringContaining(
        'DROP CONSTRAINT "chk_formation_screen_notes_not_blank"',
      ),
    ]);
  });

  it('admet une note absente mais refuse toujours une note faite de blancs', async () => {
    const query = jest.fn().mockResolvedValue(undefined);
    const notes = new NotesFormateurFacultatives1790300000000();

    await notes.up(runner(query));
    await notes.down(runner(query));

    expect(query.mock.calls.map(([sql]) => String(sql))).toEqual([
      expect.stringContaining(
        'DROP CONSTRAINT "chk_formation_screen_notes_not_blank"',
      ),
      expect.stringContaining(
        `ADD CONSTRAINT "chk_formation_screen_notes_absentes_ou_renseignees" CHECK ("notes" = '' OR "notes" ~ '[^[:space:]]')`,
      ),
      expect.stringContaining(
        'DROP CONSTRAINT "chk_formation_screen_notes_absentes_ou_renseignees"',
      ),
      expect.stringMatching(
        /ADD CONSTRAINT "chk_formation_screen_notes_not_blank" CHECK \(length\(btrim\("notes"\)\) > 0\) NOT VALID$/,
      ),
    ]);
  });
});
