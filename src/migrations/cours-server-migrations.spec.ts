import type { MigrationInterface, QueryRunner } from 'typeorm';
import { B2_VISUAL_SNAPSHOT } from './data/b2-visual.snapshot';
import { SeedB2StoryboardLots1231779200000 } from './1779200000000-SeedB2StoryboardLots123';
import { AlignB2SessionDeck1779300000000 } from './1779300000000-AlignB2SessionDeck';
import { AddFormationCourseVersion1779550000000 } from './1779550000000-AddFormationCourseVersion';
import { BackfillB2OpenSessionBaremes1779600000000 } from './1779600000000-BackfillB2OpenSessionBaremes';
import { AlignB2ParticipantSeeds1779700000000 } from './1779700000000-AlignB2ParticipantSeeds';
import { RecheckB2ParticipantSeeds1779800000000 } from './1779800000000-RecheckB2ParticipantSeeds';
import { SeedB2PresentationContent1779900000000 } from './1779900000000-SeedB2PresentationContent';
import { CleanB2PlaceholderContent1780000000000 } from './1780000000000-CleanB2PlaceholderContent';
import { AddFormationSessionCourseVersion1780050000000 } from './1780050000000-AddFormationSessionCourseVersion';
import { SeedB2PresentationNotes1780060000000 } from './1780060000000-SeedB2PresentationNotes';
import { VersionFormationCourseContent1780100000000 } from './1780100000000-VersionFormationCourseContent';
import { PublishB2VisualDeck1780200000000 } from './1780200000000-PublishB2VisualDeck';

function runner(
  query: jest.Mock = jest.fn().mockResolvedValue(undefined),
): QueryRunner {
  return { query } as unknown as QueryRunner;
}

const MIGRATIONS_DE_DONNEES_IRREVERSIBLES: readonly MigrationInterface[] = [
  new SeedB2StoryboardLots1231779200000(),
  new AlignB2SessionDeck1779300000000(),
  new BackfillB2OpenSessionBaremes1779600000000(),
  new AlignB2ParticipantSeeds1779700000000(),
  new RecheckB2ParticipantSeeds1779800000000(),
];

describe('migrations de données B2 irréversibles', () => {
  it.each(
    MIGRATIONS_DE_DONNEES_IRREVERSIBLES.map(
      (migration) => [migration.name, migration] as const,
    ),
  )(
    '%s refuse son retour arrière sans toucher à la base',
    async (_nom, migration) => {
      const query = jest.fn().mockResolvedValue(undefined);

      await expect(migration.down(runner(query))).rejects.toThrow(
        /^Migration de données irréversible/,
      );
      expect(query).not.toHaveBeenCalled();
    },
  );
});

describe('migrations du contenu B2 servi par le serveur', () => {
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

  it('publie les notes des 72 écrans et nettoie les placeholders', async () => {
    const rows = B2_VISUAL_SNAPSHOT.map(({ screenId }) => ({
      screen_id: screenId,
      proprietes: { guide: { aDire: 'À dire' } },
    }));
    const notesQuery = jest
      .fn()
      .mockImplementation((sql: string) =>
        sql.startsWith('SELECT')
          ? Promise.resolve(rows)
          : Promise.resolve(undefined),
      );
    const notes = new SeedB2PresentationNotes1780060000000();
    await notes.up(runner(notesQuery));
    await notes.down(runner(notesQuery));
    expect(notesQuery).toHaveBeenCalledTimes(76);

    const placeholders = new CleanB2PlaceholderContent1780000000000();
    const placeholderQuery = jest.fn().mockResolvedValue(undefined);
    await placeholders.up(runner(placeholderQuery));
    await placeholders.down(runner(placeholderQuery));
    expect(placeholderQuery).toHaveBeenCalledTimes(2);
  });

  it('rejoue le seed de présentation version 1', async () => {
    const query = jest.fn().mockResolvedValue(undefined);
    const migration = new SeedB2PresentationContent1779900000000();

    await migration.up(runner(query));
    await migration.down(runner(query));

    expect(query).toHaveBeenCalledTimes(73);
  });

  it('publie le deck visuel complet et refuse une suppression utilisée', async () => {
    const screens = B2_VISUAL_SNAPSHOT.map((visual) => ({
      position: visual.position,
      screen_id: visual.screenId,
      brique: 'fp-quote',
      duree_minutes: 5,
      concepts: ['proportion'],
      notes: 'Note',
      proprietes: {},
    }));
    const query = jest.fn().mockImplementation((sql: string) => {
      if (sql.includes('version" = 1')) return Promise.resolve([{ id: 'v1' }]);
      if (sql.includes('FROM "formation_screen_contents"'))
        return Promise.resolve(screens);
      if (sql.startsWith('INSERT INTO "formation_course_contents"'))
        return Promise.resolve([{ id: 'v2' }]);
      if (sql.includes('COUNT(*)')) return Promise.resolve([{ count: 0 }]);
      return Promise.resolve(undefined);
    });
    const migration = new PublishB2VisualDeck1780200000000();

    await migration.up(runner(query));
    await migration.down(runner(query));
    expect(
      query.mock.calls.filter(([sql]) =>
        String(sql).startsWith('INSERT INTO "formation_screen_contents"'),
      ),
    ).toHaveLength(72);

    const used = jest.fn().mockResolvedValue([{ count: 1 }]);
    await expect(migration.down(runner(used))).rejects.toThrow(
      'contenu utilisé par une séance',
    );
  });
});
