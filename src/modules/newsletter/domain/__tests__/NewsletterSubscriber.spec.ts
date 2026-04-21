import { DomainValidationError } from '../../../../common/domain/errors/DomainValidationError';
import { NewsletterSubscriber } from '../NewsletterSubscriber';

describe('NewsletterSubscriber', () => {
  const validProps = {
    email: 'Marie@Example.com',
    firstName: 'Marie',
    locale: 'fr',
    sourceFormationSlug: 'ia-solopreneurs',
    termsVersion: '2026-04-10',
    termsAcceptedAt: new Date('2026-04-10T10:00:00Z'),
  };

  describe('create', () => {
    it('cree un abonne valide en statut pending avec tokens distincts', () => {
      const subscriber = NewsletterSubscriber.create(validProps);

      expect(subscriber.email).toBe('marie@example.com'); // normalise
      expect(subscriber.status).toBe('pending');
      expect(subscriber.confirmToken).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      );
      expect(subscriber.unsubscribeToken).not.toBe(subscriber.confirmToken);
      expect(subscriber.confirmedAt).toBeNull();
      expect(subscriber.unsubscribedAt).toBeNull();
      expect(subscriber.firstName).toBe('Marie');
    });

    it('accepte un firstName null quand absent', () => {
      const subscriber = NewsletterSubscriber.create({
        ...validProps,
        firstName: undefined,
      });
      expect(subscriber.firstName).toBeNull();
    });

    it('rejette un email invalide', () => {
      expect(() =>
        NewsletterSubscriber.create({ ...validProps, email: 'pas-un-email' }),
      ).toThrow(DomainValidationError);
    });

    it('rejette une locale non ISO', () => {
      expect(() =>
        NewsletterSubscriber.create({ ...validProps, locale: 'francais' }),
      ).toThrow(DomainValidationError);
    });

    it('rejette un slug vide', () => {
      expect(() =>
        NewsletterSubscriber.create({ ...validProps, sourceFormationSlug: '' }),
      ).toThrow(DomainValidationError);
    });

    it('rejette une date invalide', () => {
      expect(() =>
        NewsletterSubscriber.create({
          ...validProps,
          termsAcceptedAt: new Date('invalid'),
        }),
      ).toThrow(DomainValidationError);
    });
  });

  describe('confirm', () => {
    it('passe de pending a confirmed et timestampe la date', () => {
      const subscriber = NewsletterSubscriber.create(validProps);
      const now = new Date('2026-04-20T12:00:00Z');
      subscriber.confirm(now);

      expect(subscriber.status).toBe('confirmed');
      expect(subscriber.confirmedAt).toEqual(now);
    });

    it('est idempotent quand deja confirme', () => {
      const subscriber = NewsletterSubscriber.create(validProps);
      const first = new Date('2026-04-20T12:00:00Z');
      const second = new Date('2026-04-21T12:00:00Z');
      subscriber.confirm(first);
      subscriber.confirm(second);

      expect(subscriber.confirmedAt).toEqual(first); // premiere date preservee
    });

    it('refuse de confirmer un abonne desabonne', () => {
      const subscriber = NewsletterSubscriber.create(validProps);
      subscriber.unsubscribe();
      expect(() => subscriber.confirm()).toThrow(DomainValidationError);
    });

    it('refuse de confirmer un abonne bounced', () => {
      const subscriber = NewsletterSubscriber.create(validProps);
      subscriber.markAsBounced();
      expect(() => subscriber.confirm()).toThrow(DomainValidationError);
    });
  });

  describe('unsubscribe', () => {
    it('passe le status a unsubscribed et timestampe', () => {
      const subscriber = NewsletterSubscriber.create(validProps);
      const now = new Date('2026-04-22T09:00:00Z');
      subscriber.unsubscribe(now);

      expect(subscriber.status).toBe('unsubscribed');
      expect(subscriber.unsubscribedAt).toEqual(now);
    });

    it('est idempotent', () => {
      const subscriber = NewsletterSubscriber.create(validProps);
      const first = new Date('2026-04-22T09:00:00Z');
      subscriber.unsubscribe(first);
      subscriber.unsubscribe(new Date('2026-04-23T09:00:00Z'));

      expect(subscriber.unsubscribedAt).toEqual(first);
    });

    it('accepte un desabonnement avant confirmation', () => {
      const subscriber = NewsletterSubscriber.create(validProps);
      subscriber.unsubscribe();
      expect(subscriber.status).toBe('unsubscribed');
    });
  });

  describe('markAsBounced', () => {
    it('passe le status a bounced', () => {
      const subscriber = NewsletterSubscriber.create(validProps);
      subscriber.markAsBounced();
      expect(subscriber.status).toBe('bounced');
    });
  });
});
