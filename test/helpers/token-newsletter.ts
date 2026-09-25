import { ResourceNotFoundError } from '../../src/common/domain/errors/ResourceNotFoundError';
import type { NewsletterSubscriber } from '../../src/modules/newsletter/domain/NewsletterSubscriber';
import {
  buildAbonnePersiste,
  type PreparationDAbonne,
} from '../factories/newsletter-subscriber.factory';
import { flushPromises } from './flush-promises';

const TOKEN_INCONNU = '00000000-0000-0000-0000-000000000000';

type RechercheParToken = jest.MockInstance<
  Promise<NewsletterSubscriber | null>,
  [token: string]
>;

export async function attendreTokenInconnuRefuse(
  rechercheParToken: RechercheParToken,
  executer: (token: string) => Promise<unknown>,
): Promise<void> {
  rechercheParToken.mockResolvedValueOnce(null);
  await expect(executer(TOKEN_INCONNU)).rejects.toBeInstanceOf(
    ResourceNotFoundError,
  );
}

export async function executerSurAbonneTrouve<R>(
  rechercheParToken: RechercheParToken,
  preparer: PreparationDAbonne | undefined,
  executer: (abonne: NewsletterSubscriber) => Promise<R>,
): Promise<R> {
  const abonne = buildAbonnePersiste(preparer);
  rechercheParToken.mockResolvedValueOnce(abonne);
  const resultat = await executer(abonne);
  await flushPromises();
  return resultat;
}
