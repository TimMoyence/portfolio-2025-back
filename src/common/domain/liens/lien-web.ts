import { z } from 'zod';

const LONGUEUR_MAX_D_UN_LIEN = 2048;

const lienWeb = (motif: RegExp) =>
  z.url().max(LONGUEUR_MAX_D_UN_LIEN).regex(motif);

export const lienHttp = lienWeb(/^https?:\/\/\S+$/);
export const lienHttps = lienWeb(/^https:\/\/\S+$/);
