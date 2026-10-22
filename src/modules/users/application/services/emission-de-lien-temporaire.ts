import type { Logger } from '@nestjs/common';
import { enArrierePlan } from '../../../../common/application/en-arriere-plan';
import { lienAvecJeton } from '../../../../common/domain/lien-avec-jeton';
import {
  TROIS_ENVOIS_PAR_HEURE,
  type PlafondDEnvois,
} from '../../domain/PlafondDEnvois';
import { emettreJeton } from '../../../../common/domain/crypto/TokenHash';
import type { User } from '../../domain/User';

const MINUTE_MS = 60_000;

interface JetonDeLienAEnregistrer {
  readonly userId: string;
  readonly tokenHash: string;
  readonly expiresAt: Date;
}

interface EnvoiDeLienTemporaire {
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly url: string;
  readonly expiresInMinutes: number;
}

export interface CanalDeLienTemporaire {
  readonly dureeDeValiditeMs: number;
  readonly adresseDeBase: string;
  readonly echecDEnvoi: string;
  remplacerLesLiensActifs(
    jeton: JetonDeLienAEnregistrer,
    plafond: PlafondDEnvois,
  ): Promise<object | null>;
  envoyer(envoi: EnvoiDeLienTemporaire): Promise<void>;
}

export async function emettreUnLienTemporaire(
  destinataire: User,
  userId: string,
  canal: CanalDeLienTemporaire,
  logger: Logger,
): Promise<void> {
  const jeton = emettreJeton();

  const enregistre = await canal.remplacerLesLiensActifs(
    {
      userId,
      tokenHash: jeton.empreinte,
      expiresAt: new Date(Date.now() + canal.dureeDeValiditeMs),
    },
    TROIS_ENVOIS_PAR_HEURE,
  );
  if (enregistre === null) {
    return;
  }

  enArrierePlan(
    canal.envoyer({
      email: destinataire.email,
      firstName: destinataire.firstName,
      lastName: destinataire.lastName,
      url: lienAvecJeton(canal.adresseDeBase, jeton.brut),
      expiresInMinutes: canal.dureeDeValiditeMs / MINUTE_MS,
    }),
    `${canal.echecDEnvoi} for user ${destinataire.id ?? 'inconnu'}`,
    logger,
  );
}
