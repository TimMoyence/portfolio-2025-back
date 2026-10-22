import { Raw } from 'typeorm';

const DEBUT_DE_LA_FENETRE =
  'LOCALTIMESTAMP - make_interval(secs => :ancienneteEnSecondes)';

const parametresDeLaFenetre = (ancienneteMs: number) => ({
  ancienneteEnSecondes: ancienneteMs / 1000,
});

function compareeALHorlogeDeLaBase(
  comparaison: '>' | '<',
  ancienneteMs: number,
) {
  return Raw(
    (colonne) => `${colonne} ${comparaison} ${DEBUT_DE_LA_FENETRE}`,
    parametresDeLaFenetre(ancienneteMs),
  );
}

export const poseeDepuisMoinsDe = (ancienneteMs: number) =>
  compareeALHorlogeDeLaBase('>', ancienneteMs);

export const poseeIlYAPlusDe = (ancienneteMs: number) =>
  compareeALHorlogeDeLaBase('<', ancienneteMs);

export const poseeIlYAPlusDeMois = (mois: number) =>
  Raw(
    (colonne) => `${colonne} < LOCALTIMESTAMP - make_interval(months => :mois)`,
    {
      mois,
    },
  );

export function secondesAvantDeSortirDeLaFenetre(
  colonne: string,
  ancienneteMs: number,
) {
  return {
    selection: `EXTRACT(EPOCH FROM ${colonne} - (${DEBUT_DE_LA_FENETRE}))`,
    parametres: parametresDeLaFenetre(ancienneteMs),
  };
}
