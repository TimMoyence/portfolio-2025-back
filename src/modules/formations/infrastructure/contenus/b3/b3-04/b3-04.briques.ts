import { pageDuFournil } from '../b3-03/b3-03.briques';
import * as moteur from '../../briques';

export const pageDePublipostage = moteur.pageDessineeDeLaSerie({
  nom: 'Publipostage',
  pages: 11,
});

export const champ = (nom: string) => ({ text: `«${nom}»`, field: true });

export const lettreDuFournil = (
  ...suite: moteur.PageDeWord['blocks'][number][]
): moteur.PageDeWord =>
  pageDuFournil({
    blocks: [moteur.paragraphe([champ('enseigne')], 1), ...suite],
  });

export const GRAVURE_DU_FACTEUR = moteur.gravureDuDomainePublic({
  id: 'M1',
  chemin: '/assets/cours/gravures/v1/facteur-1860.jpg',
  pageSource:
    'https://commons.wikimedia.org/wiki/File:Le_facteur,_Paris_Musées_20230525203912.jpg',
  auteur: 'Henry Monnier, « Le facteur », gravure sur bois',
  date: '1860',
});

export const FOND_DU_FACTEUR = {
  bgImage: GRAVURE_DU_FACTEUR.chemins[0],
  bgImageAlt:
    'Gravure sur bois d’après un dessin d’Henry Monnier, « Le facteur », 1860, conservée au musée Carnavalet',
};
