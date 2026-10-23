import { estObjet } from '../../../../common/domain/est-objet';
import { cueillirDansArbre } from '../../domain/cours/ArbreDeValeurs';
import { matchesSolution, type Tolerance } from '../../domain/GradingCore';
import { CONTENUS } from './index';

const ARRONDIS_ANNONCES = [
  { annonce: /arrondie? au centime/u, pas: 0.01, decimales: 2 },
  { annonce: /arrondie? au dixième/u, pas: 0.1, decimales: 1 },
  { annonce: /arrondi[er]? à l’(?:unité|euro)/u, pas: 1, decimales: 0 },
] as const;

const TOLERANCES_VOULUES = new Set(['b2-05-a4-e4-cout']);

interface ReponseChiffree {
  readonly id: string;
  readonly valeur: number;
  readonly tolerance: Tolerance;
}

function reponseChiffree(element: unknown): ReponseChiffree | null {
  if (!estObjet(element) || typeof element['id'] !== 'string') {
    return null;
  }
  if (element['type'] === 'numeric') {
    return {
      id: element['id'],
      valeur: element['solution'] as number,
      tolerance: element['tolerance'] as Tolerance,
    };
  }
  const corrige = element['corrige'];
  if (
    element['type'] === 'enigme' &&
    estObjet(corrige) &&
    estObjet(corrige['solution']) &&
    corrige['solution']['type'] === 'nombre'
  ) {
    return {
      id: element['id'],
      valeur: corrige['solution']['valeur'] as number,
      tolerance: corrige['solution']['tolerance'] as Tolerance,
    };
  }
  return null;
}

const ENONCES = new Map(
  CONTENUS.flatMap((contenu) =>
    cueillirDansArbre(contenu.ecrans, (_cle, element) =>
      estObjet(element) &&
      typeof element['id'] === 'string' &&
      typeof element['enonce'] === 'string'
        ? [[element['id'], element['enonce']] as const]
        : null,
    ),
  ),
);

const REPONSES_ARRONDIES = CONTENUS.flatMap((contenu) =>
  cueillirDansArbre(contenu.ecrans, (_cle, element) => {
    const reponse = reponseChiffree(element);
    return reponse === null ? null : [reponse];
  }),
).flatMap((reponse) => {
  const enonce = ENONCES.get(reponse.id) ?? '';
  const arrondi = ARRONDIS_ANNONCES.find(({ annonce }) => annonce.test(enonce));
  return arrondi === undefined || TOLERANCES_VOULUES.has(reponse.id)
    ? []
    : [{ ...reponse, ...arrondi }];
});

describe('arrondis annoncés par l énoncé', () => {
  it('trouve des réponses à l unité, au dixième et au centime dans les cours servis', () => {
    expect(
      new Set(REPONSES_ARRONDIES.map(({ decimales }) => decimales)),
    ).toEqual(new Set([0, 1, 2]));
  });

  it('exprime chaque arrondi annoncé par la tolérance en décimales du même rang, une seule règle', () => {
    expect(
      REPONSES_ARRONDIES.filter(
        ({ tolerance, decimales }) =>
          tolerance.type !== 'decimales' || tolerance.valeur !== decimales,
      ).map(({ id }) => id),
    ).toEqual([]);
  });

  it.each(REPONSES_ARRONDIES.map((reponse) => [reponse.id, reponse] as const))(
    '%s accepte la valeur arrondie comme annoncé, refuse un pas de plus ou de moins',
    (_id, { valeur, tolerance, pas, decimales }) => {
      const publiee = Number(valeur.toFixed(decimales));

      expect(
        [publiee - pas, publiee, publiee + pas].map((saisie) =>
          matchesSolution(Number(saisie.toFixed(decimales)), valeur, tolerance),
        ),
      ).toEqual([false, true, false]);
    },
  );

  it('garde la tolérance voulue et écrite dans la correction de b2-05-a4-e4', () => {
    expect(ENONCES.get('b2-05-a4-e4-cout')).toMatch(/arrondi au centime/u);
  });
});
