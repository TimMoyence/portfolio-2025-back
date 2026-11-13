import { Logger } from '@nestjs/common';
import type { Transporter } from 'nodemailer';
import { expediteurDesCourriels } from '../../../config/adresses-de-courriel';
import { enArrierePlan } from '../../application/en-arriere-plan';
import { messageDErreur } from '../../domain/errors/message-d-erreur';
import { RefusDuDestinataire } from '../../domain/errors/RefusDuDestinataire';
import { lienHttp } from '../../domain/liens/lien-web';
import {
  htmlEmis,
  type EscapedHtml,
} from '../../domain/texte/nettoyage/html-escape.util';
import { TYPES_DE_FICHIER } from '../../domain/types/types-de-fichier';
import { createOptionalSmtpTransporter } from './smtp-transporter.util';

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
  readonly attachments?: readonly PieceJointe[];
  readonly desabonnementEnUnClic?: string;
}

export interface CompteurDEnvois {
  compter(maintenant: Date): Promise<void>;
}

let compteurEnregistre: CompteurDEnvois | null = null;
const JOURNAL_DU_COMPTE = new Logger('CompteurDesEnvois');

export const COMPTEUR_DES_ENVOIS = {
  enregistrer(compteur: CompteurDEnvois | null): void {
    compteurEnregistre = compteur;
  },
};

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
    await this.#transporter
      .sendMail({
        from: texteAdmis(courriel.from, 'from'),
        to: texteAdmis(courriel.to, 'to'),
        replyTo: texteAdmis(courriel.replyTo, 'replyTo'),
        subject: texteAdmis(courriel.subject, 'subject'),
        text: texteAdmis(courriel.text, 'text'),
        html: htmlEmis(courriel.html),
        attachments:
          courriel.attachments === undefined
            ? undefined
            : Array.from(courriel.attachments, pieceJointeAdmise),
        headers:
          courriel.desabonnementEnUnClic === undefined
            ? undefined
            : enTetesDeDesabonnement(courriel.desabonnementEnUnClic),
      })
      .catch(traduireLeRefus);
    if (compteurEnregistre !== null) {
      enArrierePlan(
        compteurEnregistre.compter(new Date()),
        'Compte des envois du jour en échec',
        JOURNAL_DU_COMPTE,
      );
    }
  }
}

const PREMIER_CODE_DE_REFUS_DEFINITIF = 500;
const DERNIER_CODE_DE_REFUS_DEFINITIF = 599;

function traduireLeRefus(erreur: unknown): never {
  const { responseCode, command } = (erreur ?? {}) as {
    responseCode?: unknown;
    command?: unknown;
  };
  if (
    typeof responseCode === 'number' &&
    responseCode >= PREMIER_CODE_DE_REFUS_DEFINITIF &&
    responseCode <= DERNIER_CODE_DE_REFUS_DEFINITIF &&
    command === 'RCPT TO'
  ) {
    throw new RefusDuDestinataire(messageDErreur(erreur));
  }
  throw erreur;
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

function enTetesDeDesabonnement(url: string): Record<string, string> {
  if (!lienHttp.safeParse(url).success) {
    throw new Error('Lien de désabonnement de courriel refusé');
  }
  return {
    'List-Unsubscribe': `<${url}>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
  };
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
