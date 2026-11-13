import { Test } from '@nestjs/testing';
import { ConfirmSubscriptionUseCase } from '../../../src/modules/newsletter/application/ConfirmSubscription.useCase';
import { SubscribeNewsletterUseCase } from '../../../src/modules/newsletter/application/SubscribeNewsletter.useCase';
import { UnsubscribeNewsletterUseCase } from '../../../src/modules/newsletter/application/UnsubscribeNewsletter.useCase';
import {
  NEWSLETTER_MAILER,
  NEWSLETTER_REPOSITORY,
} from '../../../src/modules/newsletter/domain/token';
import { NewsletterController } from '../../../src/modules/newsletter/interfaces/Newsletter.controller';
import {
  createMockNewsletterMailer,
  createMockNewsletterRepository,
} from '../../factories/diffusion/newsletter.factory';
import {
  applicationDeLaSuite,
  bootstrapTestApp,
  serveurHttpDe,
} from './nest-test-app';

export function applicationDeLaNewsletter() {
  const depot = createMockNewsletterRepository();
  const mailer = createMockNewsletterMailer();
  const app = applicationDeLaSuite(async () =>
    bootstrapTestApp(
      await Test.createTestingModule({
        controllers: [NewsletterController],
        providers: [
          SubscribeNewsletterUseCase,
          ConfirmSubscriptionUseCase,
          UnsubscribeNewsletterUseCase,
          { provide: NEWSLETTER_REPOSITORY, useValue: depot },
          { provide: NEWSLETTER_MAILER, useValue: mailer },
        ],
      }).compile(),
    ),
  );

  beforeEach(() => {
    jest.clearAllMocks();
    depot.trouverParBoite.mockResolvedValue(null);
    depot.trouverLeLien.mockResolvedValue(null);
    depot.trouverParJetonDeDesabonnement.mockResolvedValue(null);
  });

  return { depot, mailer, serveur: () => serveurHttpDe(app()) };
}
