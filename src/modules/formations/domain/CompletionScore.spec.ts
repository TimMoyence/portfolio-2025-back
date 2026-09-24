import { computeCohortScore } from './CompletionScore';

describe('computeCohortScore', () => {
  it('note sur vingt par rapport a la reference de cohorte', () => {
    const scores = computeCohortScore([
      { participantId: 'a', completion: 1 },
      { participantId: 'b', completion: 0.8 },
      { participantId: 'c', completion: 0.6 },
      { participantId: 'd', completion: 0.4 },
      { participantId: 'e', completion: 0.2 },
    ]);
    const a = scores.find((s) => s.participantId === 'a');
    expect(a?.note).toBe(20);
  });

  it('plafonne la note a vingt', () => {
    const scores = computeCohortScore([
      { participantId: 'a', completion: 1 },
      { participantId: 'b', completion: 0.2 },
      { participantId: 'c', completion: 0.2 },
      { participantId: 'd', completion: 0.2 },
      { participantId: 'e', completion: 0.2 },
    ]);
    expect(scores.every((s) => s.note <= 20)).toBe(true);
  });

  it('signale les copies sous le seuil de validation', () => {
    const scores = computeCohortScore([
      { participantId: 'a', completion: 1 },
      { participantId: 'b', completion: 1 },
      { participantId: 'c', completion: 0.1 },
    ]);
    const c = scores.find((s) => s.participantId === 'c');
    expect(c?.sousSeuil).toBe(true);
  });

  it('retourne une liste vide pour une cohorte vide', () => {
    expect(computeCohortScore([])).toEqual([]);
  });

  it('note zero tout le monde quand la reference est nulle', () => {
    const scores = computeCohortScore([
      { participantId: 'a', completion: 0 },
      { participantId: 'b', completion: 0 },
    ]);
    expect(scores.every((s) => s.note === 0)).toBe(true);
  });

  describe('sur une cohorte etalee', () => {
    const scores = computeCohortScore(
      [
        ['a', 1.0],
        ['b', 0.9],
        ['c', 0.5],
        ['d', 0.5],
        ['e', 0.5],
        ['f', 0.1],
        ['g', 0.1],
        ['h', 0.1],
        ['i', 0.1],
        ['j', 0.1],
      ].map(([participantId, completion]) => ({
        participantId: participantId as string,
        completion: completion as number,
      })),
    );
    const noteDe = (participantId: string) =>
      scores.find((s) => s.participantId === participantId)?.note;

    it('distingue la reference de cohorte d une moyenne ou d un maximum', () => {
      expect(noteDe('c')).toBeCloseTo((20 * 0.5) / 0.9, 2);
    });

    it('plafonne la note a vingt sur un score brut superieur au plafond', () => {
      expect(noteDe('a')).toBe(20);
    });
  });
});
