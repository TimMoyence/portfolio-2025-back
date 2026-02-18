import { Injectable, Logger } from '@nestjs/common';
import { createTransport, Transporter } from 'nodemailer';
import { AuditRequest } from '../domain/AuditRequest';
import { AuditLocale, resolveAuditLocale } from '../domain/audit-locale.util';

export interface AuditReportNotificationPayload {
  auditId: string;
  websiteName: string;
  contactMethod: 'EMAIL' | 'PHONE';
  contactValue: string;
  locale: AuditLocale;
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

    const {
      auditId,
      websiteName,
      contactMethod,
      contactValue,
      summaryText,
      locale: requestedLocale,
    } = payload;
    const locale = resolveAuditLocale(
      requestedLocale,
      resolveAuditLocale(payload.fullReport['locale'], 'fr'),
    );
    const serializedReport = JSON.stringify(payload.fullReport, null, 2);
    const llm = this.extractObject(payload.fullReport['llm']);
    const fullReportScoring = this.extractObject(payload.fullReport['scoring']);
    const qualityGate = this.extractObject(llm?.qualityGate);
    const explanation = this.extractString(
      llm?.reportExplanation,
      locale === 'en'
        ? 'This report provides SEO/technical priorities, an implementation plan, and PM-ready execution steps.'
        : "Ce rapport presente les priorites SEO et techniques, un plan d'action et une todo d'implementation.",
    );
    const executiveSummary = this.extractString(
      llm?.executiveSummary,
      locale === 'en'
        ? 'Executive summary unavailable.'
        : 'Resume executif non disponible.',
    );

    const priorities = this.buildPriorityActions(
      this.extractArray(llm?.priorities),
      this.extractArray(payload.fullReport['findings']),
      this.extractArray(fullReportScoring?.quickWins),
      locale,
    );
    const priorityMatrix = this.buildPriorityMatrix(priorities, locale);
    const pageRecapHighlights = this.buildPageRecapHighlights(
      this.extractObject(payload.fullReport['pages']),
      locale,
    );
    const implementationTodo = this.extractArray(llm?.implementationTodo);
    const weekPlan = this.extractArray(llm?.whatToFixThisWeek);
    const monthPlan = this.extractArray(llm?.whatToFixThisMonth);
    const clientMessageTemplate = this.extractString(
      llm?.clientMessageTemplate,
      locale === 'en'
        ? 'Hello, here are the identified priorities with an execution plan.'
        : 'Bonjour, voici les priorites identifiees avec un plan de mise en oeuvre.',
    );
    const clientLongEmail = this.extractString(
      llm?.clientLongEmail,
      summaryText,
    );
    const fastImplementationPlan = this.extractArray(
      llm?.fastImplementationPlan,
    );
    const implementationBacklog = this.extractArray(llm?.implementationBacklog);
    const invoiceScope = this.extractArray(llm?.invoiceScope);
    const costEstimate = this.extractObject(llm?.costEstimate);
    const costCurrency = this.extractString(costEstimate?.currency, 'EUR');
    const totalEstimatedHours = this.extractNumber(
      costEstimate?.totalEstimatedHours,
    );
    const estimatedCostMin = this.extractNumber(costEstimate?.estimatedCostMin);
    const estimatedCostMax = this.extractNumber(costEstimate?.estimatedCostMax);
    const fastTrackHours = this.extractNumber(costEstimate?.fastTrackHours);
    const fastTrackCostMin = this.extractNumber(costEstimate?.fastTrackCostMin);
    const fastTrackCostMax = this.extractNumber(costEstimate?.fastTrackCostMax);
    const estimatedHours = invoiceScope.reduce<number>((total, item) => {
      const hours = Number(this.extractObject(item)?.estimatedHours ?? 0);
      return Number.isFinite(hours) ? total + hours : total;
    }, 0);
    const qualityGateValid = this.extractBoolean(qualityGate?.valid, false);
    const qualityGateRetried = this.extractBoolean(qualityGate?.retried, false);
    const qualityGateFallback = this.extractBoolean(
      qualityGate?.fallback,
      false,
    );
    const qualityGateReasons = this.extractArray(qualityGate?.reasons)
      .map((reason) => this.extractString(reason, '').trim())
      .filter(Boolean);
    const qualityGateStatus = qualityGate
      ? qualityGateValid
        ? locale === 'en'
          ? 'PASS'
          : 'VALIDE'
        : locale === 'en'
          ? 'FAIL'
          : 'ECHEC'
      : locale === 'en'
        ? 'NOT_AVAILABLE'
        : 'INDISPONIBLE';
    const qualityGateReasonsText = qualityGateReasons.length
      ? qualityGateReasons.join(', ')
      : locale === 'en'
        ? 'none'
        : 'aucune';

    const prioritiesText = priorities
      .map((item, index) => {
        const object = this.extractObject(item);
        return `${index + 1}. ${this.extractString(object?.title, locale === 'en' ? 'Priority action' : 'Action prioritaire')}
   - Severity: ${this.extractString(object?.severity, 'medium').toUpperCase()}
   - Root cause / impact: ${this.extractString(object?.whyItMatters, 'N/A')}
   - Recommended remediation: ${this.extractString(object?.recommendedFix, 'N/A')}
   - Estimated effort: ${this.extractNumber(object?.estimatedHours)}h`;
      })
      .join('\n');
    const priorityMatrixText = priorityMatrix
      .map(
        (item, index) =>
          `${index + 1}. [${item.band}] ${item.title}\n   - Root cause: ${item.rootCause}\n   - Technical remediation: ${item.remediation}\n   - Validation criteria: ${item.validationCriteria}`,
      )
      .join('\n');
    const pageRecapHighlightsText = pageRecapHighlights
      .map(
        (item, index) =>
          `${index + 1}. ${item.issue}\n   - Priority pages: ${item.urls.join(', ')}\n   - Recommendation: ${item.recommendation}`,
      )
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

    const weekPlanText = weekPlan
      .map((item, index) => {
        const object = this.extractObject(item);
        const deps = this.extractArray(object?.dependencies)
          .map((dep) => this.extractString(dep, ''))
          .filter(Boolean)
          .join(', ');
        return `${index + 1}. ${this.extractString(object?.task, 'Tâche')}
   - Objectif: ${this.extractString(object?.goal, 'N/A')}
   - Charge: ${this.extractNumber(object?.estimatedHours)}h
   - Risque: ${this.extractString(object?.risk, 'N/A')}
   - Dépendances: ${deps || 'Aucune'}`;
      })
      .join('\n');

    const monthPlanText = monthPlan
      .map((item, index) => {
        const object = this.extractObject(item);
        const deps = this.extractArray(object?.dependencies)
          .map((dep) => this.extractString(dep, ''))
          .filter(Boolean)
          .join(', ');
        return `${index + 1}. ${this.extractString(object?.task, 'Tâche')}
   - Objectif: ${this.extractString(object?.goal, 'N/A')}
   - Charge: ${this.extractNumber(object?.estimatedHours)}h
   - Risque: ${this.extractString(object?.risk, 'N/A')}
   - Dépendances: ${deps || 'Aucune'}`;
      })
      .join('\n');

    const fastPlanText = fastImplementationPlan
      .map((item, index) => {
        const object = this.extractObject(item);
        const steps = this.extractArray(object?.implementationSteps)
          .map((step) => this.extractString(step, ''))
          .filter(Boolean)
          .join(' | ');
        return `${index + 1}. ${this.extractString(object?.task, 'Action rapide')}
   - Priorité: ${this.extractString(object?.priority, 'high')}
   - Impact attendu: ${this.extractString(object?.expectedImpact, 'N/A')}
   - Pourquoi: ${this.extractString(object?.whyItMatters, 'N/A')}
   - Étapes: ${steps || 'N/A'}
   - Charge: ${this.extractNumber(object?.estimatedHours)}h`;
      })
      .join('\n');

    const backlogText = implementationBacklog
      .map((item, index) => {
        const object = this.extractObject(item);
        const deps = this.extractArray(object?.dependencies)
          .map((dep) => this.extractString(dep, ''))
          .filter(Boolean)
          .join(', ');
        const criteria = this.extractArray(object?.acceptanceCriteria)
          .map((entry) => this.extractString(entry, ''))
          .filter(Boolean)
          .join(' | ');
        return `${index + 1}. ${this.extractString(object?.task, 'Tâche backlog')}
   - Priorité: ${this.extractString(object?.priority, 'medium')}
   - Détail: ${this.extractString(object?.details, 'N/A')}
   - Charge: ${this.extractNumber(object?.estimatedHours)}h
   - Dépendances: ${deps || 'Aucune'}
   - Critères d'acceptation: ${criteria || 'N/A'}`;
      })
      .join('\n');

    const costText = `Budget estimatif:
   - Total: ${totalEstimatedHours}h
   - Fourchette: ${estimatedCostMin} à ${estimatedCostMax} ${costCurrency}
   - Fast-track: ${fastTrackHours}h (${fastTrackCostMin} à ${fastTrackCostMax} ${costCurrency})`;

    const qualityGateText = `Quality Gate:
   - Status: ${qualityGateStatus}
   - Retried once: ${qualityGateRetried ? 'yes' : 'no'}
   - Fallback mode: ${qualityGateFallback ? 'yes' : 'no'}
   - Reasons: ${qualityGateReasonsText}`;

    const prioritiesHtml = priorities
      .map((item, index) => {
        const object = this.extractObject(item);
        return `
          <li style="margin-bottom:10px;">
            <strong>${index + 1}. ${this.escapeHtml(this.extractString(object?.title, locale === 'en' ? 'Priority action' : 'Action prioritaire'))}</strong><br/>
            <span><strong>Severity:</strong> ${this.escapeHtml(this.extractString(object?.severity, 'medium').toUpperCase())}</span><br/>
            <span><strong>Root cause / impact:</strong> ${this.escapeHtml(this.extractString(object?.whyItMatters, 'N/A'))}</span><br/>
            <span><strong>Recommended remediation:</strong> ${this.escapeHtml(this.extractString(object?.recommendedFix, 'N/A'))}</span><br/>
            <span><strong>Estimated effort:</strong> ${this.extractNumber(object?.estimatedHours)}h</span>
          </li>
        `;
      })
      .join('');
    const priorityMatrixHtml = priorityMatrix
      .map(
        (item, index) => `
          <li style="margin-bottom:10px;">
            <strong>${index + 1}. [${this.escapeHtml(item.band)}] ${this.escapeHtml(item.title)}</strong><br/>
            <span><strong>Root cause:</strong> ${this.escapeHtml(item.rootCause)}</span><br/>
            <span><strong>Technical remediation:</strong> ${this.escapeHtml(item.remediation)}</span><br/>
            <span><strong>Validation criteria:</strong> ${this.escapeHtml(item.validationCriteria)}</span>
          </li>
        `,
      )
      .join('');
    const pageRecapHighlightsHtml = pageRecapHighlights
      .map(
        (item, index) => `
          <li style="margin-bottom:10px;">
            <strong>${index + 1}. ${this.escapeHtml(item.issue)}</strong><br/>
            <span><strong>Priority pages:</strong> ${this.escapeHtml(item.urls.join(', '))}</span><br/>
            <span><strong>Recommendation:</strong> ${this.escapeHtml(item.recommendation)}</span>
          </li>
        `,
      )
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

    const weekPlanHtml = weekPlan
      .map((item, index) => {
        const object = this.extractObject(item);
        const deps = this.extractArray(object?.dependencies)
          .map((dep) => this.escapeHtml(this.extractString(dep, '')))
          .filter(Boolean)
          .join(', ');
        return `
          <li style="margin-bottom:10px;">
            <strong>${index + 1}. ${this.escapeHtml(this.extractString(object?.task, 'Tâche'))}</strong><br/>
            <span><strong>Objectif:</strong> ${this.escapeHtml(this.extractString(object?.goal, 'N/A'))}</span><br/>
            <span><strong>Charge:</strong> ${this.extractNumber(object?.estimatedHours)}h</span><br/>
            <span><strong>Risque:</strong> ${this.escapeHtml(this.extractString(object?.risk, 'N/A'))}</span><br/>
            <span><strong>Dépendances:</strong> ${deps || 'Aucune'}</span>
          </li>
        `;
      })
      .join('');

    const monthPlanHtml = monthPlan
      .map((item, index) => {
        const object = this.extractObject(item);
        const deps = this.extractArray(object?.dependencies)
          .map((dep) => this.escapeHtml(this.extractString(dep, '')))
          .filter(Boolean)
          .join(', ');
        return `
          <li style="margin-bottom:10px;">
            <strong>${index + 1}. ${this.escapeHtml(this.extractString(object?.task, 'Tâche'))}</strong><br/>
            <span><strong>Objectif:</strong> ${this.escapeHtml(this.extractString(object?.goal, 'N/A'))}</span><br/>
            <span><strong>Charge:</strong> ${this.extractNumber(object?.estimatedHours)}h</span><br/>
            <span><strong>Risque:</strong> ${this.escapeHtml(this.extractString(object?.risk, 'N/A'))}</span><br/>
            <span><strong>Dépendances:</strong> ${deps || 'Aucune'}</span>
          </li>
        `;
      })
      .join('');

    const fastPlanHtml = fastImplementationPlan
      .map((item, index) => {
        const object = this.extractObject(item);
        const steps = this.extractArray(object?.implementationSteps)
          .map((step) => this.escapeHtml(this.extractString(step, '')))
          .filter(Boolean)
          .join(' | ');
        return `
          <li style="margin-bottom:10px;">
            <strong>${index + 1}. ${this.escapeHtml(this.extractString(object?.task, 'Action rapide'))}</strong><br/>
            <span><strong>Priorité:</strong> ${this.escapeHtml(this.extractString(object?.priority, 'high'))}</span><br/>
            <span><strong>Impact attendu:</strong> ${this.escapeHtml(this.extractString(object?.expectedImpact, 'N/A'))}</span><br/>
            <span><strong>Pourquoi:</strong> ${this.escapeHtml(this.extractString(object?.whyItMatters, 'N/A'))}</span><br/>
            <span><strong>Étapes:</strong> ${steps || 'N/A'}</span><br/>
            <span><strong>Charge:</strong> ${this.extractNumber(object?.estimatedHours)}h</span>
          </li>
        `;
      })
      .join('');

    const backlogHtml = implementationBacklog
      .map((item, index) => {
        const object = this.extractObject(item);
        const deps = this.extractArray(object?.dependencies)
          .map((dep) => this.escapeHtml(this.extractString(dep, '')))
          .filter(Boolean)
          .join(', ');
        const criteria = this.extractArray(object?.acceptanceCriteria)
          .map((entry) => this.escapeHtml(this.extractString(entry, '')))
          .filter(Boolean)
          .join(' | ');
        return `
          <li style="margin-bottom:10px;">
            <strong>${index + 1}. ${this.escapeHtml(this.extractString(object?.task, 'Tâche backlog'))}</strong><br/>
            <span><strong>Priorité:</strong> ${this.escapeHtml(this.extractString(object?.priority, 'medium'))}</span><br/>
            <span><strong>Détail:</strong> ${this.escapeHtml(this.extractString(object?.details, 'N/A'))}</span><br/>
            <span><strong>Charge:</strong> ${this.extractNumber(object?.estimatedHours)}h</span><br/>
            <span><strong>Dépendances:</strong> ${deps || 'Aucune'}</span><br/>
            <span><strong>Critères d'acceptation:</strong> ${criteria || 'N/A'}</span>
          </li>
        `;
      })
      .join('');
    const qualityGateReasonsHtml = qualityGateReasons.length
      ? qualityGateReasons
          .map((reason) => `<li>${this.escapeHtml(reason)}</li>`)
          .join('')
      : `<li>${locale === 'en' ? 'none' : 'aucune'}</li>`;

    await this.transporter.sendMail({
      from: this.from,
      to: this.reportTo,
      subject:
        locale === 'en'
          ? `📊 Technical Audit Report Completed — ${websiteName}`
          : `📊 Rapport d'audit technique termine — ${websiteName}`,
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

Quality Gate:
${qualityGateText}

Matrice des priorites techniques:
${prioritiesText || 'Aucune action prioritaire detaillee'}

Matrice action P0/P1/P2 (technique):
${priorityMatrixText || 'Aucune action matrice detaillee'}

Signaux issus des recaps page-par-page:
${pageRecapHighlightsText || 'Aucun signal critique recaps'}

Todo implementation (mode PM):
${todoText || 'Aucune todo detaillee'}

Scope de facturation recommande:
${invoiceText || 'Aucun lot detaille'}

Charge totale estimee: ${estimatedHours}h

Plan de mise en oeuvre - cette semaine:
${weekPlanText || 'Aucun plan semaine detaille'}

Plan de mise en oeuvre - ce mois:
${monthPlanText || 'Aucun plan mois detaille'}

Template message client (copier/coller):
${clientMessageTemplate}

Email long client (version détaillée):
${clientLongEmail}

Plan d'implémentation rapide:
${fastPlanText || 'Aucun plan rapide détaillé'}

Backlog d'implémentation:
${backlogText || 'Aucun backlog détaillé'}

${costText}

Rapport complet (JSON):
${serializedReport}
      `.trim(),
      html: `
        <div style="font-family: Arial, Helvetica, sans-serif; background:#f7f7f7; padding:24px;">
          <div style="max-width:720px; margin:0 auto; background:#ffffff; border-radius:8px; padding:24px;">
            <h2 style="margin-top:0; color:#333;">${locale === 'en' ? '📊 Technical Audit Report Completed' : "📊 Rapport d'audit technique termine"}</h2>
            <p style="margin-bottom:8px;"><strong>Audit ID:</strong> ${auditId}</p>
            <p style="margin-bottom:8px;"><strong>Site:</strong> ${websiteName}</p>
            <p style="margin-bottom:16px;"><strong>Contact:</strong> ${contactMethod} — ${contactValue}</p>

            <h3 style="margin-bottom:8px;">Résumé utilisateur</h3>
            <p style="white-space:pre-line; color:#333;">${this.escapeHtml(summaryText)}</p>

            <h3 style="margin-top:16px; margin-bottom:8px;">Explication du rapport</h3>
            <p style="white-space:pre-line; color:#333;">${this.escapeHtml(explanation)}</p>

            <h3 style="margin-top:16px; margin-bottom:8px;">Synthèse exécutive</h3>
            <p style="white-space:pre-line; color:#333;">${this.escapeHtml(executiveSummary)}</p>

            <h3 style="margin-top:16px; margin-bottom:8px;">Quality Gate</h3>
            <p style="white-space:pre-line; color:#333;">
              <strong>Status:</strong> ${this.escapeHtml(qualityGateStatus)}<br/>
              <strong>Retried once:</strong> ${qualityGateRetried ? 'yes' : 'no'}<br/>
              <strong>Fallback mode:</strong> ${qualityGateFallback ? 'yes' : 'no'}
            </p>
            <p style="margin-top:0; margin-bottom:4px;"><strong>Reasons:</strong></p>
            <ul style="padding-left:20px; color:#333; margin-top:4px;">
              ${qualityGateReasonsHtml}
            </ul>

            <h3 style="margin-top:16px; margin-bottom:8px;">${locale === 'en' ? 'Technical Priority Matrix' : 'Matrice des priorites techniques'}</h3>
            <ol style="padding-left:20px; color:#333;">
              ${prioritiesHtml || '<li>Aucune action détaillée.</li>'}
            </ol>

            <h3 style="margin-top:16px; margin-bottom:8px;">Matrice action P0/P1/P2</h3>
            <ol style="padding-left:20px; color:#333;">
              ${priorityMatrixHtml || '<li>Aucune action matrice détaillée.</li>'}
            </ol>

            <h3 style="margin-top:16px; margin-bottom:8px;">Signaux recaps page-par-page</h3>
            <ol style="padding-left:20px; color:#333;">
              ${pageRecapHighlightsHtml || '<li>Aucun signal recap détaillé.</li>'}
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

            <h3 style="margin-top:16px; margin-bottom:8px;">Plan d’exécution - cette semaine</h3>
            <ol style="padding-left:20px; color:#333;">
              ${weekPlanHtml || '<li>Aucun plan hebdo détaillé.</li>'}
            </ol>

            <h3 style="margin-top:16px; margin-bottom:8px;">Plan d’exécution - ce mois</h3>
            <ol style="padding-left:20px; color:#333;">
              ${monthPlanHtml || '<li>Aucun plan mensuel détaillé.</li>'}
            </ol>

            <h3 style="margin-top:16px; margin-bottom:8px;">Template prêt à envoyer au client</h3>
            <p style="white-space:pre-line; color:#333;">${this.escapeHtml(clientMessageTemplate)}</p>

            <h3 style="margin-top:16px; margin-bottom:8px;">Email long prêt à envoyer au client</h3>
            <p style="white-space:pre-line; color:#333;">${this.escapeHtml(clientLongEmail)}</p>

            <h3 style="margin-top:16px; margin-bottom:8px;">Plan d'implémentation rapide</h3>
            <ol style="padding-left:20px; color:#333;">
              ${fastPlanHtml || '<li>Aucun plan rapide détaillé.</li>'}
            </ol>

            <h3 style="margin-top:16px; margin-bottom:8px;">Backlog d'implémentation</h3>
            <ol style="padding-left:20px; color:#333;">
              ${backlogHtml || '<li>Aucun backlog détaillé.</li>'}
            </ol>

            <h3 style="margin-top:16px; margin-bottom:8px;">Estimation coût et charge</h3>
            <p style="white-space:pre-line; color:#333;">
              <strong>Total:</strong> ${totalEstimatedHours}h<br/>
              <strong>Fourchette:</strong> ${estimatedCostMin} à ${estimatedCostMax} ${this.escapeHtml(costCurrency)}<br/>
              <strong>Fast-track:</strong> ${fastTrackHours}h (${fastTrackCostMin} à ${fastTrackCostMax} ${this.escapeHtml(costCurrency)})
            </p>

            <h3 style="margin:16px 0 8px;">Rapport complet (JSON)</h3>
            <pre style="max-height:360px; overflow:auto; background:#111; color:#eee; padding:12px; border-radius:6px;">${this.escapeHtml(serializedReport)}</pre>
          </div>
        </div>
      `,
    });
  }

  private buildPriorityActions(
    llmPriorities: unknown[],
    findings: unknown[],
    scoringQuickWins: unknown[],
    locale: AuditLocale,
  ): unknown[] {
    const output: Array<Record<string, unknown>> = [];
    const seen = new Set<string>();

    const pushPriority = (entry: Record<string, unknown>): void => {
      const title = this.extractString(
        entry.title,
        locale === 'en' ? 'Priority action' : 'Action prioritaire',
      ).trim();
      if (!title) return;
      const key = title.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);

      output.push({
        title,
        severity: this.normalizeSeverity(entry.severity),
        whyItMatters: this.extractString(
          entry.whyItMatters,
          locale === 'en'
            ? 'High impact on visibility, indexability, or conversion.'
            : 'Impact fort sur la visibilite, l indexabilite ou la conversion.',
        ),
        recommendedFix: this.extractString(entry.recommendedFix, title),
        estimatedHours: this.extractNumber(entry.estimatedHours) || 3,
      });
    };

    for (const item of llmPriorities) {
      const object = this.extractObject(item);
      if (!object) continue;
      pushPriority(object);
    }

    for (const item of findings) {
      if (output.length >= 12) break;
      const object = this.extractObject(item);
      if (!object) continue;
      pushPriority({
        title: this.extractString(
          object.title,
          locale === 'en' ? 'SEO issue detected' : 'Issue SEO detectee',
        ),
        severity: object.severity,
        whyItMatters: this.extractString(
          object.description,
          locale === 'en' ? 'Not verifiable' : 'Non verifiable',
        ),
        recommendedFix: this.extractString(
          object.recommendation,
          locale === 'en' ? 'Not verifiable' : 'Non verifiable',
        ),
        estimatedHours:
          this.normalizeSeverity(object.severity) === 'high' ? 6 : 4,
      });
    }

    for (const item of scoringQuickWins) {
      if (output.length >= 12) break;
      const label = this.extractString(item, '').trim();
      if (!label) continue;
      pushPriority({
        title: label,
        severity: 'medium',
        whyItMatters:
          locale === 'en'
            ? 'Fast remediation to improve SEO reliability and delivery outcomes.'
            : 'Correction rapide pour ameliorer la fiabilite SEO et les resultats business.',
        recommendedFix: label,
        estimatedHours: 3,
      });
    }

    return output.slice(0, 12);
  }

  private buildPriorityMatrix(
    priorities: unknown[],
    locale: AuditLocale,
  ): Array<{
    band: 'P0' | 'P1' | 'P2';
    title: string;
    rootCause: string;
    remediation: string;
    validationCriteria: string;
  }> {
    return priorities.slice(0, 12).map((item, index) => {
      const object = this.extractObject(item);
      const severity = this.normalizeSeverity(object?.['severity']);
      const band =
        severity === 'high' ? 'P0' : severity === 'medium' ? 'P1' : 'P2';
      const title = this.extractString(
        object?.['title'],
        locale === 'en' ? `Priority ${index + 1}` : `Priorite ${index + 1}`,
      );
      const rootCause = this.extractString(
        object?.['whyItMatters'],
        locale === 'en' ? 'Not verifiable' : 'Non verifiable',
      );
      const remediation = this.extractString(
        object?.['recommendedFix'],
        locale === 'en' ? 'Not verifiable' : 'Non verifiable',
      );
      const validationCriteria =
        locale === 'en'
          ? `Validate crawl/indexability, metadata rendering, and CTA flow after deploying "${title}".`
          : `Valider crawl/indexabilite, rendu metadata et parcours CTA apres deploiement de "${title}".`;
      return {
        band,
        title,
        rootCause,
        remediation,
        validationCriteria,
      };
    });
  }

  private buildPageRecapHighlights(
    pages: Record<string, unknown> | null,
    locale: AuditLocale,
  ): Array<{ issue: string; urls: string[]; recommendation: string }> {
    const recaps = this.extractArray(pages?.aiRecaps);
    const grouped = new Map<
      string,
      {
        issue: string;
        urls: Set<string>;
        recommendation: string;
        count: number;
      }
    >();

    for (const recap of recaps) {
      const object = this.extractObject(recap);
      if (!object) continue;
      const url = this.extractString(object['url'], '').trim();
      const issues = this.extractArray(object['topIssues'])
        .map((entry) => this.extractString(entry, '').trim())
        .filter(Boolean)
        .slice(0, 2);
      const recommendations = this.extractArray(object['recommendations'])
        .map((entry) => this.extractString(entry, '').trim())
        .filter(Boolean);
      const fallbackRecommendation =
        recommendations[0] ??
        (locale === 'en'
          ? 'Review page copy and CTA implementation.'
          : 'Revoir le wording de la page et l implementation du CTA.');

      for (const issue of issues) {
        const key = issue.toLowerCase();
        const current = grouped.get(key);
        if (!current) {
          grouped.set(key, {
            issue,
            urls: new Set(url ? [url] : []),
            recommendation: fallbackRecommendation,
            count: 1,
          });
          continue;
        }

        if (url) {
          current.urls.add(url);
        }
        current.count += 1;
        if (!current.recommendation && fallbackRecommendation) {
          current.recommendation = fallbackRecommendation;
        }
      }
    }

    return [...grouped.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
      .map((entry) => ({
        issue: entry.issue,
        urls: [...entry.urls].slice(0, 5),
        recommendation: entry.recommendation,
      }));
  }

  private normalizeSeverity(value: unknown): 'high' | 'medium' | 'low' {
    const normalized =
      typeof value === 'string' ? value.trim().toLowerCase() : '';
    if (normalized === 'high') return 'high';
    if (normalized === 'low') return 'low';
    return 'medium';
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

  private extractBoolean(value: unknown, fallback: boolean): boolean {
    if (typeof value === 'boolean') return value;
    return fallback;
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
