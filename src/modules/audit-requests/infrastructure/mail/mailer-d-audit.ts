import { Inject } from '@nestjs/common';
import type {
  CourrielHtml,
  ExpediteurDeCourriels,
} from '../../../../common/infrastructure/mail/expediteur-smtp';
import { expediteurDesCourriels } from '../../../../config/adresses-de-courriel';
import { EXPEDITEUR_D_AUDIT } from './expediteur-d-audit.provider';

export abstract class MailerDAudit {
  constructor(
    @Inject(EXPEDITEUR_D_AUDIT)
    private readonly expediteur: ExpediteurDeCourriels,
  ) {}

  protected envoyer(message: Omit<CourrielHtml, 'from'>): Promise<void> {
    return this.expediteur.envoyer({
      from: expediteurDesCourriels(),
      ...message,
    });
  }
}
