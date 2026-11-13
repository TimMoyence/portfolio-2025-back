import type { Logger } from '@nestjs/common';
import { enArrierePlan } from '../../../../../common/application/en-arriere-plan';
import { lienAvecJeton } from '../../../../../common/domain/liens/lien-avec-jeton';
import {
  TROIS_ENVOIS_PAR_HEURE,
  type PlafondDEnvois,
} from '../../../domain/notifications/PlafondDEnvois';
import { emettreJeton } from '../../../../../common/domain/crypto/TokenHash';
import {
  LOCALES_SUPPORTEES,
  type SupportedLocale,
} from '../../../../../common/domain/value-objects/LocaleCode';
import type { User } from '../../../domain/User';

const MINUTE_MS = 60_000;
const LANGUE_SANS_PREFIXE: SupportedLocale = 'fr';

const PREFIXE_DE_LANGUE = new RegExp(
  `^/(${LOCALES_SUPPORTEES.join('|')})(?=/|$)`,
);

function dansLaLangue(adresse: string, locale: SupportedLocale): string {
  if (!URL.canParse(adresse)) {
    return adresse;
  }
  const url = new URL(adresse);
  const prefixe =
    PREFIXE_DE_LANGUE.exec(url.pathname)?.[1] ?? LANGUE_SANS_PREFIXE;
  if (prefixe === locale) {
    return adresse;
  }
  const chemin = url.pathname.replace(PREFIXE_DE_LANGUE, '');
  url.pathname =
    locale === LANGUE_SANS_PREFIXE ? chemin : `/${locale}${chemin}`;
  return url.toString();
}

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
  readonly locale: SupportedLocale;
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
      url: lienAvecJeton(
        dansLaLangue(canal.adresseDeBase, destinataire.locale),
        jeton.brut,
      ),
      expiresInMinutes: canal.dureeDeValiditeMs / MINUTE_MS,
      locale: destinataire.locale,
    }),
    `${canal.echecDEnvoi} for user ${destinataire.id ?? 'inconnu'}`,
    logger,
  );
}
