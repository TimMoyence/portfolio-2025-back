import { InMemorySecurityEventsStore } from './in-memory-security-events-store';
import type { SecurityEventRecord } from './ISecurityEventsStore';

function buildEvent(
  overrides: Partial<SecurityEventRecord> = {},
): SecurityEventRecord {
  return {
    ip: '1.2.3.4',
    userAgent: 'HeadlessChrome/145',
    method: 'POST',
    path: '/api/v1/portfolio25/cookie-consents',
    statusCode: 201,
    score: 45,
    reasons: ['ua:headless-chrome', 'http:aborted'],
    occurredAtMs: Date.now(),
    ...overrides,
  };
}

describe('InMemorySecurityEventsStore', () => {
  let store: InMemorySecurityEventsStore;

  beforeEach(() => {
    store = new InMemorySecurityEventsStore();
  });

  it('incremente le compteur pour une IP', async () => {
    expect(await store.recordEvent(buildEvent({ ip: '1.1.1.1' }))).toBe(1);
    expect(await store.recordEvent(buildEvent({ ip: '1.1.1.1' }))).toBe(2);
    expect(await store.recordEvent(buildEvent({ ip: '2.2.2.2' }))).toBe(1);
  });

  it('retourne le top-N trie par compteur decroissant', async () => {
    const now = Date.now();
    for (let i = 0; i < 3; i++) {
      await store.recordEvent(buildEvent({ ip: '1.1.1.1', occurredAtMs: now }));
    }
    await store.recordEvent(buildEvent({ ip: '2.2.2.2', occurredAtMs: now }));
    await store.recordEvent(buildEvent({ ip: '3.3.3.3', occurredAtMs: now }));
    await store.recordEvent(buildEvent({ ip: '3.3.3.3', occurredAtMs: now }));

    const top = await store.getTopIPs(10, 60_000);
    expect(top).toHaveLength(3);
    expect(top[0].ip).toBe('1.1.1.1');
    expect(top[0].count).toBe(3);
    expect(top[1].ip).toBe('3.3.3.3');
    expect(top[1].count).toBe(2);
    expect(top[2].ip).toBe('2.2.2.2');
  });

  it('respecte la limite', async () => {
    for (let i = 0; i < 5; i++) {
      await store.recordEvent(buildEvent({ ip: `10.0.0.${i}` }));
    }
    const top = await store.getTopIPs(2, 60_000);
    expect(top).toHaveLength(2);
  });

  it('evince les entrees sorties de la fenetre a la lecture (lazy)', async () => {
    const oldTs = Date.now() - 100_000;
    await store.recordEvent(buildEvent({ ip: '4.4.4.4', occurredAtMs: oldTs }));
    await store.recordEvent(buildEvent({ ip: '5.5.5.5' }));

    const top = await store.getTopIPs(10, 30_000);
    expect(top.map((t) => t.ip)).toEqual(['5.5.5.5']);
  });

  it('conserve les derniers reasons, path et userAgent par IP', async () => {
    await store.recordEvent(
      buildEvent({
        ip: '6.6.6.6',
        reasons: ['ua:curl'],
        path: '/old',
        userAgent: 'curl/7.0',
      }),
    );
    await store.recordEvent(
      buildEvent({
        ip: '6.6.6.6',
        reasons: ['path:wordpress-login'],
        path: '/wp-login.php',
        userAgent: 'HeadlessChrome',
      }),
    );

    const top = await store.getTopIPs(1, 60_000);
    expect(top[0].lastPath).toBe('/wp-login.php');
    expect(top[0].lastUserAgent).toBe('HeadlessChrome');
    expect(top[0].lastReasons).toEqual(['path:wordpress-login']);
    expect(top[0].count).toBe(2);
  });
});
