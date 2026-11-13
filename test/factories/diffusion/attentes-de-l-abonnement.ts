import { LienInvalideError } from '../../../src/common/domain/errors/auth/LienInvalideError';
import type { SupportedLocale } from '../../../src/common/domain/value-objects/LocaleCode';
import { SubscribeNewsletterUseCase } from '../../../src/modules/newsletter/application/SubscribeNewsletter.useCase';
import type { INewsletterRepository } from '../../../src/modules/newsletter/domain/INewsletterRepository';
import type { NewsletterSubscriber } from '../../../src/modules/newsletter/domain/NewsletterSubscriber';
import {
  buildAbonne,
  buildCommandeDAbonnement,
  createNewsletterDependances,
} from './newsletter.factory';
import { rendueAuPlancher } from '../../helpers/temps/plancher-de-latence';

export function attendreSeulementLHeureDuMailNotee(
  depot: jest.Mocked<INewsletterRepository>,
  abonne: NewsletterSubscriber,
  maintenant: Date,
): void {
  expect(depot.creer.mock.calls).toEqual([]);
  expect(depot.mettreAJour.mock.calls).toEqual([
    [{ ...abonne, dernierMailLe: maintenant }],
  ]);
}

export async function attendreLeLienRefuse(
  execution: Promise<unknown>,
  depot: jest.Mocked<INewsletterRepository>,
): Promise<void> {
  await expect(execution).rejects.toThrow(new LienInvalideError());
  expect(depot.mettreAJour.mock.calls).toEqual([]);
}

export async function redemanderUnAbonnement(
  maintenant: Date,
  abonne: Partial<NewsletterSubscriber>,
  demande: { readonly email?: string; readonly locale: SupportedLocale },
) {
  jest.setSystemTime(maintenant.getTime());
  const { depot, mailer } = createNewsletterDependances();
  const connu = buildAbonne(abonne);
  depot.trouverParBoite.mockImplementation((boite) =>
    Promise.resolve(boite === connu.boite ? connu : null),
  );
  const reponse = await rendueAuPlancher(
    new SubscribeNewsletterUseCase(depot, mailer).execute(
      buildCommandeDAbonnement(demande),
    ),
  );
  return { abonne: connu, depot, mailer, reponse };
}
