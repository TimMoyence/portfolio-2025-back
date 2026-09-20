import { InsufficientPermissionsError } from '../../../../common/domain/errors/InsufficientPermissionsError';
import {
  buildCoursDeClasse,
  buildCoursDeTest,
  creerCatalogueAVersions,
} from '../../../../../test/factories/cours.factory';
import {
  buildActeurFormation,
  buildAdministrateur,
} from '../../../../../test/factories/formation.factory';
import type { ICatalogueCours } from '../../domain/cours/ICatalogueCours.port';
import { VersionNonPubliableError } from '../../domain/errors/FormationErrors';
import { PublierVersionUseCase } from '../PublierVersion.useCase';

const INITIALE = buildCoursDeTest();
const SUIVANTE = { ...buildCoursDeClasse(3), slug: INITIALE.slug };

describe('PublierVersionUseCase', () => {
  let catalogue: ICatalogueCours;
  let sut: PublierVersionUseCase;

  beforeEach(() => {
    catalogue = creerCatalogueAVersions({
      [INITIALE.slug]: { 1: INITIALE, 2: SUIVANTE },
    });
    sut = new PublierVersionUseCase(catalogue);
  });

  it('bascule la version publiee au catalogue', async () => {
    const publiee = await sut.execute(INITIALE.slug, 1, buildAdministrateur());

    expect(publiee.versionPubliee).toBe(1);
    expect(Date.parse(publiee.publieeLe)).not.toBeNaN();
    await expect(
      catalogue.trouverCourant(INITIALE.slug),
    ).resolves.toMatchObject({ version: 1 });
  });

  it('rebascule vers une autre version sans rien supprimer', async () => {
    await sut.execute(INITIALE.slug, 1, buildAdministrateur());

    await sut.execute(INITIALE.slug, 2, buildAdministrateur());

    await expect(
      catalogue.trouverCourant(INITIALE.slug),
    ).resolves.toMatchObject({ version: 2 });
    await expect(catalogue.trouver(INITIALE.slug, 1)).resolves.not.toBeNull();
  });

  it('refuse un formateur sans role administrateur', async () => {
    await expect(
      sut.execute(INITIALE.slug, 1, buildActeurFormation()),
    ).rejects.toThrow(InsufficientPermissionsError);
  });

  it('refuse une version inconnue du cours', async () => {
    await expect(
      sut.execute(INITIALE.slug, 9, buildAdministrateur()),
    ).rejects.toThrow(VersionNonPubliableError);
  });
});
