import * as moteur from '../../briques';

export const COLLER_LE_TEXTE_SEUL =
  'clic droit › Options de collage › Conserver uniquement le texte';

export const EN_TETE_INVENTE: moteur.PageDeWord['blocks'][number] = {
  style: 'normal',
  align: 'right',
  runs: [{ text: 'Fournil du Port · exemple inventé', tone: 'muted' }],
};

export const pageDuFournil = (
  page: Omit<moteur.PageDeWord, 'orientation' | 'header'>,
): moteur.PageDeWord => ({
  orientation: 'portrait',
  header: EN_TETE_INVENTE,
  ...page,
});

export const pageDeTraitementDeTexte = moteur.pageDessineeDeLaSerie({
  nom: 'Traitement de texte',
  pages: 11,
});

export const GRAVURE_DE_LA_MACHINE_A_ECRIRE = moteur.gravureDuDomainePublic({
  id: 'M1',
  chemin: '/assets/cours/gravures/v1/machine-a-ecrire-1872.jpg',
  pageSource: 'https://commons.wikimedia.org/wiki/File:Sholesglidden4.png',
  auteur: 'Scientific American, machine à écrire Sholes et Glidden',
  date: '1872',
});

export const FOND_DE_LA_MACHINE_A_ECRIRE = {
  bgImage: GRAVURE_DE_LA_MACHINE_A_ECRIRE.chemins[0],
  bgImageAlt:
    'Gravure du Scientific American (1872) : une jeune femme tape à la machine à écrire Sholes et Glidden',
};
