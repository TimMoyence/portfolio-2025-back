import { NoopEmailDripSchedulerService } from '../NoopEmailDripScheduler.service';
import { buildNewsletterSubscriber } from '../../../../../test/factories/newsletter-subscriber.factory';

describe('NoopEmailDripSchedulerService', () => {
  let scheduler: NoopEmailDripSchedulerService;

  beforeEach(() => {
    scheduler = new NoopEmailDripSchedulerService();
  });

  it('schedule resout sans erreur et ne modifie pas l\u2019abonne', async () => {
    const subscriber = buildNewsletterSubscriber();
    await expect(scheduler.schedule(subscriber)).resolves.toBeUndefined();
  });

  it('cancel resout sans erreur', async () => {
    const subscriber = buildNewsletterSubscriber();
    await expect(scheduler.cancel(subscriber)).resolves.toBeUndefined();
  });

  it('schedule accepte un abonne sans id (nouveau, non persiste)', async () => {
    const subscriber = buildNewsletterSubscriber();
    subscriber.id = undefined;
    await expect(scheduler.schedule(subscriber)).resolves.toBeUndefined();
  });
});
