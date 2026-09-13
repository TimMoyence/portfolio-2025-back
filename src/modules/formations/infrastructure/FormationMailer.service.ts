import { Injectable, Logger } from '@nestjs/common';
import type { Transporter } from 'nodemailer';
import {
  escapeHtml,
  escapeUrl,
  safeHtml,
} from '../../../common/infrastructure/mail/html-escape.util';
import type { EscapedHtml } from '../../../common/infrastructure/mail/html-escape.util';
import { createOptionalSmtpTransporter } from '../../../common/infrastructure/mail/smtp-transporter.util';
import type {
  CopieEtudiant,
  IFormationMailer,
  RapportParticipant,
  RapportQuestion,
  RapportSession,
} from '../domain/IFormationMailer.port';

const BOM_UTF8 = '﻿';

function verdictDe(reponse: RapportQuestion): string {
  if (reponse.correcte) {
    return "c'est juste";
  }
  return reponse.misconception === null
    ? "c'est faux"
    : `c'est faux — confusion « ${reponse.misconception} »`;
}

@Injectable()
export class FormationMailerService implements IFormationMailer {
  private readonly logger = new Logger(FormationMailerService.name);
  private readonly transporter: Transporter | null;
  private readonly from = process.env.SMTP_FROM;

  constructor() {
    this.transporter = createOptionalSmtpTransporter(
      this.logger,
      'Formation mailer',
    );
  }

  async sendSyntheseFormateur(
    destinataire: string,
    rapport: RapportSession,
  ): Promise<void> {
    if (!this.transporter) {
      return;
    }
    await this.transporter.sendMail({
      from: this.from,
      to: destinataire,
      subject: `Cours ${rapport.courseSlug} — session ${rapport.code}`,
      text: this.syntheseTexte(rapport),
      html: this.syntheseHtml(rapport),
      attachments: [
        {
          filename: `session-${rapport.code}.csv`,
          content: this.toCsv(rapport),
          contentType: 'text/csv; charset=utf-8',
        },
      ],
    });
  }

  async sendCopieEtudiant(copie: CopieEtudiant): Promise<void> {
    if (!this.transporter) {
      return;
    }
    const { participant, lienRevision } = copie;
    await this.transporter.sendMail({
      from: this.from,
      to: participant.email,
      subject: `Votre copie — ${copie.courseSlug}`,
      text: this.copieTexte(participant, lienRevision),
      html: safeHtml`
        <div style="font-family:Arial,Helvetica,sans-serif; padding:24px;">
          <h2>Bonjour ${escapeHtml(participant.prenom)},</h2>
          <p>Voici le détail de vos réponses pour la session ${escapeHtml(copie.code)}.</p>
          <p>
            Note obtenue : <strong>${escapeHtml(participant.note.toFixed(1))}/20</strong>
            (complétion ${Math.round(participant.completion * 100)}%).
          </p>
          <ul>${this.copieReponsesHtml(participant.reponses)}</ul>
          <p>
            <a href="${escapeUrl(lienRevision)}">Reprendre mon entraînement</a>
          </p>
        </div>
      `,
    });
  }

  private copieReponsesHtml(
    reponses: readonly RapportQuestion[],
  ): readonly EscapedHtml[] {
    return reponses.map(
      (reponse) => safeHtml`<li>
          <strong>${escapeHtml(reponse.questionId)}</strong>
          — ${escapeHtml(reponse.concept)} : vous avez répondu
          « ${escapeHtml(reponse.valeur)} », ${escapeHtml(verdictDe(reponse))}.
        </li>`,
    );
  }

  private syntheseTexte(rapport: RapportSession): string {
    const lignes = [
      `Synthèse de la session ${rapport.code} (${rapport.courseSlug})`,
      `${rapport.participants.length} étudiant(s) ont participé.`,
      '',
    ];
    if (rapport.conceptsFragiles.length > 0) {
      lignes.push(
        `Concepts fragiles : ${rapport.conceptsFragiles.join(', ')}.`,
      );
      lignes.push('');
    }
    for (const participant of rapport.participants) {
      lignes.push(
        `${participant.prenom} ${participant.nom} : complétion ` +
          `${Math.round(participant.completion * 100)}%, note ` +
          `${participant.note.toFixed(1)}/20` +
          `${participant.sousSeuil ? ' (sous le seuil)' : ''}.`,
      );
    }
    lignes.push('');
    lignes.push('Le détail complet est joint en fichier CSV.');
    return lignes.join('\n');
  }

  private syntheseHtml(rapport: RapportSession): EscapedHtml {
    const fragilesTexte =
      rapport.conceptsFragiles.length > 0
        ? escapeHtml(rapport.conceptsFragiles.join(', '))
        : escapeHtml('aucun');
    const lignesParticipants = rapport.participants.map(
      (participant) => safeHtml`<tr>
          <td style="padding:4px 8px;">${escapeHtml(participant.prenom)} ${escapeHtml(participant.nom)}</td>
          <td style="padding:4px 8px;">${Math.round(participant.completion * 100)}%</td>
          <td style="padding:4px 8px;">${escapeHtml(participant.note.toFixed(1))}/20</td>
        </tr>`,
    );
    return safeHtml`
      <div style="font-family:Arial,Helvetica,sans-serif; padding:24px;">
        <h2>Session ${escapeHtml(rapport.code)} — ${escapeHtml(rapport.courseSlug)}</h2>
        <p>${rapport.participants.length} étudiant(s) ont participé.</p>
        <p>Concepts fragiles : ${fragilesTexte}</p>
        <table style="border-collapse:collapse;">
          ${lignesParticipants}
        </table>
        <p>Le détail complet est joint en fichier CSV.</p>
      </div>
    `;
  }

  private copieTexte(
    participant: RapportParticipant,
    lienRevision: string,
  ): string {
    return [
      `Bonjour ${participant.prenom},`,
      '',
      'Voici le détail de vos réponses pour cette session.',
      `Note obtenue : ${participant.note.toFixed(1)}/20.`,
      '',
      ...participant.reponses.map(
        (reponse) =>
          `${reponse.questionId} — ${reponse.concept} : vous avez répondu « ${reponse.valeur} », ${verdictDe(reponse)}.`,
      ),
      '',
      `Reprendre mon entraînement : ${lienRevision}`,
    ].join('\n');
  }

  private toCsv(rapport: RapportSession): string {
    const entetes = [
      'prénom',
      'nom',
      'email',
      'question',
      'concept',
      'réponse',
      'correcte',
      'misconception',
      'durée_ms',
    ];
    const lignes = rapport.participants.flatMap((participant) =>
      participant.reponses.map((reponse) =>
        [
          participant.prenom,
          participant.nom,
          participant.email,
          reponse.questionId,
          reponse.concept,
          reponse.valeur,
          reponse.correcte ? 'oui' : 'non',
          reponse.misconception ?? '',
          String(reponse.dureeMs),
        ]
          .map(
            (cellule) =>
              `"${neutraliserCelluleCsv(cellule).replace(/"/g, '""')}"`,
          )
          .join(';'),
      ),
    );
    return `${BOM_UTF8}${[entetes.join(';'), ...lignes].join('\r\n')}`;
  }
}

const CARACTERES_FORMULE_RE = /^[=+@\t\r]/;
const NOMBRE_NEGATIF_VALIDE_RE = /^-\d+([.,]\d+)?$/;

/**
 * CWE-1236 : neutralise une cellule CSV qu'Excel interpreterait comme une
 * formule a l'ouverture (nom d'etudiant en `=HYPERLINK(...)`, reponse
 * libre en `+`/`@`...), en la prefixant d'une apostrophe. Le signe moins
 * est traite a part : les destinataires sont des comptables, `-1500` ou
 * `-12,5` sont des montants legitimes qui doivent rester sommables — seule
 * une cellule commencant par `-` sans etre un nombre valide (`-=1+1`,
 * `--cmd`) est neutralisee.
 */
function neutraliserCelluleCsv(valeur: string): string {
  if (CARACTERES_FORMULE_RE.test(valeur)) {
    return `'${valeur}`;
  }
  if (valeur.startsWith('-') && !NOMBRE_NEGATIF_VALIDE_RE.test(valeur)) {
    return `'${valeur}`;
  }
  return valeur;
}
