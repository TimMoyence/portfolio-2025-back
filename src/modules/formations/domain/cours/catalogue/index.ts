import type { Cours } from '../Cours';
import type { ICatalogueCours } from '../ICatalogueCours.port';
import { B2_01_TRAITEMENT_INFORMATION_CHIFFREE } from './b2-01-traitement-information-chiffree';
import { creerCatalogue } from './Catalogue';

export const COURS_PUBLIES: readonly Cours[] = [
  B2_01_TRAITEMENT_INFORMATION_CHIFFREE,
];

export const CATALOGUE_COURS_STATIQUE: ICatalogueCours =
  creerCatalogue(COURS_PUBLIES);
