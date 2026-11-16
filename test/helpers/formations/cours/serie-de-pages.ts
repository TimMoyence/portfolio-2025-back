import type { ContenuDeCours } from '../../../../src/modules/formations/domain/cours/stockage/CoursStocke';
import { presentationDe } from '../../../../src/modules/formations/domain/cours/structure/Cours';
import { proprietesV2 } from './feuille-de-cours';

export const ORDRE_DU_TEXTE = ['Syntaxe : ', 'Le piège : ', 'Exemple : '];
const DUREE_D_UNE_PAGE = 2;

export const debutsDe = (paragraphs: readonly string[]): string[] =>
  paragraphs.map((paragraphe) =>
    paragraphe.slice(0, paragraphe.indexOf(':') + 2),
  );

export const pagesDessineesDe = (contenu: ContenuDeCours) =>
  contenu.ecrans.filter((ecran) => presentationDe(ecran)?.renderer === 'page');

export const serieServie = (contenu: ContenuDeCours) =>
  pagesDessineesDe(contenu).map(({ screenId, dureeMinutes }) => {
    const { paragraphs } = proprietesV2(contenu, screenId) as {
      paragraphs: string[];
    };
    return {
      dureeMinutes,
      debuts: debutsDe(paragraphs),
    };
  });

export const serieAttendue = (pages: number) =>
  Array.from({ length: pages }, () => ({
    dureeMinutes: DUREE_D_UNE_PAGE,
    debuts: ORDRE_DU_TEXTE,
  }));
