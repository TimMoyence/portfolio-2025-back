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
});
