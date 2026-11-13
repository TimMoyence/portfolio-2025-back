import * as feuille from '../../../../../../../test/helpers/formations/cours/feuille-de-cours';
import { ecranDuContenu } from '../../../../../../../test/helpers/formations/cours/fiche-de-cours';
import { COURS_B2_09 } from './b2-09.cours';

const ECRAN = 'B2-09-A4-07-ATELIER-INDEPENDANCE';

const intersectionDeLEnonce = (): number => {
  const [, ecrite] =
    /P\(M ∩ B\) = (\d+,\d+)/u.exec(feuille.texteDeLEcran(COURS_B2_09, ECRAN)) ??
    [];
  return Number(String(ecrite).replace(',', '.'));
};

const piegesDeLaQuestion = (id: string): unknown => {
  const trouvees: unknown[] = [];
  const parcourir = (noeud: unknown): void => {
    if (typeof noeud !== 'object' || noeud === null) {
      return;
    }
    if ('id' in noeud && noeud.id === id && 'pieges' in noeud) {
      trouvees.push(noeud.pieges);
    }
    Object.values(noeud).forEach(parcourir);
  };
  parcourir(ecranDuContenu(COURS_B2_09, ECRAN));
  return trouvees[0];
};

describe('B2-09 — le piège de l’intersection vient de l’énoncé', () => {
  it('B209-06 · à l’exercice 5, confondre P_M(B) et P(M ∩ B) fait répondre l’intersection donnée par l’énoncé', () => {
    expect(intersectionDeLEnonce()).toBeCloseTo(0.12);
    expect(piegesDeLaQuestion('b2-09-a4-mobile')).toContainEqual({
      valeur: intersectionDeLEnonce(),
      confusion: 'intersection-pour-conditionnelle',
    });
  });
});
