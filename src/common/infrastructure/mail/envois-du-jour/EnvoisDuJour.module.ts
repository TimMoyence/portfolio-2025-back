import {
  Global,
  Module,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import { BUDGET_DES_ENVOIS } from '../../../application/budget-des-envois';
import { CompteurDesEnvoisTypeOrm } from './compteur-des-envois.typeorm';
import { COMPTEUR_DES_ENVOIS } from '../expediteur-smtp';

@Global()
@Module({
  providers: [
    CompteurDesEnvoisTypeOrm,
    { provide: BUDGET_DES_ENVOIS, useExisting: CompteurDesEnvoisTypeOrm },
  ],
  exports: [BUDGET_DES_ENVOIS],
})
export class EnvoisDuJourModule implements OnModuleInit, OnModuleDestroy {
  constructor(private readonly compteur: CompteurDesEnvoisTypeOrm) {}

  onModuleInit(): void {
    COMPTEUR_DES_ENVOIS.enregistrer(this.compteur);
  }

  onModuleDestroy(): void {
    COMPTEUR_DES_ENVOIS.enregistrer(null);
  }
}
