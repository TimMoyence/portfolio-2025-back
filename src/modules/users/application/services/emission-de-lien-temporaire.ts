import type { Logger } from '@nestjs/common';
import { lienAvecJeton } from '../../../../common/domain/lien-avec-jeton';
import { emettreJeton } from '../../domain/TokenHash';
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
  remplacerLesLiensActifs(jeton: JetonDeLienAEnregistrer): Promise<unknown>;
  envoyer(envoi: EnvoiDeLienTemporaire): Promise<void>;
}

export async function emettreUnLienTemporaire(
  destinataire: User,
  userId: string,
  canal: CanalDeLienTemporaire,
  logger: Logger,
): Promise<void> {
  const jeton = emettreJeton();

  await canal.remplacerLesLiensActifs({
    userId,
    tokenHash: jeton.empreinte,
    expiresAt: new Date(Date.now() + canal.dureeDeValiditeMs),
  });

  void canal
    .envoyer({
      email: destinataire.email,
      firstName: destinataire.firstName,
      lastName: destinataire.lastName,
      url: lienAvecJeton(canal.adresseDeBase, jeton.brut),
      expiresInMinutes: canal.dureeDeValiditeMs / MINUTE_MS,
    })
    .catch((error: unknown) =>
      logger.error(
        `${canal.echecDEnvoi} for ${destinataire.email}: ${String(error)}`,
      ),
    );
}
