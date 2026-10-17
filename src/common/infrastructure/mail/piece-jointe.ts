import { TYPES_DE_FICHIER } from '../../domain/types/types-de-fichier';
import type { PieceJointe } from './expediteur-smtp';

export function pieceJointePdf(nom: string, contenu: Buffer): PieceJointe {
  return { filename: nom, content: contenu, contentType: TYPES_DE_FICHIER.pdf };
}

export function pieceJointeCsv(nom: string, contenu: Uint8Array): PieceJointe {
  return {
    filename: nom,
    content: Buffer.from(contenu),
    contentType: TYPES_DE_FICHIER.csv,
  };
}
