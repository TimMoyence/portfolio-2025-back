/* eslint-disable @typescript-eslint/unbound-method */
import { NotFoundException } from '@nestjs/common';
import {
  buildNewsletterSubscriber,
  buildSubscribeNewsletterCommand,
  createNewsletterDependances,
} from '../../../../../test/factories/newsletter-subscriber.factory';
import { ConfirmSubscriptionUseCase } from '../../application/ConfirmSubscription.useCase';
import { SubscribeNewsletterUseCase } from '../../application/SubscribeNewsletter.useCase';
import { UnsubscribeNewsletterUseCase } from '../../application/UnsubscribeNewsletter.useCase';
import { NewsletterController } from '../Newsletter.controller';
import type { SubscribeNewsletterRequestDto } from '../dto/subscribe-newsletter.request.dto';

const VALID_TOKEN = '550e8400-e29b-41d4-a716-446655440000';
const VALID_DTO: SubscribeNewsletterRequestDto =
  buildSubscribeNewsletterCommand();

function buildMockUseCases() {
  const { repo, mailer, scheduler } = createNewsletterDependances();

  const subscribeUC = new SubscribeNewsletterUseCase(repo, mailer);
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

  jest.spyOn(unsubscribeUC, 'execute').mockResolvedValue({
    status: 'unsubscribed',
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

  const attendreTokenRefuse = async (
    reponse: Promise<unknown>,
    useCase: { execute: unknown },
  ) => {
    await expect(reponse).rejects.toThrow(NotFoundException);
    expect(useCase.execute).not.toHaveBeenCalled();
  };

  const attendreDesabonnementAvecAccuse = async () => {
    const result = await controller.unsubscribeEndpoint(VALID_TOKEN);

    expect(mocks.unsubscribeUC.execute).toHaveBeenCalledWith(VALID_TOKEN, {
      sendAck: true,
    });
    return result;
  };

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
      expect(typeof result.message).toBe('string');
      expect(result.message).not.toMatch(
        /d[eé]j[aà].*inscrit|existant|d[eé]j[aà].*confirm[eé]|enregistr[eé]/i,
      );
      expect(result.message).toMatch(
        /confirm(ation|er|ez)|v[eé]rifiez|boite|link/i,
      );
    });
  });

  describe('GET /newsletter/confirm', () => {
    it('retourne le statut pour un token UUID v4 valide', async () => {
      const result = await controller.confirmEndpoint(VALID_TOKEN);

      expect(mocks.confirmUC.execute).toHaveBeenCalledWith(VALID_TOKEN);
      expect(result.status).toBeDefined();
    });

    it.each([
      ['un token malformed', 'not-a-uuid'],
      ['un token absent', undefined as unknown as string],
    ])('leve NotFoundException (404) pour %s', async (_cas, token) => {
      await attendreTokenRefuse(
        controller.confirmEndpoint(token),
        mocks.confirmUC,
      );
    });
  });

  describe('GET /newsletter/unsubscribe', () => {
    it('retourne le statut pour un token UUID v4 valide', async () => {
      const result = await attendreDesabonnementAvecAccuse();

      expect(result.status).toBeDefined();
    });

    it.each([
      ['un token malformed', 'invalid-token'],
      ['une chaine vide', ''],
    ])('leve NotFoundException (404) pour %s', async (_cas, token) => {
      await attendreTokenRefuse(
        controller.unsubscribeEndpoint(token),
        mocks.unsubscribeUC,
      );
    });
  });

  describe('POST /newsletter/unsubscribe (one-click RFC 8058)', () => {
    it('desabonne sur un POST sans corps, comme le fait le client mail', async () => {
      const result = await controller.unsubscribeOneClickEndpoint(VALID_TOKEN);

      expect(mocks.unsubscribeUC.execute).toHaveBeenCalledWith(VALID_TOKEN, {
        sendAck: false,
      });
      expect(result.status).toBe('unsubscribed');
    });

    it('n’envoie pas d’accuse de reception sur le chemin one-click', async () => {
      await controller.unsubscribeOneClickEndpoint(VALID_TOKEN);

      const [, options] = jest.mocked(mocks.unsubscribeUC.execute).mock
        .calls[0];
      expect(options?.sendAck).toBe(false);
    });

    it('conserve l’accuse de reception sur le lien GET', async () => {
      await attendreDesabonnementAvecAccuse();
    });

    it('leve NotFoundException (404) pour un token malformed', async () => {
      await attendreTokenRefuse(
        controller.unsubscribeOneClickEndpoint('invalid-token'),
        mocks.unsubscribeUC,
      );
    });
  });
});
