import { existsSync } from 'node:fs';
import { buildCoursDuContenu } from '../../../../../test/factories/contenus-de-cours.factory';
import {
  cheminDuClasseur,
  classeursReservesDe,
  octetsDuClasseur,
} from '../../../../../test/helpers/classeurs-reserves';
import { CLASSEURS_B3_01 } from '../contenus/b3-01.donnees';
import { CONTENUS } from '../contenus';
import { ClasseursSurDisque } from './ClasseursSurDisque';

const classeursReserves = (): string[] =>
  CONTENUS.flatMap((contenu) =>
    classeursReservesDe(buildCoursDuContenu(contenu)).map(
      ({ classeur }) => classeur,
    ),
  );

describe('ClasseursSurDisque', () => {
  const classeurs = new ClasseursSurDisque();

  it('lit, octet pour octet, le classeur réservé rangé sous le dossier de son cours', async () => {
    const lu = await classeurs.lire(CLASSEURS_B3_01.repriseActe2);

    expect(Buffer.from(lu)).toEqual(
      octetsDuClasseur(CLASSEURS_B3_01.repriseActe2),
    );
  });

  it.each([
    '../contenus/b3-01.cours.ts',
    'b3-01/../../contenus/b3-01.cours.ts',
    '/etc/passwd',
    'b3-01/classeurs.manifest.json',
  ])('refuse %s, hors du format des classeurs servis', async (classeur) => {
    await expect(classeurs.lire(classeur)).rejects.toThrow(
      'Classeur hors du format servi',
    );
  });

  it('trouve sur le disque chaque classeur réservé d un cours publié', () => {
    const reserves = classeursReserves();

    expect(reserves).toEqual([
      CLASSEURS_B3_01.repriseActe2,
      CLASSEURS_B3_01.repriseActe3,
    ]);
    expect(
      reserves.filter((classeur) => !existsSync(cheminDuClasseur(classeur))),
    ).toEqual([]);
  });
});
