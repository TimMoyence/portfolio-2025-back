import type { QueryRunner } from 'typeorm';
import { PasseLesEditionsDAvantEnTexteSuivi1794387735739 } from './1794387735739-PasseLesEditionsDAvantEnTexteSuivi';

const ANCIENNE = {
  id: 'a1',
  sections: [{ id: 'radar', kind: 'radar', items: [] }],
  sources: [
    {
      name: 'Source',
      url: 'https://ex.fr/a',
      published_at: null,
      retrieved_at: null,
    },
  ],
  provenance: {
    run_id: 'morning-brief-2026-11-08-fr',
    edition_date: '2026-11-08',
    item_count: 3,
    source_count: 2,
    content_sha256: 'f'.repeat(64),
  },
};
const REFONDUE = {
  id: 'a2',
  sections: [{ kind: 'edito', texte: 'E', signature: 'Tim' }],
  sources: [{ nom: 'Source', url: 'https://ex.fr/b', publie_le: null }],
  provenance: {
    run_id: 'r',
    edition_date: '2026-11-11',
    content_sha256: 'e'.repeat(64),
  },
};

function runner(lignes: unknown[]) {
  const query = jest.fn((sql: string) =>
    Promise.resolve(sql.startsWith('SELECT') ? lignes : undefined),
  );
  return { query, runner: { query } as unknown as QueryRunner };
}

describe('MB-20 · les éditions d avant la refonte passent en texte suivi', () => {
  it('MB-20 · vide les sections, renomme les sources et retire les compteurs, sans rien inventer', async () => {
    const { query, runner: qr } = runner([ANCIENNE, REFONDUE]);

    await new PasseLesEditionsDAvantEnTexteSuivi1794387735739().up(qr);

    const miseAJour = query.mock.calls.filter(([sql]) =>
      sql.startsWith('UPDATE'),
    );
    expect(miseAJour).toHaveLength(1);
    const [, parametres] = miseAJour[0] as unknown as [string, unknown[]];
    expect(parametres).toEqual([
      '[]',
      JSON.stringify([
        { nom: 'Source', url: 'https://ex.fr/a', publie_le: null },
      ]),
      JSON.stringify({
        run_id: 'morning-brief-2026-11-08-fr',
        edition_date: '2026-11-08',
        content_sha256: 'f'.repeat(64),
      }),
      'a1',
    ]);
  });
});
