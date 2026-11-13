import { Inject, Injectable } from '@nestjs/common';
import { LienInvalideError } from '../../../common/domain/errors/auth/LienInvalideError';
import type { INewsletterRepository } from '../domain/INewsletterRepository';
import { NEWSLETTER_REPOSITORY } from '../domain/token';

export interface Desabonnement {
  readonly status: 'unsubscribed';
}

const DESABONNE: Desabonnement = { status: 'unsubscribed' };

@Injectable()
export class UnsubscribeNewsletterUseCase {
  constructor(
    @Inject(NEWSLETTER_REPOSITORY)
    private readonly depot: INewsletterRepository,
  ) {}

  async execute(jeton: string): Promise<Desabonnement> {
    const lu = await this.depot.trouverParJetonDeDesabonnement(jeton);
    if (lu === null) {
      throw new LienInvalideError();
    }
    return this.depot.sousVerrouDeLaBoite(lu.boite, async (depot) => {
      const abonne = await depot.trouverParBoite(lu.boite);
      if (abonne === null) {
        throw new LienInvalideError();
      }
      if (abonne.status !== 'unsubscribed') {
        await depot.mettreAJour({ ...abonne, status: 'unsubscribed' });
        await depot.supprimerLesLiensDe(abonne.boite);
      }
      return DESABONNE;
    });
  }
}
