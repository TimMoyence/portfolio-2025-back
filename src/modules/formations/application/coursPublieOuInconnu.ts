import type {
  CoursPublie,
  ICatalogueCours,
} from '../domain/cours/ICatalogueCours.port';
import { CoursInconnuError } from '../domain/errors/FormationErrors';

export async function coursPublieOuInconnu(
  catalogue: ICatalogueCours,
  slug: string,
): Promise<CoursPublie> {
  const publie = await catalogue.trouverCourant(slug);
  if (publie === null) {
    throw new CoursInconnuError(slug);
  }
  return publie;
}
