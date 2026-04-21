import { Injectable, Logger } from '@nestjs/common';
import type { IEmailDripScheduler } from '../domain/IEmailDripScheduler';
import type { NewsletterSubscriber } from '../domain/NewsletterSubscriber';

/**
 * Implementation placeholder de `IEmailDripScheduler` : journalise
 * uniquement l'intention de planifier / annuler une sequence drip.
 *
 * Pourquoi un no-op ici : la queue BullMQ + les templates Handlebars
 * multi-locale arrivent au sprint S1.5 (cf. plan). La presence d'un
 * scheduler no-op permet de :
 *  - cabler le flow complet (SubscribeNewsletter -> ConfirmSubscription
 *    -> drip) des S1,
 *  - remplacer l'impl concrete par injection sans modifier les
 *    use-cases (principe d'inversion de dependance),
 *  - garantir que le controleur n'est jamais bloque par une file
 *    d'attente absente.
 *
 * A remplacer par `BullMqEmailDripScheduler` en S1.5.
 */
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
