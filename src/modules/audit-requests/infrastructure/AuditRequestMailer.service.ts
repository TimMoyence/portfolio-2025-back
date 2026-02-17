import { Injectable, Logger } from '@nestjs/common';
import { createTransport, Transporter } from 'nodemailer';
import { AuditRequest } from '../domain/AuditRequest';

export interface AuditReportNotificationPayload {
  auditId: string;
  websiteName: string;
  contactMethod: 'EMAIL' | 'PHONE';
  contactValue: string;
  summaryText: string;
  fullReport: Record<string, unknown>;
}

@Injectable()
export class AuditRequestMailerService {
  private readonly logger = new Logger(AuditRequestMailerService.name);
  private readonly transporter?: Transporter;
  private readonly to = process.env.CONTACT_NOTIFICATION_TO;
  private readonly reportTo =
    process.env.AUDIT_REPORT_TO ?? process.env.CONTACT_NOTIFICATION_TO;
  private readonly from = process.env.SMTP_FROM;

  constructor() {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT
      ? Number(process.env.SMTP_PORT)
      : undefined;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && port && user && pass) {
      this.transporter = createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      }) as Transporter;
    } else {
      this.logger.warn(
        'Audit request mailer disabled: SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS not fully configured',
      );
    }
  }

  async sendAuditNotification(request: AuditRequest): Promise<void> {
    if (!this.transporter || !this.to) return;

    const { websiteName, contactMethod, contactValue } = request;

    await this.transporter.sendMail({
      from: this.from,
      to: this.to,
      subject: "🔍 Nouvelle demande d'audit SEO",
      text: `
NOUVELLE DEMANDE D'AUDIT
-------------------------

Site / activité : ${websiteName}
Contact        : ${contactMethod} — ${contactValue}
      `.trim(),
      html: `
        <div style="font-family: Arial, Helvetica, sans-serif; background:#f7f7f7; padding:24px;">
          <div style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:8px; padding:24px;">
            <h2 style="margin-top:0; color:#333;">🔍 Nouvelle demande d'audit SEO</h2>

            <table style="width:100%; border-collapse:collapse; margin-bottom:16px;">
              <tr>
                <td style="padding:6px 0; font-weight:bold; width:140px;">Site / activité</td>
                <td style="padding:6px 0;">${websiteName}</td>
              </tr>
              <tr>
                <td style="padding:6px 0; font-weight:bold;">Contact</td>
                <td style="padding:6px 0;">${contactMethod} — ${contactValue}</td>
              </tr>
            </table>

            <p style="font-size:12px; color:#666; margin:0;">
              Demande envoyée depuis la page d'audit gratuit du site.
            </p>
          </div>
        </div>
      `,
    });
  }

  async sendAuditReportNotification(
    payload: AuditReportNotificationPayload,
  ): Promise<void> {
    if (!this.transporter || !this.reportTo) return;

    const { auditId, websiteName, contactMethod, contactValue, summaryText } =
      payload;
    const serializedReport = JSON.stringify(payload.fullReport, null, 2);
    const llm = this.extractObject(payload.fullReport['llm']);
    const explanation = this.extractString(
      llm?.reportExplanation,
      "Ce rapport présente les priorités SEO et techniques, un plan d'action et une todo d'implémentation.",
    );
    const executiveSummary = this.extractString(
      llm?.executiveSummary,
      'Résumé exécutif non disponible.',
    );

    const priorities = this.extractArray(llm?.priorities);
    const implementationTodo = this.extractArray(llm?.implementationTodo);
    const invoiceScope = this.extractArray(llm?.invoiceScope);
    const estimatedHours = invoiceScope.reduce<number>((total, item) => {
      const hours = Number(this.extractObject(item)?.estimatedHours ?? 0);
      return Number.isFinite(hours) ? total + hours : total;
    }, 0);

    const prioritiesText = priorities
      .map((item, index) => {
        const object = this.extractObject(item);
        return `${index + 1}. ${this.extractString(object?.title, 'Action prioritaire')}
   - Severite: ${this.extractString(object?.severity, 'medium')}
   - Pourquoi: ${this.extractString(object?.whyItMatters, 'N/A')}
   - Recommandation: ${this.extractString(object?.recommendedFix, 'N/A')}
   - Charge estimee: ${this.extractNumber(object?.estimatedHours)}h`;
      })
      .join('\n');

    const todoText = implementationTodo
      .map((item, index) => {
        const object = this.extractObject(item);
        const dependencies = this.extractArray(object?.dependencies)
          .map((dep) => this.extractString(dep, ''))
          .filter(Boolean)
          .join(', ');
        return `${index + 1}. ${this.extractString(object?.phase, `Phase ${index + 1}`)} - ${this.extractString(object?.objective, 'N/A')}
   - Deliverable: ${this.extractString(object?.deliverable, 'N/A')}
   - Charge estimee: ${this.extractNumber(object?.estimatedHours)}h
   - Dependances: ${dependencies || 'Aucune'}`;
      })
      .join('\n');

    const invoiceText = invoiceScope
      .map((item, index) => {
        const object = this.extractObject(item);
        return `${index + 1}. ${this.extractString(object?.item, `Lot ${index + 1}`)} — ${this.extractString(object?.description, 'N/A')} (${this.extractNumber(object?.estimatedHours)}h)`;
      })
      .join('\n');

    const prioritiesHtml = priorities
      .map((item, index) => {
        const object = this.extractObject(item);
        return `
          <li style="margin-bottom:10px;">
            <strong>${index + 1}. ${this.escapeHtml(this.extractString(object?.title, 'Action prioritaire'))}</strong><br/>
            <span><strong>Sévérité:</strong> ${this.escapeHtml(this.extractString(object?.severity, 'medium'))}</span><br/>
            <span><strong>Pourquoi:</strong> ${this.escapeHtml(this.extractString(object?.whyItMatters, 'N/A'))}</span><br/>
            <span><strong>Recommandation:</strong> ${this.escapeHtml(this.extractString(object?.recommendedFix, 'N/A'))}</span><br/>
            <span><strong>Charge estimée:</strong> ${this.extractNumber(object?.estimatedHours)}h</span>
          </li>
        `;
      })
      .join('');

    const todoHtml = implementationTodo
      .map((item, index) => {
        const object = this.extractObject(item);
        const dependencies = this.extractArray(object?.dependencies)
          .map((dep) => this.escapeHtml(this.extractString(dep, '')))
          .filter(Boolean)
          .join(', ');
        return `
          <li style="margin-bottom:10px;">
            <strong>${this.escapeHtml(this.extractString(object?.phase, `Phase ${index + 1}`))}</strong> — ${this.escapeHtml(this.extractString(object?.objective, 'N/A'))}<br/>
            <span><strong>Livrable:</strong> ${this.escapeHtml(this.extractString(object?.deliverable, 'N/A'))}</span><br/>
            <span><strong>Charge:</strong> ${this.extractNumber(object?.estimatedHours)}h</span><br/>
            <span><strong>Dépendances:</strong> ${dependencies || 'Aucune'}</span>
          </li>
        `;
      })
      .join('');

    const invoiceHtml = invoiceScope
      .map((item, index) => {
        const object = this.extractObject(item);
        return `
          <tr>
            <td style="padding:8px; border:1px solid #e5e7eb;">${index + 1}</td>
            <td style="padding:8px; border:1px solid #e5e7eb;">${this.escapeHtml(this.extractString(object?.item, `Lot ${index + 1}`))}</td>
            <td style="padding:8px; border:1px solid #e5e7eb;">${this.escapeHtml(this.extractString(object?.description, 'N/A'))}</td>
            <td style="padding:8px; border:1px solid #e5e7eb; text-align:right;">${this.extractNumber(object?.estimatedHours)}h</td>
          </tr>
        `;
      })
      .join('');

    await this.transporter.sendMail({
      from: this.from,
      to: this.reportTo,
      subject: `📊 Rapport d'audit terminé — ${websiteName}`,
      text: `
RAPPORT D'AUDIT TERMINE
-----------------------

Audit ID      : ${auditId}
Site          : ${websiteName}
Contact       : ${contactMethod} — ${contactValue}

Resume utilisateur:
${summaryText}

Explication du rapport:
${explanation}

Synthese executive:
${executiveSummary}

Actions prioritaires:
${prioritiesText || 'Aucune action prioritaire detaillee'}

Todo implementation (mode PM):
${todoText || 'Aucune todo detaillee'}

Scope de facturation recommande:
${invoiceText || 'Aucun lot detaille'}

Charge totale estimee: ${estimatedHours}h

Rapport complet (JSON):
${serializedReport}
      `.trim(),
      html: `
        <div style="font-family: Arial, Helvetica, sans-serif; background:#f7f7f7; padding:24px;">
          <div style="max-width:720px; margin:0 auto; background:#ffffff; border-radius:8px; padding:24px;">
            <h2 style="margin-top:0; color:#333;">📊 Rapport d'audit terminé</h2>
            <p style="margin-bottom:8px;"><strong>Audit ID:</strong> ${auditId}</p>
            <p style="margin-bottom:8px;"><strong>Site:</strong> ${websiteName}</p>
            <p style="margin-bottom:16px;"><strong>Contact:</strong> ${contactMethod} — ${contactValue}</p>

            <h3 style="margin-bottom:8px;">Résumé utilisateur</h3>
            <p style="white-space:pre-line; color:#333;">${this.escapeHtml(summaryText)}</p>

            <h3 style="margin-top:16px; margin-bottom:8px;">Explication du rapport</h3>
            <p style="white-space:pre-line; color:#333;">${this.escapeHtml(explanation)}</p>

            <h3 style="margin-top:16px; margin-bottom:8px;">Synthèse exécutive</h3>
            <p style="white-space:pre-line; color:#333;">${this.escapeHtml(executiveSummary)}</p>

            <h3 style="margin-top:16px; margin-bottom:8px;">Liste des actions prioritaires</h3>
            <ol style="padding-left:20px; color:#333;">
              ${prioritiesHtml || '<li>Aucune action détaillée.</li>'}
            </ol>

            <h3 style="margin-top:16px; margin-bottom:8px;">Todo d’implémentation (pilotage PM)</h3>
            <ol style="padding-left:20px; color:#333;">
              ${todoHtml || '<li>Aucune todo détaillée.</li>'}
            </ol>

            <h3 style="margin-top:16px; margin-bottom:8px;">Préformat devis/facture</h3>
            <table style="width:100%; border-collapse:collapse; font-size:13px; color:#333;">
              <thead>
                <tr>
                  <th style="padding:8px; border:1px solid #e5e7eb; text-align:left;">#</th>
                  <th style="padding:8px; border:1px solid #e5e7eb; text-align:left;">Lot</th>
                  <th style="padding:8px; border:1px solid #e5e7eb; text-align:left;">Description</th>
                  <th style="padding:8px; border:1px solid #e5e7eb; text-align:right;">Heures</th>
                </tr>
              </thead>
              <tbody>
                ${invoiceHtml || '<tr><td colspan="4" style="padding:8px; border:1px solid #e5e7eb;">Aucun lot détaillé.</td></tr>'}
              </tbody>
            </table>
            <p style="margin-top:8px; font-size:13px; color:#333;"><strong>Charge totale estimée:</strong> ${estimatedHours}h</p>

            <h3 style="margin:16px 0 8px;">Rapport complet (JSON)</h3>
            <pre style="max-height:360px; overflow:auto; background:#111; color:#eee; padding:12px; border-radius:6px;">${this.escapeHtml(serializedReport)}</pre>
          </div>
        </div>
      `,
    });
  }

  private extractObject(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return null;
    }
    return value as Record<string, unknown>;
  }

  private extractArray(value: unknown): unknown[] {
    return Array.isArray(value) ? value : [];
  }

  private extractString(value: unknown, fallback: string): string {
    return typeof value === 'string' && value.trim().length > 0
      ? value
      : fallback;
  }

  private extractNumber(value: unknown): number {
    return typeof value === 'number' && Number.isFinite(value)
      ? Math.max(0, Math.round(value * 10) / 10)
      : 0;
  }

  private escapeHtml(input: string): string {
    return input
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }
}
