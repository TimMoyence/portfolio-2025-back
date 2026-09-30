import type { ContenuDeCours } from '../../domain/cours/CoursStocke';
import { typographierEnProfondeur } from '../../domain/cours/Typographie';
import { COURS_B2_01 } from './b2-01.cours';
import { COURS_B2_02 } from './b2-02.cours';
import { COURS_B2_03 } from './b2-03.cours';
import { COURS_B2_04 } from './b2-04.cours';
import { COURS_B2_05 } from './b2-05.cours';

function publiable(contenu: ContenuDeCours): ContenuDeCours {
  return typographierEnProfondeur(contenu);
}

export const CONTENUS: readonly [
  ContenuDeCours,
  ContenuDeCours,
  ContenuDeCours,
  ContenuDeCours,
  ContenuDeCours,
] = [
  publiable(COURS_B2_01),
  publiable(COURS_B2_02),
  publiable(COURS_B2_03),
  publiable(COURS_B2_04),
  publiable(COURS_B2_05),
];
