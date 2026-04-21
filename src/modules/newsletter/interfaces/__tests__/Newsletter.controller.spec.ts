/* eslint-disable @typescript-eslint/unbound-method */
import { NotFoundException } from '@nestjs/common';
import {
  buildNewsletterSubscriber,
  createMockEmailDripScheduler,
  createMockNewsletterMailer,
  createMockNewsletterSubscriberRepo,
} from '../../../../../test/factories/newsletter-subscriber.factory';
import { ConfirmSubscriptionUseCase } from '../../application/ConfirmSubscription.useCase';
import { SubscribeNewsletterUseCase } from '../../application/SubscribeNewsletter.useCase';
import { UnsubscribeNewsletterUseCase } from '../../application/UnsubscribeNewsletter.useCase';
import { NewsletterController } from '../Newsletter.controller';
import type { SubscribeNewsletterRequestDto } from '../dto/subscribe-newsletter.request.dto';

const VALID_TOKEN = '550e8400-e29b-41d4-a716-446655440000';
const VALID_DTO: SubscribeNewsletterRequestDto = {
  email: 'marie@example.com',
  firstName: 'Marie',
  locale: 'fr',
  sourceFormationSlug: 'ia-solopreneurs',
  termsVersion: '2026-04-10',
  termsAcceptedAt: new Date('2026-04-10T10:00:00Z'),
};

function buildMockUseCases() {
  const repo = createMockNewsletterSubscriberRepo();
  const mailer = createMockNewsletterMailer();
  const scheduler = createMockEmailDripScheduler();

  const subscribeUC = new SubscribeNewsletterUseCase(repo, mailer, scheduler);
  const confirmUC = new ConfirmSubscriptionUseCase(repo, mailer, scheduler);
  const unsubscribeUC = new UnsubscribeNewsletterUseCase(
    repo,
    mailer,
    scheduler,
  );

  jest.spyOn(subscribeUC, 'execute').mockResolvedValue({
    created: true,
    alreadySubscribed: false,
    status: 'pending',
  });

  const confirmed = buildNewsletterSubscriber();
  jest
    .spyOn(confirmUC, 'execute')
    .mockResolvedValue({ status: confirmed.status, alreadyConfirmed: false });

  const unsubscribed = buildNewsletterSubscriber();
  jest.spyOn(unsubscribeUC, 'execute').mockResolvedValue({
    status: unsubscribed.status,
    alreadyUnsubscribed: false,
  });

  return { subscribeUC, confirmUC, unsubscribeUC };
}

describe('NewsletterController', () => {
  let controller: NewsletterController;
  let mocks: ReturnType<typeof buildMockUseCases>;

  beforeEach(() => {
    mocks = buildMockUseCases();
    controller = new NewsletterController(
      mocks.subscribeUC,
      mocks.confirmUC,
      mocks.unsubscribeUC,
    );
  });

  describe('POST /newsletter/subscribe', () => {
    it('retourne un message generique 202 sans reveler le statut', async () => {
      const result = await controller.subscribeEndpoint(VALID_DTO);

      expect(mocks.subscribeUC.execute).toHaveBeenCalledWith({
        email: VALID_DTO.email,
        firstName: VALID_DTO.firstName,
        locale: VALID_DTO.locale,
        sourceFormationSlug: VALID_DTO.sourceFormationSlug,
        termsVersion: VALID_DTO.termsVersion,
        termsAcceptedAt: VALID_DTO.termsAcceptedAt,
      });
      expect(result.message).toBeDefined();
      expect(typeof result.message).toBe('string');
    });
  });

  describe('GET /newsletter/confirm', () => {
    it('retourne le statut pour un token UUID v4 valide', async () => {
      const result = await controller.confirmEndpoint(VALID_TOKEN);

      expect(mocks.confirmUC.execute).toHaveBeenCalledWith(VALID_TOKEN);
      expect(result.status).toBeDefined();
    });

    it('leve NotFoundException (404) pour un token malformed', async () => {
      await expect(controller.confirmEndpoint('not-a-uuid')).rejects.toThrow(
        NotFoundException,
      );
      expect(mocks.confirmUC.execute).not.toHaveBeenCalled();
    });

    it('leve NotFoundException (404) pour un token absent', async () => {
      await expect(
        controller.confirmEndpoint(undefined as unknown as string),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('GET /newsletter/unsubscribe', () => {
    it('retourne le statut pour un token UUID v4 valide', async () => {
      const result = await controller.unsubscribeEndpoint(VALID_TOKEN);

      expect(mocks.unsubscribeUC.execute).toHaveBeenCalledWith(VALID_TOKEN);
      expect(result.status).toBeDefined();
    });

    it('leve NotFoundException (404) pour un token malformed', async () => {
      await expect(
        controller.unsubscribeEndpoint('invalid-token'),
      ).rejects.toThrow(NotFoundException);
      expect(mocks.unsubscribeUC.execute).not.toHaveBeenCalled();
    });

    it('leve NotFoundException (404) pour une chaine vide', async () => {
      await expect(controller.unsubscribeEndpoint('')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
