import type { ArticleBroadcastService } from '../application/article-broadcast.service';
import { ArticleBroadcastScheduler } from './article-broadcast.scheduler';

describe('ArticleBroadcastScheduler', () => {
  it('ne chevauche jamais deux passages', async () => {
    let release: () => void = () => undefined;
    const runDue = jest.fn(
      () =>
        new Promise<{ status: 'idle' }>((resolve) => {
          release = () => resolve({ status: 'idle' });
        }),
    );
    const scheduler = new ArticleBroadcastScheduler({
      runDue,
    } as unknown as ArticleBroadcastService);

    const first = scheduler.tick();
    await scheduler.tick();
    release();
    await first;

    expect(runDue).toHaveBeenCalledTimes(1);
  });

  it('journalise un échec sans le propager au planificateur', async () => {
    const scheduler = new ArticleBroadcastScheduler({
      runDue: jest.fn().mockRejectedValue(new Error('db down')),
    } as unknown as ArticleBroadcastService);

    await expect(scheduler.tick()).resolves.toBeUndefined();
    await expect(scheduler.tick()).resolves.toBeUndefined();
  });
});
