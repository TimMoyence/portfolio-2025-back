/* eslint-disable @typescript-eslint/unbound-method */
import { Not, QueryFailedError, type Repository } from 'typeorm';
import { buildNewsletterSubscriber } from '../../../../../test/factories/newsletter-subscriber.factory';
import { ResourceConflictError } from '../../../../common/domain/errors/ResourceConflictError';
import { NewsletterSubscriber } from '../../domain/NewsletterSubscriber';
import type { NewsletterSubscriberEntity } from '../entities/NewsletterSubscriber.entity';
import { NewsletterSubscriberRepositoryTypeORM } from '../NewsletterSubscriber.repository.typeorm';

describe('NewsletterSubscriberRepositoryTypeORM.markUnsubscribed', () => {
  let repo: jest.Mocked<Repository<NewsletterSubscriberEntity>>;
  let sut: NewsletterSubscriberRepositoryTypeORM;

  beforeEach(() => {
    repo = {
      update: jest.fn(),
      findOneOrFail: jest.fn(),
    } as unknown as jest.Mocked<Repository<NewsletterSubscriberEntity>>;
    sut = new NewsletterSubscriberRepositoryTypeORM(repo);
  });

  function buildUnsubscribed() {
    const subscriber = buildNewsletterSubscriber();
    subscriber.id = 'sub-id';
    subscriber.confirm();
    subscriber.unsubscribe();
    return subscriber;
  }

  it('conditionne l’UPDATE au statut en base', async () => {
    const subscriber = buildUnsubscribed();
    repo.update.mockResolvedValue({ affected: 1, raw: [], generatedMaps: [] });
    repo.findOneOrFail.mockResolvedValue({
      id: 'sub-id',
      email: subscriber.email,
      firstName: subscriber.firstName,
      locale: subscriber.locale,
      sourceFormationSlug: subscriber.sourceFormationSlug,
      status: 'unsubscribed',
      confirmToken: subscriber.confirmToken,
      confirmTokenExpiresAt: subscriber.confirmTokenExpiresAt,
      lastConfirmationSentAt: subscriber.lastConfirmationSentAt,
      confirmedAt: subscriber.confirmedAt,
      unsubscribedAt: subscriber.unsubscribedAt,
      unsubscribeToken: subscriber.unsubscribeToken,
      termsVersion: subscriber.termsVersion,
      termsAcceptedAt: subscriber.termsAcceptedAt,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as NewsletterSubscriberEntity);

    await sut.markUnsubscribed(subscriber);

    const [criteria] = repo.update.mock.calls[0];
    expect(criteria).toEqual({
      id: 'sub-id',
      status: Not('unsubscribed'),
    });
  });

  it('retourne null quand aucune ligne n’a ete affectee', async () => {
    const subscriber = buildUnsubscribed();
    repo.update.mockResolvedValue({ affected: 0, raw: [], generatedMaps: [] });

    const result = await sut.markUnsubscribed(subscriber);

    expect(result).toBeNull();
    expect(repo.findOneOrFail).not.toHaveBeenCalled();
  });

  it.each([
    ['null', null],
    ['undefined', undefined],
  ])(
    'leve sans relire quand le pilote rend affected %s',
    async (_label, affected) => {
      const subscriber = buildUnsubscribed();
      repo.update.mockResolvedValue({
        affected,
        raw: [],
        generatedMaps: [],
      } as never);

      await expect(sut.markUnsubscribed(subscriber)).rejects.toThrow(
        'nombre de lignes',
      );
      expect(repo.findOneOrFail).not.toHaveBeenCalled();
    },
  );

  it('refuse un subscriber sans id', async () => {
    const subscriber = buildNewsletterSubscriber();
    subscriber.id = undefined;

    await expect(sut.markUnsubscribed(subscriber)).rejects.toThrow(
      'Cannot update a subscriber without an id',
    );
    expect(repo.update).not.toHaveBeenCalled();
  });
});

describe('NewsletterSubscriberRepositoryTypeORM — lecture et ecriture traduites', () => {
  const CREE_LE = new Date('2026-05-02T09:00:00Z');
  let repo: jest.Mocked<Repository<NewsletterSubscriberEntity>>;
  let sut: NewsletterSubscriberRepositoryTypeORM;

  function ligneDe(
    overrides: Partial<NewsletterSubscriberEntity> = {},
  ): NewsletterSubscriberEntity {
    const abonne = buildNewsletterSubscriber();
    return {
      id: 'sub-id',
      email: abonne.email,
      firstName: abonne.firstName,
      locale: abonne.locale,
      sourceFormationSlug: abonne.sourceFormationSlug,
      status: abonne.status,
      confirmToken: abonne.confirmToken,
      unsubscribeToken: abonne.unsubscribeToken,
      termsVersion: abonne.termsVersion,
      termsAcceptedAt: abonne.termsAcceptedAt,
      confirmTokenExpiresAt: abonne.confirmTokenExpiresAt,
      lastConfirmationSentAt: abonne.lastConfirmationSentAt,
      confirmedAt: abonne.confirmedAt,
      unsubscribedAt: abonne.unsubscribedAt,
      createdAt: CREE_LE,
      ...overrides,
    } as NewsletterSubscriberEntity;
  }

  beforeEach(() => {
    repo = {
      create: jest.fn((champs: Partial<NewsletterSubscriberEntity>) => ({
        ...champs,
      })),
      save: jest.fn((ligne: Partial<NewsletterSubscriberEntity>) =>
        Promise.resolve(ligneDe({ ...ligne, id: 'sub-neuf' })),
      ),
      findOne: jest.fn(),
      findOneOrFail: jest.fn(),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    } as unknown as jest.Mocked<Repository<NewsletterSubscriberEntity>>;
    sut = new NewsletterSubscriberRepositoryTypeORM(repo);
  });

  it('enregistre l abonne et rend la ligne sauvegardee traduite', async () => {
    const abonne = buildNewsletterSubscriber();

    const enregistre = await sut.create(abonne);

    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        email: abonne.email,
        sourceFormationSlug: abonne.sourceFormationSlug,
        confirmToken: abonne.confirmToken,
        unsubscribeToken: abonne.unsubscribeToken,
      }),
    );
    expect(enregistre).toBeInstanceOf(NewsletterSubscriber);
    expect(enregistre).toMatchObject({
      id: 'sub-neuf',
      email: abonne.email,
      status: abonne.status,
      createdAt: CREE_LE,
    });
  });

  it('signale un abonnement deja present pour cette adresse et cette source', async () => {
    repo.save.mockRejectedValue(
      new QueryFailedError(
        'INSERT',
        [],
        Object.assign(new Error('duplicate'), { code: '23505' }),
      ),
    );

    const refus = sut.create(buildNewsletterSubscriber());

    await expect(refus).rejects.toBeInstanceOf(ResourceConflictError);
    await expect(refus).rejects.toThrow(
      'Newsletter subscription already exists for this email and source',
    );
  });

  it.each([
    [
      'son adresse et sa source',
      (depot: NewsletterSubscriberRepositoryTypeORM) =>
        depot.findByEmailAndSource('ada@example.com', 'b2-01'),
      { email: 'ada@example.com', sourceFormationSlug: 'b2-01' },
    ],
    [
      'son jeton de confirmation',
      (depot: NewsletterSubscriberRepositoryTypeORM) =>
        depot.findByConfirmToken('jeton-c'),
      { confirmToken: 'jeton-c' },
    ],
    [
      'son jeton de desabonnement',
      (depot: NewsletterSubscriberRepositoryTypeORM) =>
        depot.findByUnsubscribeToken('jeton-d'),
      { unsubscribeToken: 'jeton-d' },
    ],
  ] as const)(
    'retrouve un abonne par %s et le traduit, ou rend null',
    async (_label, chercher, where) => {
      repo.findOne.mockResolvedValueOnce(ligneDe({ status: 'confirmed' }));

      await expect(chercher(sut)).resolves.toMatchObject({
        id: 'sub-id',
        status: 'confirmed',
      });
      expect(repo.findOne).toHaveBeenCalledWith({ where });

      repo.findOne.mockResolvedValueOnce(null);
      await expect(chercher(sut)).resolves.toBeNull();
    },
  );

  it('ramene un statut inconnu en base a l attente de confirmation', async () => {
    repo.findOne.mockResolvedValue(
      ligneDe({
        status: 'archive' as NewsletterSubscriberEntity['status'],
      }),
    );

    await expect(sut.findByConfirmToken('jeton-c')).resolves.toMatchObject({
      status: 'pending',
    });
  });

  it('rend l abonne relu apres sa mise a jour', async () => {
    const abonne = buildNewsletterSubscriber();
    abonne.id = 'sub-id';
    repo.findOneOrFail.mockResolvedValue(ligneDe({ status: 'confirmed' }));

    await expect(sut.update(abonne)).resolves.toMatchObject({
      id: 'sub-id',
      status: 'confirmed',
    });
    expect(repo.findOneOrFail).toHaveBeenCalledWith({
      where: { id: 'sub-id' },
    });
  });
});
