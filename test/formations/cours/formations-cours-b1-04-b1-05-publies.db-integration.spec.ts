import type { Cours } from '../../../src/modules/formations/domain/contrats/cours';
import { questionsDuCours } from '../../../src/modules/formations/domain/cours/structure/Cours';
import { COURS_B1_04 } from '../../../src/modules/formations/infrastructure/contenus/b1/b1-04/b1-04.cours';
import { COURS_B1_05 } from '../../../src/modules/formations/infrastructure/contenus/b1/b1-05/b1-05.cours';
import { describeDb } from '../../helpers/base/db-integration-datasource';
import {
  empreinteServie,
  lireLInstantane,
} from '../../helpers/formations/cours/instantane-de-cours';
import { contexteFormationsDeLaSuite } from '../../helpers/formations/seance/formations-db';

function relu(cours: Cours | undefined): {
  readonly publie: boolean;
  readonly cellules: number | undefined;
  readonly empreinte: string | undefined;
} {
  const [feuille] = (
    cours === undefined ? [] : questionsDuCours(cours)
  ).flatMap((question) =>
    question.type === 'feuille' && question.corrige.type === 'feuille'
      ? [question.corrige]
      : [],
  );
  return {
    publie: cours !== undefined,
    cellules: feuille?.attendus.length,
    empreinte: cours === undefined ? undefined : empreinteServie(cours),
  };
}

describeDb(
  'PUB-M1 · la synchronisation publie en base les cours B1-04 et B1-05',
  () => {
    const contexte = contexteFormationsDeLaSuite();

    it.each([
      ['B1-04', COURS_B1_04, 4],
      ['B1-05', COURS_B1_05, 12],
    ])(
      'relit le %s de la base, avec sa feuille et l’instantané livré au front',
      async (_prefixe, contenu, cellules) => {
        expect(
          relu(
            (await contexte().catalogue.trouverCourant(contenu.slug))?.cours,
          ),
        ).toEqual({
          publie: true,
          cellules,
          empreinte: lireLInstantane(contenu).empreinte,
        });
      },
    );
  },
);
