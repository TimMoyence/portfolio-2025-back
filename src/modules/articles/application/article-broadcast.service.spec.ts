import { ConflictException, NotFoundException } from '@nestjs/common';
import type { ArticlesRepository } from './articles.repository';
import type { ArticleRecord } from './articles.repository';
import { ArticleBroadcastService } from './article-broadcast.service';
import { ArticleModerationService } from './article-moderation.service';
import {
  InMemoryArticleBroadcasts,
  RecordingBroadcastMailer,
} from '../testing/in-memory-article-broadcast';

const NOW = new Date('2026-09-23T07:45:00.000Z');

function article(overrides: Partial<ArticleRecord> = {}): ArticleRecord {
  return {
    id: 'record-1',
    articleId: 'morning-brief-2026-09-23-fr',
    slug: 'morning-brief-2026-09-23',
    locale: 'fr',
    status: 'published',
    title: 'Veille IA du 23 septembre',
    excerpt: 'Les faits IA du jour, sourcés.',
    contentMarkdown: '# Veille',
    readingTimeMinutes: 6,
    tags: [],
    sections: [],
    sources: [],
    provenance: {},
    seo: {},
    publishedAt: new Date('2026-09-23T04:15:00.000Z'),
    updatedAt: new Date('2026-09-23T04:15:00.000Z'),
    contentSha256: 'a'.repeat(64),
    ...overrides,
  };
}

function setup(options: { sendAfter?: Date } = {}) {
  const store = new InMemoryArticleBroadcasts();
  const mailer = new RecordingBroadcastMailer();
  store.articles.set('record-1', article());
  store.broadcasts.set('broadcast-1', {
    id: 'broadcast-1',
    articleRecordId: 'record-1',
    status: 'scheduled',
    sendAfter: options.sendAfter ?? new Date(NOW.getTime() - 60_000),
    lockedUntil: null,
    sentCount: 0,
    failedCount: 0,
    completedAt: null,
  });
  const subscribe = (
    id: string,
    email: string,
    extra: Partial<(typeof store.subscribers)[number]> = {},
  ) =>
    store.subscribers.push({
      subscriberId: id,
      email,
      firstName: null,
      unsubscribeToken: `token-${id}`,
      source: 'veille-ia',
      locale: 'fr',
      status: 'confirmed',
      ...extra,
    });
  const service = new ArticleBroadcastService(
    store,
    store as unknown as ArticlesRepository,
    mailer,
  );
  const moderation = new ArticleModerationService(store);
  return { store, mailer, subscribe, service, moderation };
}

const withEnv = async (
  values: Record<string, string | undefined>,
  run: () => Promise<void>,
) => {
  const previous = Object.fromEntries(
    Object.keys(values).map((key) => [key, process.env[key]]),
  );
  Object.assign(process.env, values);
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) delete process.env[key];
  }
  try {
    await run();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
};

const enabled = (run: () => Promise<void>) =>
  withEnv(
    { ARTICLE_BROADCAST_ENABLED: 'true', ARTICLE_BROADCAST_BATCH_SIZE: '50' },
    run,
  );

describe('ArticleBroadcastService.runDue', () => {
  it('ne réclame rien tant que la diffusion n est pas activée', async () => {
    const { store, subscribe, service, mailer } = setup();
    subscribe('s1', 'a@example.com');

    await withEnv({ ARTICLE_BROADCAST_ENABLED: undefined }, async () => {
      await expect(service.runDue(NOW)).resolves.toEqual({
        status: 'disabled',
      });
    });

    expect(mailer.sent).toEqual([]);
    expect(store.broadcasts.get('broadcast-1')?.status).toBe('scheduled');
  });

  it('ne réclame rien sans transport SMTP', async () => {
    const { store, service, mailer } = setup();
    mailer.enabled = false;

    await enabled(async () => {
      await expect(service.runDue(NOW)).resolves.toEqual({
        status: 'disabled',
      });
    });

    expect(store.broadcasts.get('broadcast-1')?.status).toBe('scheduled');
  });

  it('attend la fin de la fenêtre de modération', async () => {
    const { service, mailer, subscribe } = setup({
      sendAfter: new Date(NOW.getTime() + 60_000),
    });
    subscribe('s1', 'a@example.com');

    await enabled(async () => {
      await expect(service.runDue(NOW)).resolves.toEqual({ status: 'idle' });
    });

    expect(mailer.sent).toEqual([]);
  });

  it('envoie aux seuls abonnés confirmés de la veille dans la langue de l article', async () => {
    const { store, subscribe, service, mailer } = setup();
    subscribe('s1', 'fr@example.com');
    subscribe('s2', 'frfr@example.com', { locale: 'fr-FR' });
    subscribe('s3', 'en@example.com', { locale: 'en' });
    subscribe('s4', 'formation@example.com', { source: 'ia-solopreneurs' });
    subscribe('s5', 'pending@example.com', { status: 'pending' });
    subscribe('s6', 'gone@example.com', { status: 'unsubscribed' });

    await enabled(async () => {
      await expect(service.runDue(NOW)).resolves.toEqual({
        status: 'sent',
        broadcastId: 'broadcast-1',
        sent: 2,
        failed: 0,
      });
    });

    expect(mailer.sent).toEqual(['fr@example.com', 'frfr@example.com']);
    expect(store.broadcasts.get('broadcast-1')).toMatchObject({
      status: 'sent',
      sentCount: 2,
      failedCount: 0,
      completedAt: NOW,
      lockedUntil: null,
    });
  });

  it('ne renvoie jamais à un destinataire déjà réservé après une reprise', async () => {
    const { store, subscribe, service, mailer } = setup();
    subscribe('s1', 'a@example.com');
    subscribe('s2', 'b@example.com');
    const reserve = store.reserveRecipient.bind(store);
    store.findPendingRecipients = async (...args) => {
      const pending =
        await InMemoryArticleBroadcasts.prototype.findPendingRecipients.apply(
          store,
          args,
        );
      await reserve('broadcast-1', 's1');
      return pending;
    };

    await enabled(async () => {
      await service.runDue(NOW);
    });

    expect(mailer.sent).toEqual(['b@example.com']);
  });

  it('isole un échec d envoi sans exposer l adresse dans l erreur stockée', async () => {
    const { store, subscribe, service, mailer } = setup();
    subscribe('s1', 'bounce@example.com');
    subscribe('s2', 'ok@example.com');
    mailer.failingEmails.add('bounce@example.com');

    await enabled(async () => {
      await expect(service.runDue(NOW)).resolves.toMatchObject({
        status: 'sent',
        sent: 1,
        failed: 1,
      });
    });

    expect(mailer.sent).toEqual(['ok@example.com']);
    expect(store.recipients.get('broadcast-1:s1')).toBe('failed');
    expect(store.recipientErrors.get('broadcast-1:s1')).not.toContain(
      'bounce@example.com',
    );
  });

  it('libère le verrou quand le lot est plein pour continuer au passage suivant', async () => {
    const { store, subscribe, service, mailer } = setup();
    for (let index = 0; index < 3; index += 1) {
      subscribe(`s${index}`, `user${index}@example.com`);
    }

    await withEnv(
      { ARTICLE_BROADCAST_ENABLED: 'true', ARTICLE_BROADCAST_BATCH_SIZE: '2' },
      async () => {
        await expect(service.runDue(NOW)).resolves.toMatchObject({
          status: 'partial',
          sent: 2,
        });
        expect(store.broadcasts.get('broadcast-1')).toMatchObject({
          status: 'sending',
          lockedUntil: NOW,
          sentCount: 2,
        });
        await expect(service.runDue(NOW)).resolves.toMatchObject({
          status: 'sent',
          sent: 1,
        });
      },
    );

    expect(mailer.sent).toHaveLength(3);
    expect(store.broadcasts.get('broadcast-1')?.sentCount).toBe(3);
  });

  it('annule la diffusion d un article retiré entre-temps', async () => {
    const { store, subscribe, service, mailer } = setup();
    subscribe('s1', 'a@example.com');
    store.articles.get('record-1')!.status = 'withdrawn';

    await enabled(async () => {
      await expect(service.runDue(NOW)).resolves.toMatchObject({
        status: 'cancelled',
      });
    });

    expect(mailer.sent).toEqual([]);
    expect(store.broadcasts.get('broadcast-1')?.status).toBe('cancelled');
  });

  it('expire une diffusion jamais commencée restée en attente plus de 24 h', async () => {
    const { store, subscribe, service, mailer } = setup({
      sendAfter: new Date(NOW.getTime() - 25 * 3_600_000),
    });
    subscribe('s1', 'a@example.com');

    await enabled(async () => {
      await expect(service.runDue(NOW)).resolves.toMatchObject({
        status: 'expired',
      });
    });

    expect(mailer.sent).toEqual([]);
    expect(store.broadcasts.get('broadcast-1')?.status).toBe('expired');
  });
});

describe('ArticleModerationService', () => {
  const articleId = 'morning-brief-2026-09-23-fr';

  it('retire un article et annule sa diffusion programmée', async () => {
    const { store, moderation } = setup();

    const result = await moderation.withdraw(articleId, NOW);

    expect(store.articles.get('record-1')?.status).toBe('withdrawn');
    expect(store.broadcasts.get('broadcast-1')).toMatchObject({
      status: 'cancelled',
      completedAt: NOW,
    });
    expect(result).toMatchObject({
      article_id: articleId,
      status: 'withdrawn',
      broadcast: { status: 'cancelled' },
    });
  });

  it('republie un article sans relancer sa diffusion annulée', async () => {
    const { store, moderation } = setup();
    await moderation.withdraw(articleId, NOW);

    await moderation.restore(articleId);

    expect(store.articles.get('record-1')?.status).toBe('published');
    expect(store.broadcasts.get('broadcast-1')?.status).toBe('cancelled');
  });

  it('avance l envoi d une diffusion programmée à maintenant', async () => {
    const { store, moderation } = setup({
      sendAfter: new Date(NOW.getTime() + 3_600_000),
    });

    await moderation.approveBroadcast(articleId, NOW);

    expect(store.broadcasts.get('broadcast-1')?.sendAfter).toEqual(NOW);
  });

  it('refuse d approuver ou d annuler une diffusion déjà terminée', async () => {
    const { store, moderation } = setup();
    store.broadcasts.get('broadcast-1')!.status = 'sent';

    await expect(
      moderation.approveBroadcast(articleId, NOW),
    ).rejects.toBeInstanceOf(ConflictException);
    await expect(
      moderation.cancelBroadcast(articleId, NOW),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('annule une diffusion en cours d envoi', async () => {
    const { store, moderation } = setup();
    store.broadcasts.get('broadcast-1')!.status = 'sending';

    await moderation.cancelBroadcast(articleId, NOW);

    expect(store.broadcasts.get('broadcast-1')?.status).toBe('cancelled');
  });

  it('répond 404 pour un article inconnu', async () => {
    const { moderation } = setup();

    await expect(
      moderation.withdraw('morning-brief-2020-01-01-fr', NOW),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('liste les derniers articles avec l état de leur diffusion', async () => {
    const { moderation } = setup();

    await expect(moderation.list()).resolves.toEqual([
      {
        article_id: articleId,
        slug: 'morning-brief-2026-09-23',
        locale: 'fr',
        title: 'Veille IA du 23 septembre',
        status: 'published',
        published_at: '2026-09-23T04:15:00.000Z',
        broadcast: {
          status: 'scheduled',
          send_after: new Date(NOW.getTime() - 60_000).toISOString(),
          sent_count: 0,
          failed_count: 0,
          completed_at: null,
        },
      },
    ]);
  });
});
