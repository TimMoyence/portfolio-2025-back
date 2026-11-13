import { Inject, Injectable } from '@nestjs/common';
import { LienInvalideError } from '../../../common/domain/errors/auth/LienInvalideError';
import type { SupportedLocale } from '../../../common/domain/value-objects/LocaleCode';
import type { INewsletterRepository } from '../domain/INewsletterRepository';
import type { LienDeConfirmation } from '../domain/NewsletterSubscriber';
import { NEWSLETTER_REPOSITORY } from '../domain/token';

export interface AbonnementConfirme {
  readonly status: 'confirmed';
  readonly locale: SupportedLocale;
}

function lienValable(lien: LienDeConfirmation | null): LienDeConfirmation {
  if (lien === null || lien.expireLe.getTime() <= Date.now()) {
    throw new LienInvalideError();
  }
  return lien;
}

@Injectable()
export class ConfirmSubscriptionUseCase {
  constructor(
    @Inject(NEWSLETTER_REPOSITORY)
    private readonly depot: INewsletterRepository,
  ) {}

  async execute(jeton: string): Promise<AbonnementConfirme> {
    const lien = lienValable(await this.depot.trouverLeLien(jeton));
    return this.depot.sousVerrouDeLaBoite(lien.boite, async (depot) => {
      lienValable(await depot.trouverLeLien(jeton));
      const abonne = await depot.trouverParBoite(lien.boite);
      if (abonne === null) {
        throw new LienInvalideError();
      }
      await depot.mettreAJour({
        ...abonne,
        status: 'confirmed',
        locale: lien.locale,
      });
      return { status: 'confirmed', locale: lien.locale };
    });
  }
}
