import { Raw } from 'typeorm';

function compareeALHorlogeDeLaBase(
  comparaison: '>' | '<',
  ancienneteMs: number,
) {
  return Raw(
    (colonne) =>
      `${colonne} ${comparaison} LOCALTIMESTAMP - make_interval(secs => :ancienneteEnSecondes)`,
    { ancienneteEnSecondes: ancienneteMs / 1000 },
  );
}

export const poseeDepuisMoinsDe = (ancienneteMs: number) =>
  compareeALHorlogeDeLaBase('>', ancienneteMs);

export const poseeIlYAPlusDe = (ancienneteMs: number) =>
  compareeALHorlogeDeLaBase('<', ancienneteMs);
