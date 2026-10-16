import { Logger, Provider } from '@nestjs/common';
import {
  expediteurDeCourriels,
  type ExpediteurDeCourriels,
} from '../../../../common/infrastructure/mail/expediteur-smtp';

export const EXPEDITEUR_D_AUDIT = Symbol('EXPEDITEUR_D_AUDIT');

export const ExpediteurDAuditProvider: Provider = {
  provide: EXPEDITEUR_D_AUDIT,
  useFactory: (): ExpediteurDeCourriels =>
    expediteurDeCourriels(
      new Logger('ExpediteurDAuditProvider'),
      'Audit request mailer',
    ),
};
