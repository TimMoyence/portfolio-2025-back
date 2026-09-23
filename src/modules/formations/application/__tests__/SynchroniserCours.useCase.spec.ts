/* eslint-disable @typescript-eslint/unbound-method */
import {
  buildContenuAPublierB2_01,
  createMockPublicationDesCours,
} from '../../../../../test/factories/cours-b2-01.factory';
import { ContenuDeCoursInvalideError } from '../../domain/cours/CoursStocke';
import { empreinteCanonique } from '../../domain/cours/EmpreinteCanonique';
import { CoursNonConformeError } from '../../domain/errors/FormationErrors';
import { SynchroniserCoursUseCase } from '../SynchroniserCours.useCase';

function montage() {
  const publication = createMockPublicationDesCours();
  return { publication, sut: new SynchroniserCoursUseCase(publication) };
}

describe('SynchroniserCoursUseCase', () => {
  const contenu = buildContenuAPublierB2_01();
  const empreinte = empreinteCanonique(contenu);

  it('publie le cours quand aucune empreinte n’est encore publiée', async () => {
    const { publication, sut } = montage();

    const issues = await sut.execute([contenu]);

    expect(publication.empreintePubliee).toHaveBeenCalledWith(contenu.slug);
    expect(publication.publier).toHaveBeenCalledWith(contenu, empreinte);
    expect(issues).toEqual([
      { slug: contenu.slug, statut: 'publie', version: 1 },
    ]);
  });

  it('ne publie rien quand le cours publié porte déjà la même empreinte', async () => {
    const { publication, sut } = montage();
    publication.empreintePubliee.mockResolvedValue(empreinte);

    const issues = await sut.execute([contenu]);

    expect(publication.publier).not.toHaveBeenCalled();
    expect(issues).toEqual([{ slug: contenu.slug, statut: 'a-jour' }]);
  });

  it('publie le cours corrigé quand son empreinte a changé', async () => {
    const { publication, sut } = montage();
    publication.empreintePubliee.mockResolvedValue('empreinte-precedente');
    publication.publier.mockResolvedValue(7);

    const issues = await sut.execute([contenu]);

    expect(publication.publier).toHaveBeenCalledWith(contenu, empreinte);
    expect(issues).toEqual([
      { slug: contenu.slug, statut: 'publie', version: 7 },
    ]);
  });

  it('refuse un cours dont la structure est fautive, sans rien publier', async () => {
    const { publication, sut } = montage();
    const fautif = { ...contenu, dureeMinutes: contenu.dureeMinutes + 1 };

    await expect(sut.execute([fautif])).rejects.toThrow(CoursNonConformeError);
    await expect(sut.execute([fautif])).rejects.toThrow(/duree-cours/);
    expect(publication.publier).not.toHaveBeenCalled();
  });

  it('refuse un écran sans titre public, sans rien publier', async () => {
    const { publication, sut } = montage();
    const [premier, ...suivants] = contenu.ecrans;
    const sansTitre = {
      ...contenu,
      ecrans: [{ ...premier, titre: null }, ...suivants],
    };

    await expect(sut.execute([sansTitre])).rejects.toThrow(
      ContenuDeCoursInvalideError,
    );
    expect(publication.publier).not.toHaveBeenCalled();
  });

  it('valide tous les cours avant d’en publier un seul', async () => {
    const { publication, sut } = montage();
    const fautif = {
      ...contenu,
      slug: 'autre-cours',
      dureeMinutes: contenu.dureeMinutes + 1,
    };

    await expect(sut.execute([contenu, fautif])).rejects.toThrow(
      CoursNonConformeError,
    );
    expect(publication.empreintePubliee).not.toHaveBeenCalled();
    expect(publication.publier).not.toHaveBeenCalled();
  });
});
