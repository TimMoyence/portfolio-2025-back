import type { Cours } from '../Cours';
import type { ICatalogueCours } from '../ICatalogueCours.port';
import { B1_01_PROPORTIONS } from './b1-01-proportions';
import { creerCatalogue } from './Catalogue';

export const COURS_PUBLIES: readonly Cours[] = [B1_01_PROPORTIONS];

export const CATALOGUE_COURS_STATIQUE: ICatalogueCours =
  creerCatalogue(COURS_PUBLIES);
