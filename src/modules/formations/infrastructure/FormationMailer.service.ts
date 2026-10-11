import { Injectable } from '@nestjs/common';
import { ExpediteurSmtp } from '../../../common/infrastructure/mail/expediteur-smtp';
import {
  escapeHtml,
  escapeUrl,
  safeHtml,
} from '../../../common/infrastructure/mail/html-escape.util';
import type { EscapedHtml } from '../../../common/infrastructure/mail/html-escape.util';
import { conceptsFragilesLisibles } from '../domain/IFormationMailer.port';
import type {
  CopieEtudiant,
  IFormationMailer,
  RapportParticipant,
  RapportQuestion,
  RapportSession,
} from '../domain/IFormationMailer.port';
import { rapportEnCsv } from '../domain/RapportCsv';

function noteSur20(note: number): string {
  return `${note.toFixed(1)}/20`;
}

function verdictDe(reponse: RapportQuestion): string {
  if (reponse.correcte) {
    return "c'est juste";
  }
  return reponse.libelleConfusion === null
    ? "c'est faux"
    : `c'est faux — confusion « ${reponse.libelleConfusion} »`;
}

@Injectable()
export class FormationMailerService
  extends ExpediteurSmtp
  implements IFormationMailer
{
  constructor() {
    super(FormationMailerService.name, 'Formation mailer');
  }

  async sendSyntheseFormateur(
    destinataire: string,
    rapport: RapportSession,
  ): Promise<void> {
    if (!this.transporter) {
      return;
    }
    const csv = rapportEnCsv(rapport);
    await this.transporter.sendMail({
      from: this.from,
      to: destinataire,
      subject: `Cours ${rapport.courseSlug} — session ${rapport.code}`,
      text: this.syntheseTexte(rapport),
      html: this.syntheseHtml(rapport),
      attachments: [
        {
          filename: csv.nom,
          content: Buffer.from(csv.contenu),
          contentType: csv.type,
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
            Note obtenue : <strong>${escapeHtml(noteSur20(participant.note))}</strong>
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
          « ${escapeHtml(reponse.reponse)} », ${escapeHtml(verdictDe(reponse))}.
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
      lignes.push(`Concepts fragiles : ${conceptsFragilesLisibles(rapport)}.`);
      lignes.push('');
    }
    for (const participant of rapport.participants) {
      lignes.push(
        `${participant.prenom} ${participant.nom} : complétion ` +
          `${Math.round(participant.completion * 100)}%, note ` +
          noteSur20(participant.note) +
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
        ? escapeHtml(conceptsFragilesLisibles(rapport))
        : escapeHtml('aucun');
    const lignesParticipants = rapport.participants.map(
      (participant) => safeHtml`<tr>
          <td style="padding:4px 8px;">${escapeHtml(participant.prenom)} ${escapeHtml(participant.nom)}</td>
          <td style="padding:4px 8px;">${Math.round(participant.completion * 100)}%</td>
          <td style="padding:4px 8px;">${escapeHtml(noteSur20(participant.note))}</td>
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
      `Note obtenue : ${noteSur20(participant.note)}.`,
      '',
      ...participant.reponses.map(
        (reponse) =>
          `${reponse.questionId} — ${reponse.concept} : vous avez répondu « ${reponse.reponse} », ${verdictDe(reponse)}.`,
      ),
      '',
      `Reprendre mon entraînement : ${lienRevision}`,
    ].join('\n');
  }
}
