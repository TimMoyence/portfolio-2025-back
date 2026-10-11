import type { Attachment } from 'nodemailer/lib/mailer';

export function pieceJointePdf(nom: string, contenu: Buffer): Attachment {
  return { filename: nom, content: contenu, contentType: 'application/pdf' };
}
