import type { BornesEntieres } from './env-readers.util';

export const DELAI_DE_DIFFUSION_EN_MINUTES: BornesEntieres = {
  defaut: 90,
  min: 0,
  max: 24 * 60,
};

export const TAILLE_DU_LOT_DE_DIFFUSION: BornesEntieres = {
  defaut: 200,
  min: 1,
  max: 1000,
};
