import { buildArticleBroadcastRecord } from '../../../../test/factories/article.factory';
import type { ArticleBroadcastStatus } from './article-broadcast.repository';
import { clotureDeDiffusion, estAnnulable } from './cloture-de-diffusion';

const NOW = new Date('2026-09-23T07:45:00.000Z');

describe('clôture d une diffusion d article', () => {
  it.each<[ArticleBroadcastStatus, boolean]>([
    ['scheduled', true],
    ['sending', true],
    ['sent', false],
    ['cancelled', false],
    ['expired', false],
  ])('une diffusion %s est annulable : %s', (status, attendu) => {
    expect(estAnnulable(buildArticleBroadcastRecord({ status }))).toBe(attendu);
  });

  it('n annule rien quand l article n a pas de diffusion', () => {
    expect(estAnnulable(null)).toBe(false);
  });

  it.each(['cancelled', 'expired'] as const)(
    'clôt une diffusion %s en levant son verrou',
    (status) => {
      expect(clotureDeDiffusion(status, NOW)).toEqual({
        status,
        lockedUntil: null,
        completedAt: NOW,
      });
    },
  );
});
