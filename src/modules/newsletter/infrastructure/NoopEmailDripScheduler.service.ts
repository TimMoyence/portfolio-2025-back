import { Injectable, Logger } from '@nestjs/common';
import type { IEmailDripScheduler } from '../domain/IEmailDripScheduler';
import type { NewsletterSubscriber } from '../domain/NewsletterSubscriber';

@Injectable()
export class NoopEmailDripSchedulerService implements IEmailDripScheduler {
  private readonly logger = new Logger(NoopEmailDripSchedulerService.name);

  schedule(subscriber: NewsletterSubscriber): Promise<void> {
    this.logger.debug(
      `[drip:schedule] subscriber=${subscriber.id ?? 'unknown'} source=${subscriber.sourceFormationSlug} locale=${subscriber.locale} — no-op (pending S1.5)`,
    );
    return Promise.resolve();
  }

  cancel(subscriber: NewsletterSubscriber): Promise<void> {
    this.logger.debug(
      `[drip:cancel] subscriber=${subscriber.id ?? 'unknown'} — no-op (pending S1.5)`,
    );
    return Promise.resolve();
  }
}
