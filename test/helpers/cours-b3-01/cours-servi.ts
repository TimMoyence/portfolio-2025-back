import { COURS_B3_01 } from '../../../src/modules/formations/infrastructure/contenus/b3/b3-01/b3-01.cours';
import { VALEURS_B3_01 } from '../../../src/modules/formations/infrastructure/contenus/b3/b3-01/b3-01.donnees';
import { buildCoursDuContenu } from '../../factories/formations/cours/contenus-de-cours.factory';

export const COURS_B3_01_SERVI = buildCoursDuContenu(COURS_B3_01);

export const VALEURS_B3_01_PAR_QUESTION: Readonly<
  Record<string, number | string>
> = Object.fromEntries(Object.entries(VALEURS_B3_01));
