import * as moteur from './briques';

export const GRAVURE_DE_GALTON = moteur.gravureDuDomainePublic({
  id: 'M7',
  chemin: '/assets/cours/gravures/v1/galton-correlation-1875.jpg',
  pageSource:
    'https://commons.wikimedia.org/wiki/File:Galton%27s_correlation_diagram_1875.jpg',
  auteur: 'Francis Galton',
  date: '1875',
});

export const GRAVURE_DE_BOOLE = moteur.gravureDuDomainePublic({
  id: 'M7',
  chemin: '/assets/cours/gravures/v1/boole-lois-de-la-pensee-1854.jpg',
  pageSource:
    'https://commons.wikimedia.org/wiki/File:An_Investigation_of_the_Laws_of_Thought_(1854,_Boole,_investigationofl00boolrich).djvu',
  auteur: 'George Boole, An Investigation of the Laws of Thought',
  date: '1854',
});
