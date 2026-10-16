import { Logger } from '@nestjs/common';
import type { Transporter } from 'nodemailer';
import { expediteurDesCourriels } from '../../../config/adresses-de-courriel';
import {
  htmlEmis,
  type EscapedHtml,
} from '../../domain/texte/html-escape.util';
import { TYPES_DE_FICHIER } from '../../domain/types/types-de-fichier';
import { createOptionalSmtpTransporter } from './smtp-transporter.util';

const ENTETES_ADMIS = [
  'List-Unsubscribe',
  'List-Unsubscribe-Post',
  'List-Id',
] as const;

const TYPES_DE_PIECE_JOINTE = [
  TYPES_DE_FICHIER.pdf,
  TYPES_DE_FICHIER.csv,
] as const;

export interface PieceJointe {
  readonly filename: string;
  readonly content: Buffer;
  readonly contentType: (typeof TYPES_DE_PIECE_JOINTE)[number];
}

export interface CourrielHtml {
  readonly from?: string;
  readonly to: string;
  readonly replyTo?: string;
  readonly subject: string;
  readonly text?: string;
  readonly html: EscapedHtml;
  readonly headers?: Readonly<
    Partial<Record<(typeof ENTETES_ADMIS)[number], string>>
  >;
  readonly attachments?: readonly PieceJointe[];
}

export class ExpediteurDeCourriels {
  readonly #transporter: Pick<Transporter, 'sendMail'> | null;

  constructor(transporter: Pick<Transporter, 'sendMail'> | null) {
    this.#transporter = transporter;
  }

  get actif(): boolean {
    return this.#transporter !== null;
  }

  async envoyer(courriel: CourrielHtml): Promise<void> {
    if (!this.#transporter) return;
    await this.#transporter.sendMail({
      from: texteAdmis(courriel.from, 'from'),
      to: texteAdmis(courriel.to, 'to'),
      replyTo: texteAdmis(courriel.replyTo, 'replyTo'),
      subject: texteAdmis(courriel.subject, 'subject'),
      text: texteAdmis(courriel.text, 'text'),
      html: htmlEmis(courriel.html),
      headers: entetesAdmis(courriel.headers),
      attachments:
        courriel.attachments === undefined
          ? undefined
          : Array.from(courriel.attachments, pieceJointeAdmise),
    });
  }
}

function texteAdmis(
  valeur: string | undefined,
  champ: string,
): string | undefined {
  if (valeur !== undefined && typeof valeur !== 'string') {
    throw new Error(`Champ de courriel refusé : ${champ}`);
  }
  return valeur;
}

const ENTETES = new Set<string>(ENTETES_ADMIS);

function entetesAdmis(
  entetes: CourrielHtml['headers'],
): Record<string, string> | undefined {
  if (entetes === undefined) return undefined;
  return Object.fromEntries(
    Object.entries(entetes).map(([nom, valeur]: [string, unknown]) => {
      if (!ENTETES.has(nom) || typeof valeur !== 'string') {
        throw new Error(`En-tête de courriel refusé : ${nom}`);
      }
      return [nom, valeur];
    }),
  );
}

const TYPES = new Set<string>(TYPES_DE_PIECE_JOINTE);

function pieceJointeAdmise({
  filename,
  content,
  contentType,
}: PieceJointe): PieceJointe {
  if (
    typeof filename !== 'string' ||
    !Buffer.isBuffer(content) ||
    !TYPES.has(contentType)
  ) {
    throw new Error('Pièce jointe de courriel refusée');
  }
  return { filename, content, contentType };
}

export const expediteurDeCourriels = (
  logger: Logger,
  contexte: string,
): ExpediteurDeCourriels =>
  new ExpediteurDeCourriels(createOptionalSmtpTransporter(logger, contexte));

export abstract class ExpediteurSmtp {
  protected readonly logger: Logger;
  readonly #expediteur: ExpediteurDeCourriels;
  protected readonly from = expediteurDesCourriels();

  protected constructor(nom: string, contexte: string) {
    this.logger = new Logger(nom);
    this.#expediteur = expediteurDeCourriels(this.logger, contexte);
  }

  protected envoyer(message: Omit<CourrielHtml, 'from'>): Promise<void> {
    return this.#expediteur.envoyer({ from: this.from, ...message });
  }
}
