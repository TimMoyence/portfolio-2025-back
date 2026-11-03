import type { ContenuAPublier } from './stockage/CoursStocke';

export interface IPublicationDesCours {
  empreintePubliee(slug: string): Promise<string | null>;
  publier(contenu: ContenuAPublier, empreinte: string): Promise<number>;
}
