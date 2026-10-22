import { Raw } from 'typeorm';

interface FenetreDeLaBase {
  readonly debut: string;
  readonly parametres: Readonly<Record<string, number>>;
}

const fenetreEnMillisecondes = (ancienneteMs: number): FenetreDeLaBase => ({
  debut: 'LOCALTIMESTAMP - make_interval(secs => :ancienneteEnSecondes)',
  parametres: { ancienneteEnSecondes: ancienneteMs / 1000 },
});

const fenetreEnMois = (mois: number): FenetreDeLaBase => ({
  debut: 'LOCALTIMESTAMP - make_interval(months => :ancienneteEnMois)',
  parametres: { ancienneteEnMois: mois },
});

function compareeALHorlogeDeLaBase(
  comparaison: '>' | '<',
  fenetre: FenetreDeLaBase,
) {
  return Raw(
    (colonne) => `${colonne} ${comparaison} ${fenetre.debut}`,
    fenetre.parametres,
  );
}

export const poseeDepuisMoinsDe = (ancienneteMs: number) =>
  compareeALHorlogeDeLaBase('>', fenetreEnMillisecondes(ancienneteMs));

export const poseeIlYAPlusDe = (ancienneteMs: number) =>
  compareeALHorlogeDeLaBase('<', fenetreEnMillisecondes(ancienneteMs));

export const poseeIlYAPlusDeMois = (mois: number) =>
  compareeALHorlogeDeLaBase('<', fenetreEnMois(mois));

export function secondesAvantDeSortirDeLaFenetre(
  colonne: string,
  ancienneteMs: number,
) {
  const fenetre = fenetreEnMillisecondes(ancienneteMs);
  return {
    selection: `EXTRACT(EPOCH FROM ${colonne} - (${fenetre.debut}))`,
    parametres: fenetre.parametres,
  };
}
