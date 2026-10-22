import { buildCoursDuContenu } from '../../../../../test/factories/contenus-de-cours.factory';
import {
  CONTENUS,
  COURS_B2_01,
} from '../../../../../test/factories/contenus-publies';
import type { Ecran } from '../contrats/cours';
import {
  curseursServis,
  POINTS_MAX_D_UN_TRACE,
  pointsDuTrace,
  refusDuReglage,
  traceCalcule,
} from './TraceServi';

const reglageServi = (
  reglable: Parameters<typeof refusDuReglage>[0],
  cle: string,
  valeur: number,
): boolean => refusDuReglage(reglable, cle, valeur) === null;

type EcranDeTrace = Extract<Ecran, { readonly brique: 'fp-plot' }>;

const TRACES_DES_COURS: readonly EcranDeTrace[] = CONTENUS.flatMap((contenu) =>
  buildCoursDuContenu(contenu).ecrans.flatMap((ecran) =>
    ecran.brique === 'fp-plot' ? [ecran] : [],
  ),
);

function traceDuB201(id: string): EcranDeTrace['proprietes'] {
  const ecran = buildCoursDuContenu(COURS_B2_01).ecrans.find(
    (candidat) => candidat.brique === 'fp-plot' && candidat.id === id,
  );
  if (ecran?.brique !== 'fp-plot') {
    throw new Error(`tracé absent du B2-01 : ${id}`);
  }
  return ecran.proprietes;
}

describe('traceCalcule', () => {
  it('sert les barres de la diapositive de Samir par année, sans position pour l origine de l axe, que la série ne lit pas', () => {
    const servi = traceCalcule(traceDuB201('B2-01-A2-02-ORIGINE-AXE'));

    expect(servi).toEqual({
      abscisses: [0, 1, 2, 3],
      positions: [
        {
          valeurs: {},
          ordonnees: { marge: [285000, 288000, 289800, 291000] },
        },
      ],
    });
  });

  it('sert le simulateur de la marketplace à chaque cran du taux, sur vingt-cinq points de chaque série', () => {
    const servi = traceCalcule(traceDuB201('B2-01-A5-04-SIMULATEUR-MIX'));
    const aSeize = servi.positions.find(
      ({ valeurs }) => valeurs.tauxMarketplace === 16,
    );

    expect({
      abscisses: [
        servi.abscisses.length,
        servi.abscisses[0],
        servi.abscisses.at(-1),
      ],
      taux: servi.positions.map(({ valeurs }) => valeurs.tauxMarketplace),
      global: [aSeize?.ordonnees.global[0], aSeize?.ordonnees.global.at(-1)],
      reference: new Set(aSeize?.ordonnees.reference),
    }).toEqual({
      abscisses: [25, 0, 80],
      taux: Array.from({ length: 21 }, (_, rang) => 10 + rang),
      global: [34.4, 18.4],
      reference: new Set([27.6]),
    });
  });

  it('rend null pour un point où la série ne se calcule pas, sans couper la courbe', () => {
    const servi = traceCalcule({
      abscisse: { min: 0, max: 2 },
      parametres: [],
      series: [{ id: 'inverse', calcul: '1/(x-1)' }],
      forme: 'barres',
    });

    expect(servi.positions[0].ordonnees.inverse).toEqual([-1, null, 1]);
  });

  it('chaque tracé des cours se sert sous le plafond de points, et rend toutes ses ordonnées à son réglage par défaut', () => {
    expect(TRACES_DES_COURS.length).toBeGreaterThan(0);
    for (const { id, proprietes } of TRACES_DES_COURS) {
      const servi = traceCalcule(proprietes);
      const parDefaut = servi.positions.find(({ valeurs }) =>
        Object.entries(valeurs).every(
          ([cle, valeur]) =>
            proprietes.parametres.find((curseur) => curseur.cle === cle)
              ?.defaut === valeur,
        ),
      );

      expect({
        id,
        sousLePlafond: pointsDuTrace(proprietes) <= POINTS_MAX_D_UN_TRACE,
        points: pointsDuTrace(proprietes),
        servis:
          servi.positions.length *
          proprietes.series.length *
          servi.abscisses.length,
        trous: Object.values(parDefaut?.ordonnees ?? { absent: [null] })
          .flat()
          .filter((ordonnee) => ordonnee === null).length,
      }).toEqual({
        id,
        sousLePlafond: true,
        points: pointsDuTrace(proprietes),
        servis: pointsDuTrace(proprietes),
        trous: 0,
      });
    }
  });
});

describe('refusDuReglage', () => {
  const trace = traceDuB201('B2-01-A2-02-ORIGINE-AXE');

  it('admet un cran du curseur et un préréglage, refuse un réglage entre deux crans ou un curseur inconnu', () => {
    expect([
      reglageServi(trace, 'origine', 0),
      reglageServi(trace, 'origine', 284000),
      reglageServi(trace, 'origine', 4000),
      reglageServi(trace, 'origine', 2000),
      reglageServi(trace, 'absent', 0),
    ]).toEqual([true, true, true, false, false]);
  });

  it('G2 · admet chaque cran d un curseur à pas décimal tel que le curseur du navigateur l écrit, sans le croire entre deux crans', () => {
    const aPasDecimal = (min: number, pas: number) => ({
      abscisse: { min: 0, max: 2 },
      parametres: [{ cle: 'k', libelle: 'k', min, max: 2, pas, defaut: min }],
      series: [{ id: 'y', calcul: 'k*x' }],
      forme: 'courbes' as const,
    });
    const ecritsParChromiumEtWebKit = {
      dixieme: ['0.1', '0.2', '0.3', '0.4', '0.5', '0.6', '0.7', '0.8', '0.9'],
      decale: ['0.4', '0.7', '1', '1.3', '1.6', '1.9'],
    };

    expect({
      dixieme: ecritsParChromiumEtWebKit.dixieme.filter(
        (ecrit) => !reglageServi(aPasDecimal(0, 0.1), 'k', Number(ecrit)),
      ),
      decale: ecritsParChromiumEtWebKit.decale.filter(
        (ecrit) => !reglageServi(aPasDecimal(0.1, 0.3), 'k', Number(ecrit)),
      ),
    }).toEqual({ dixieme: [], decale: [] });
  });
});

describe('curseursServis', () => {
  it('sert à chaque curseur ses positions : les crans du pas, le défaut et les préréglages, sans le maximum hors du pas', () => {
    expect(
      curseursServis({
        parametres: [{ cle: 'k', min: 0, max: 10, pas: 4, defaut: 5 }],
        prereglages: [{ valeurs: { k: 6 } }],
      }),
    ).toEqual([
      {
        cle: 'k',
        min: 0,
        max: 10,
        pas: 4,
        defaut: 5,
        positions: [0, 4, 5, 6, 8],
      },
    ]);
  });
});
