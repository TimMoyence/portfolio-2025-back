import { Injectable, Logger } from '@nestjs/common';
import { createTransport, Transporter } from 'nodemailer';
import { AuditRequest } from '../domain/AuditRequest';
import type {
  ClientReportMailInput,
  ExpertReportMailInput,
  IAuditNotifierPort,
} from '../domain/IAuditNotifier.port';
import { AuditLocale, resolveAuditLocale } from '../domain/audit-locale.util';
import { pillarLabel } from './automation/shared/pillar-labels.util';

export interface AuditReportNotificationPayload {
  auditId: string;
  websiteName: string;
  contactMethod: 'EMAIL' | 'PHONE';
  contactValue: string;
  locale: AuditLocale;
  summaryText: string;
  fullReport: Record<string, unknown>;
}

/** Donnees pre-calculees pour les templates text/html du rapport. */
interface ReportTemplateData {
  auditId: string;
  websiteName: string;
  contactMethod: string;
  contactValue: string;
  summaryText: string;
  locale: AuditLocale;
  serializedReport: string;
  explanation: string;
  executiveSummary: string;
  conversionAndClarity: string;
  speedAndPerformance: string;
  seoFoundations: string;
  credibilityAndTrust: string;
  techAndScalability: string;
  scorecardAndBusinessOpportunities: string;
  stackPrimary: string;
  stackConfidence: number;
  stackEvidence: string[];
  stackUnknowns: string[];
  stackAlternatives: string[];
  prioritiesText: string;
  priorityMatrixText: string;
  pageRecapHighlightsText: string;
  todoText: string;
  invoiceText: string;
  weekPlanText: string;
  monthPlanText: string;
  fastPlanText: string;
  backlogText: string;
  costText: string;
  qualityGateText: string;
  stackFingerprintText: string;
  diagnosticChaptersText: string;
  prioritiesHtml: string;
  priorityMatrixHtml: string;
  pageRecapHighlightsHtml: string;
  todoHtml: string;
  invoiceHtml: string;
  weekPlanHtml: string;
  monthPlanHtml: string;
  fastPlanHtml: string;
  backlogHtml: string;
  qualityGateReasonsHtml: string;
  stackEvidenceHtml: string;
  stackAlternativesHtml: string;
  stackUnknownsHtml: string;
  estimatedHours: number;
  totalEstimatedHours: number;
  estimatedCostMin: number;
  estimatedCostMax: number;
  costCurrency: string;
  fastTrackHours: number;
  fastTrackCostMin: number;
  fastTrackCostMax: number;
  qualityGateStatus: string;
  qualityGateRetried: boolean;
  qualityGateFallback: boolean;
  clientMessageTemplate: string;
  clientLongEmailSnippet: string;
}

@Injectable()
export class AuditRequestMailerService implements IAuditNotifierPort {
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
      html: this.buildNotificationHtml(
        websiteName,
        contactMethod,
        contactValue,
      ),
    });
  }

  private buildNotificationHtml(
    websiteName: string,
    contactMethod: string,
    contactValue: string,
  ): string {
    return `
        <div style="font-family: Arial, Helvetica, sans-serif; background:#f7f7f7; padding:24px;">
          <div style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:8px; padding:24px;">
            <h2 style="margin-top:0; color:#333;">🔍 Nouvelle demande d'audit SEO</h2>

            <table style="width:100%; border-collapse:collapse; margin-bottom:16px;">
              <tr>
                <td style="padding:6px 0; font-weight:bold; width:140px;">Site / activité</td>
                <td style="padding:6px 0;">${this.escapeHtml(websiteName)}</td>
              </tr>
              <tr>
                <td style="padding:6px 0; font-weight:bold;">Contact</td>
                <td style="padding:6px 0;">${this.escapeHtml(contactMethod)} — ${this.escapeHtml(contactValue)}</td>
              </tr>
            </table>

            <p style="font-size:12px; color:#666; margin:0;">
              Demande envoyée depuis la page d'audit gratuit du site.
            </p>
          </div>
        </div>
      `;
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
    const diagnosticChapters = this.extractObject(llm?.diagnosticChapters);
    const conversionAndClarity = this.extractString(
      diagnosticChapters?.conversionAndClarity,
      locale === 'en'
        ? 'Conversion and clarity analysis not verifiable.'
        : 'Analyse conversion et clarte non verifiable.',
    );
    const speedAndPerformance = this.extractString(
      diagnosticChapters?.speedAndPerformance,
      locale === 'en'
        ? 'Speed and performance analysis not verifiable.'
        : 'Analyse vitesse et performance non verifiable.',
    );
    const seoFoundations = this.extractString(
      diagnosticChapters?.seoFoundations,
      locale === 'en'
        ? 'SEO foundations analysis not verifiable.'
        : 'Analyse fondations SEO non verifiable.',
    );
    const credibilityAndTrust = this.extractString(
      diagnosticChapters?.credibilityAndTrust,
      locale === 'en'
        ? 'Credibility and trust analysis not verifiable.'
        : 'Analyse credibilite et confiance non verifiable.',
    );
    const techAndScalability = this.extractString(
      diagnosticChapters?.techAndScalability,
      locale === 'en'
        ? 'Tech and scalability analysis not verifiable.'
        : 'Analyse tech et scalabilite non verifiable.',
    );
    const scorecardAndBusinessOpportunities = this.extractString(
      diagnosticChapters?.scorecardAndBusinessOpportunities,
      locale === 'en'
        ? 'Scorecard and business opportunities not verifiable.'
        : 'Scorecard et opportunites business non verifiable.',
    );
    const techFingerprint = this.extractObject(
      llm?.techFingerprint ?? payload.fullReport['techFingerprint'],
    );
    const stackPrimary = this.extractString(
      techFingerprint?.primaryStack,
      locale === 'en' ? 'Not verifiable' : 'Non verifiable',
    );
    const stackConfidence = this.extractNumber(techFingerprint?.confidence);
    const stackEvidence = this.extractArray(techFingerprint?.evidence)
      .map((entry) => this.extractString(entry, '').trim())
      .filter(Boolean)
      .slice(0, 8);
    const stackUnknowns = this.extractArray(techFingerprint?.unknowns)
      .map((entry) => this.extractString(entry, '').trim())
      .filter(Boolean)
      .slice(0, 5);
    const stackAlternatives = this.extractArray(techFingerprint?.alternatives)
      .map((entry) => this.extractString(entry, '').trim())
      .filter(Boolean)
      .slice(0, 4);

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
    const clientLongEmailSnippet = this.compactText(clientLongEmail, 900);
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
    const stackFingerprintText = `Stack fingerprint:
   - Primary stack: ${stackPrimary}
   - Confidence: ${Math.round(stackConfidence * 100)}%
   - Evidence: ${stackEvidence.join(' | ') || (locale === 'en' ? 'Not verifiable' : 'Non verifiable')}
   - Alternatives: ${stackAlternatives.join(' | ') || (locale === 'en' ? 'none' : 'aucune')}
   - Unknowns: ${stackUnknowns.join(' | ') || (locale === 'en' ? 'none' : 'aucune')}`;
    const diagnosticChaptersText = `Conversion & clarte:
${conversionAndClarity}

Vitesse & performance:
${speedAndPerformance}

SEO fondations:
${seoFoundations}

Credibilite & confiance:
${credibilityAndTrust}

Tech & scalabilite:
${techAndScalability}

Scorecard claire + quick wins + opportunites business:
${scorecardAndBusinessOpportunities}`;

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
    const stackEvidenceHtml = stackEvidence.length
      ? `<ul style="padding-left:20px; margin:4px 0;">${stackEvidence.map((entry) => `<li>${this.escapeHtml(entry)}</li>`).join('')}</ul>`
      : `<p style="margin:4px 0;">${locale === 'en' ? 'Not verifiable' : 'Non verifiable'}</p>`;
    const stackAlternativesHtml = stackAlternatives.length
      ? `<p style="margin:4px 0;">${this.escapeHtml(stackAlternatives.join(' | '))}</p>`
      : `<p style="margin:4px 0;">${locale === 'en' ? 'none' : 'aucune'}</p>`;
    const stackUnknownsHtml = stackUnknowns.length
      ? `<ul style="padding-left:20px; margin:4px 0;">${stackUnknowns.map((entry) => `<li>${this.escapeHtml(entry)}</li>`).join('')}</ul>`
      : `<p style="margin:4px 0;">${locale === 'en' ? 'none' : 'aucune'}</p>`;

    const reportData: ReportTemplateData = {
      auditId,
      websiteName,
      contactMethod,
      contactValue,
      summaryText,
      locale,
      serializedReport,
      explanation,
      executiveSummary,
      conversionAndClarity,
      speedAndPerformance,
      seoFoundations,
      credibilityAndTrust,
      techAndScalability,
      scorecardAndBusinessOpportunities,
      stackPrimary,
      stackConfidence,
      stackEvidence,
      stackUnknowns,
      stackAlternatives,
      prioritiesText,
      priorityMatrixText,
      pageRecapHighlightsText,
      todoText,
      invoiceText,
      weekPlanText,
      monthPlanText,
      fastPlanText,
      backlogText,
      costText,
      qualityGateText,
      stackFingerprintText,
      diagnosticChaptersText,
      prioritiesHtml,
      priorityMatrixHtml,
      pageRecapHighlightsHtml,
      todoHtml,
      invoiceHtml,
      weekPlanHtml,
      monthPlanHtml,
      fastPlanHtml,
      backlogHtml,
      qualityGateReasonsHtml,
      stackEvidenceHtml,
      stackAlternativesHtml,
      stackUnknownsHtml,
      estimatedHours,
      totalEstimatedHours,
      estimatedCostMin,
      estimatedCostMax,
      costCurrency,
      fastTrackHours,
      fastTrackCostMin,
      fastTrackCostMax,
      qualityGateStatus,
      qualityGateRetried,
      qualityGateFallback,
      clientMessageTemplate,
      clientLongEmailSnippet,
    };

    await this.transporter.sendMail({
      from: this.from,
      to: this.reportTo,
      subject:
        locale === 'en'
          ? `📊 Technical Audit Report Completed — ${websiteName}`
          : `📊 Rapport d'audit technique termine — ${websiteName}`,
      text: this.buildReportText(reportData),
      html: this.buildReportHtml(reportData),
    });
  }

  private buildReportText(d: ReportTemplateData): string {
    return `
RAPPORT D'AUDIT TERMINE
-----------------------

Audit ID      : ${d.auditId}
Site          : ${d.websiteName}
Contact       : ${d.contactMethod} — ${d.contactValue}

Resume utilisateur:
${d.summaryText}

Explication du rapport:
${d.explanation}

Synthese executive:
${d.executiveSummary}

Quality Gate:
${d.qualityGateText}

${d.diagnosticChaptersText}

${d.stackFingerprintText}

Matrice des priorites techniques:
${d.prioritiesText || 'Aucune action prioritaire detaillee'}

Matrice action P0/P1/P2 (technique):
${d.priorityMatrixText || 'Aucune action matrice detaillee'}

Signaux issus des recaps page-par-page:
${d.pageRecapHighlightsText || 'Aucun signal critique recaps'}

Todo implementation (mode PM):
${d.todoText || 'Aucune todo detaillee'}

Scope de facturation recommande:
${d.invoiceText || 'Aucun lot detaille'}

Charge totale estimee: ${d.estimatedHours}h

Plan de mise en oeuvre - cette semaine:
${d.weekPlanText || 'Aucun plan semaine detaille'}

Plan de mise en oeuvre - ce mois:
${d.monthPlanText || 'Aucun plan mois detaille'}

Template message client (copier/coller):
${d.clientMessageTemplate}

Message client long (extrait):
${d.clientLongEmailSnippet}

Plan d'implémentation rapide:
${d.fastPlanText || 'Aucun plan rapide détaillé'}

Backlog d'implémentation:
${d.backlogText || 'Aucun backlog détaillé'}

${d.costText}

Rapport complet (JSON):
${d.serializedReport}
      `.trim();
  }

  private buildReportHtml(d: ReportTemplateData): string {
    return `
        <div style="font-family: Arial, Helvetica, sans-serif; background:#f7f7f7; padding:24px;">
          <div style="max-width:720px; margin:0 auto; background:#ffffff; border-radius:8px; padding:24px;">
            <h2 style="margin-top:0; color:#333;">${d.locale === 'en' ? '📊 Technical Audit Report Completed' : "📊 Rapport d'audit technique termine"}</h2>
            <p style="margin-bottom:8px;"><strong>Audit ID:</strong> ${this.escapeHtml(d.auditId)}</p>
            <p style="margin-bottom:8px;"><strong>Site:</strong> ${this.escapeHtml(d.websiteName)}</p>
            <p style="margin-bottom:16px;"><strong>Contact:</strong> ${this.escapeHtml(d.contactMethod)} — ${this.escapeHtml(d.contactValue)}</p>

            <h3 style="margin-bottom:8px;">Résumé utilisateur</h3>
            <p style="white-space:pre-line; color:#333;">${this.escapeHtml(d.summaryText)}</p>

            <h3 style="margin-top:16px; margin-bottom:8px;">Explication du rapport</h3>
            <p style="white-space:pre-line; color:#333;">${this.escapeHtml(d.explanation)}</p>

            <h3 style="margin-top:16px; margin-bottom:8px;">Synthèse exécutive</h3>
            <p style="white-space:pre-line; color:#333;">${this.escapeHtml(d.executiveSummary)}</p>

            <h3 style="margin-top:16px; margin-bottom:8px;">Quality Gate</h3>
            <p style="white-space:pre-line; color:#333;">
              <strong>Status:</strong> ${this.escapeHtml(d.qualityGateStatus)}<br/>
              <strong>Retried once:</strong> ${d.qualityGateRetried ? 'yes' : 'no'}<br/>
              <strong>Fallback mode:</strong> ${d.qualityGateFallback ? 'yes' : 'no'}
            </p>
            <p style="margin-top:0; margin-bottom:4px;"><strong>Reasons:</strong></p>
            <ul style="padding-left:20px; color:#333; margin-top:4px;">
              ${d.qualityGateReasonsHtml}
            </ul>

            <h3 style="margin-top:16px; margin-bottom:8px;">Conversion & clarté</h3>
            <p style="white-space:pre-line; color:#333;">${this.escapeHtml(d.conversionAndClarity)}</p>

            <h3 style="margin-top:16px; margin-bottom:8px;">Vitesse & performance</h3>
            <p style="white-space:pre-line; color:#333;">${this.escapeHtml(d.speedAndPerformance)}</p>

            <h3 style="margin-top:16px; margin-bottom:8px;">SEO fondations</h3>
            <p style="white-space:pre-line; color:#333;">${this.escapeHtml(d.seoFoundations)}</p>

            <h3 style="margin-top:16px; margin-bottom:8px;">Crédibilité & confiance</h3>
            <p style="white-space:pre-line; color:#333;">${this.escapeHtml(d.credibilityAndTrust)}</p>

            <h3 style="margin-top:16px; margin-bottom:8px;">Tech & scalabilité</h3>
            <p style="white-space:pre-line; color:#333;">${this.escapeHtml(d.techAndScalability)}</p>

            <h3 style="margin-top:16px; margin-bottom:8px;">Scorecard claire + quick wins + business opportunities</h3>
            <p style="white-space:pre-line; color:#333;">${this.escapeHtml(d.scorecardAndBusinessOpportunities)}</p>

            <h3 style="margin-top:16px; margin-bottom:8px;">Stack fingerprint</h3>
            <p style="white-space:pre-line; color:#333;">
              <strong>Primary stack:</strong> ${this.escapeHtml(d.stackPrimary)}<br/>
              <strong>Confidence:</strong> ${Math.round(d.stackConfidence * 100)}%
            </p>
            <p style="margin:6px 0 2px;"><strong>Evidence:</strong></p>
            ${d.stackEvidenceHtml}
            <p style="margin:6px 0 2px;"><strong>Alternatives:</strong></p>
            ${d.stackAlternativesHtml}
            <p style="margin:6px 0 2px;"><strong>Unknowns:</strong></p>
            ${d.stackUnknownsHtml}

            <h3 style="margin-top:16px; margin-bottom:8px;">${d.locale === 'en' ? 'Technical Priority Matrix' : 'Matrice des priorites techniques'}</h3>
            <ol style="padding-left:20px; color:#333;">
              ${d.prioritiesHtml || '<li>Aucune action détaillée.</li>'}
            </ol>

            <h3 style="margin-top:16px; margin-bottom:8px;">Matrice action P0/P1/P2</h3>
            <ol style="padding-left:20px; color:#333;">
              ${d.priorityMatrixHtml || '<li>Aucune action matrice détaillée.</li>'}
            </ol>

            <h3 style="margin-top:16px; margin-bottom:8px;">Signaux recaps page-par-page</h3>
            <ol style="padding-left:20px; color:#333;">
              ${d.pageRecapHighlightsHtml || '<li>Aucun signal recap détaillé.</li>'}
            </ol>

            <h3 style="margin-top:16px; margin-bottom:8px;">Todo d'implémentation (pilotage PM)</h3>
            <ol style="padding-left:20px; color:#333;">
              ${d.todoHtml || '<li>Aucune todo détaillée.</li>'}
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
                ${d.invoiceHtml || '<tr><td colspan="4" style="padding:8px; border:1px solid #e5e7eb;">Aucun lot détaillé.</td></tr>'}
              </tbody>
            </table>
            <p style="margin-top:8px; font-size:13px; color:#333;"><strong>Charge totale estimée:</strong> ${d.estimatedHours}h</p>

            <h3 style="margin-top:16px; margin-bottom:8px;">Plan d'exécution - cette semaine</h3>
            <ol style="padding-left:20px; color:#333;">
              ${d.weekPlanHtml || '<li>Aucun plan hebdo détaillé.</li>'}
            </ol>

            <h3 style="margin-top:16px; margin-bottom:8px;">Plan d'exécution - ce mois</h3>
            <ol style="padding-left:20px; color:#333;">
              ${d.monthPlanHtml || '<li>Aucun plan mensuel détaillé.</li>'}
            </ol>

            <h3 style="margin-top:16px; margin-bottom:8px;">Template prêt à envoyer au client</h3>
            <p style="white-space:pre-line; color:#333;">${this.escapeHtml(d.clientMessageTemplate)}</p>

            <h3 style="margin-top:16px; margin-bottom:8px;">Message client long (extrait)</h3>
            <p style="white-space:pre-line; color:#333;">${this.escapeHtml(d.clientLongEmailSnippet)}</p>

            <h3 style="margin-top:16px; margin-bottom:8px;">Plan d'implémentation rapide</h3>
            <ol style="padding-left:20px; color:#333;">
              ${d.fastPlanHtml || '<li>Aucun plan rapide détaillé.</li>'}
            </ol>

            <h3 style="margin-top:16px; margin-bottom:8px;">Backlog d'implémentation</h3>
            <ol style="padding-left:20px; color:#333;">
              ${d.backlogHtml || '<li>Aucun backlog détaillé.</li>'}
            </ol>

            <h3 style="margin-top:16px; margin-bottom:8px;">Estimation coût et charge</h3>
            <p style="white-space:pre-line; color:#333;">
              <strong>Total:</strong> ${d.totalEstimatedHours}h<br/>
              <strong>Fourchette:</strong> ${d.estimatedCostMin} à ${d.estimatedCostMax} ${this.escapeHtml(d.costCurrency)}<br/>
              <strong>Fast-track:</strong> ${d.fastTrackHours}h (${d.fastTrackCostMin} à ${d.fastTrackCostMax} ${this.escapeHtml(d.costCurrency)})
            </p>

            <h3 style="margin:16px 0 8px;">Rapport complet (JSON)</h3>
            <pre style="max-height:360px; overflow:auto; background:#111; color:#eee; padding:12px; border-radius:6px;">${this.escapeHtml(d.serializedReport)}</pre>
          </div>
        </div>
      `;
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

  private compactText(input: string, maxChars: number): string {
    const clean = input.replace(/\s+/g, ' ').trim();
    if (clean.length <= maxChars) return clean;
    return `${clean.slice(0, Math.max(0, maxChars - 3)).trimEnd()}...`;
  }

  /**
   * Envoie au client final la synthese strategique (ClientReportSynthesis)
   * avec pieces jointes si le PDF a pu etre genere. Ne leve jamais : si le
   * transporter est absent ou si l'email est vide, la methode est un no-op.
   */
  async sendClientReport(input: ClientReportMailInput): Promise<void> {
    if (!this.transporter) return;
    if (!input.to || input.to.trim().length === 0) return;

    const subject = `Votre audit Growth — ${input.websiteName}`;
    const html = this.buildClientReportHtml(input);
    const text = this.buildClientReportText(input);
    const replyTo = this.reportTo ?? this.to;

    const attachments = input.pdfBuffer
      ? [
          {
            filename: `growth-audit-${this.slugify(input.websiteName)}.pdf`,
            content: input.pdfBuffer,
            contentType: 'application/pdf',
          },
        ]
      : undefined;

    await this.transporter.sendMail({
      from: this.from,
      to: input.to,
      replyTo,
      subject,
      text,
      html,
      attachments,
    });
  }

  /**
   * Envoie a Tim la synthese expert avec le draft de mail client, les
   * constats transverses, le backlog priorise et le PDF obligatoire.
   */
  async sendExpertReport(input: ExpertReportMailInput): Promise<void> {
    if (!this.transporter) return;
    const to = this.reportTo ?? this.to;
    if (!to) return;

    const subject = `[Audit Expert] ${input.websiteName}`;
    const html = this.buildExpertReportHtml(input);
    const text = this.buildExpertReportText(input);

    await this.transporter.sendMail({
      from: this.from,
      to,
      subject,
      text,
      html,
      attachments: [
        {
          filename: `growth-audit-expert-${this.slugify(input.websiteName)}.pdf`,
          content: input.pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });
  }

  private buildClientReportHtml(input: ClientReportMailInput): string {
    const report = input.clientReport;
    const greeting = input.firstName
      ? `Bonjour ${this.escapeHtml(input.firstName)},`
      : 'Bonjour,';

    const topFindingsHtml = report.topFindings
      .map(
        (finding) => `
          <li style="margin-bottom:8px;">
            <strong>[${this.escapeHtml(finding.severity.toUpperCase())}] ${this.escapeHtml(finding.title)}</strong><br/>
            <span>${this.escapeHtml(finding.impact)}</span>
          </li>`,
      )
      .join('');

    const pillarsHtml = report.pillarScorecard
      .map(
        (pillar) => `
          <tr>
            <td style="padding:6px 8px; border:1px solid #e5e7eb;">${this.escapeHtml(pillarLabel(pillar.pillar))}</td>
            <td style="padding:6px 8px; border:1px solid #e5e7eb; text-align:right;">${pillar.score}/${pillar.target}</td>
            <td style="padding:6px 8px; border:1px solid #e5e7eb;">${this.escapeHtml(pillar.status)}</td>
          </tr>`,
      )
      .join('');

    const quickWinsHtml = report.quickWins
      .map(
        (qw) => `
          <li style="margin-bottom:8px;">
            <strong>${this.escapeHtml(qw.title)}</strong> — <em>${this.escapeHtml(qw.effort)}</em><br/>
            <span>${this.escapeHtml(qw.businessImpact)}</span>
          </li>`,
      )
      .join('');

    return `
      <div style="font-family: Arial, Helvetica, sans-serif; background:#f7f7f7; padding:24px;">
        <div style="max-width:640px; margin:0 auto; background:#ffffff; border-radius:8px; padding:24px;">
          <h2 style="margin-top:0; color:#111;">Votre audit Growth — ${this.escapeHtml(input.websiteName)}</h2>
          <p>${greeting}</p>
          <p>Voici la synthèse stratégique de votre audit.</p>

          <h3 style="margin-top:20px;">Executive summary</h3>
          <p style="white-space:pre-line; color:#333;">${this.escapeHtml(report.executiveSummary)}</p>

          <h3 style="margin-top:20px;">Visibilité Google vs IA</h3>
          <p style="color:#333;">
            <strong>Google :</strong> ${report.googleVsAiMatrix.googleVisibility.score}/100 — ${this.escapeHtml(report.googleVsAiMatrix.googleVisibility.summary)}<br/>
            <strong>IA :</strong> ${report.googleVsAiMatrix.aiVisibility.score}/100 — ${this.escapeHtml(report.googleVsAiMatrix.aiVisibility.summary)}
          </p>

          <h3 style="margin-top:20px;">Top findings</h3>
          <ul style="padding-left:20px; color:#333;">
            ${topFindingsHtml || '<li>Aucun point critique détecté.</li>'}
          </ul>

          <h3 style="margin-top:20px;">Scorecard 7 piliers</h3>
          <table style="width:100%; border-collapse:collapse; font-size:13px; color:#333;">
            <thead>
              <tr>
                <th style="padding:6px 8px; border:1px solid #e5e7eb; text-align:left;">Pilier</th>
                <th style="padding:6px 8px; border:1px solid #e5e7eb; text-align:right;">Score / cible</th>
                <th style="padding:6px 8px; border:1px solid #e5e7eb; text-align:left;">Statut</th>
              </tr>
            </thead>
            <tbody>${pillarsHtml}</tbody>
          </table>

          <h3 style="margin-top:20px;">Quick wins prioritaires</h3>
          <ul style="padding-left:20px; color:#333;">
            ${quickWinsHtml}
          </ul>

          <div style="margin-top:24px; padding:16px; background:#111; color:#fff; border-radius:6px;">
            <strong>${this.escapeHtml(report.cta.title)}</strong><br/>
            <span>${this.escapeHtml(report.cta.description)}</span><br/>
            <span style="display:inline-block; margin-top:8px; padding:6px 12px; background:#fff; color:#111; border-radius:4px;">${this.escapeHtml(report.cta.actionLabel)}</span>
          </div>

          <p style="font-size:12px; color:#666; margin-top:24px;">
            ${input.pdfBuffer ? 'Le rapport complet est joint à cet email.' : 'Le rapport détaillé vous sera envoyé dans un second temps.'}
          </p>
        </div>
      </div>
    `;
  }

  private buildClientReportText(input: ClientReportMailInput): string {
    const report = input.clientReport;
    const lines: string[] = [];
    lines.push(`VOTRE AUDIT GROWTH — ${input.websiteName}`);
    lines.push('');
    lines.push(input.firstName ? `Bonjour ${input.firstName},` : 'Bonjour,');
    lines.push('');
    lines.push('Executive summary :');
    lines.push(report.executiveSummary);
    lines.push('');
    lines.push(
      `Google : ${report.googleVsAiMatrix.googleVisibility.score}/100 — ${report.googleVsAiMatrix.googleVisibility.summary}`,
    );
    lines.push(
      `IA : ${report.googleVsAiMatrix.aiVisibility.score}/100 — ${report.googleVsAiMatrix.aiVisibility.summary}`,
    );
    lines.push('');
    lines.push('Top findings :');
    for (const finding of report.topFindings) {
      lines.push(
        `- [${finding.severity.toUpperCase()}] ${finding.title} — ${finding.impact}`,
      );
    }
    lines.push('');
    lines.push('Scorecard 7 piliers :');
    for (const pillar of report.pillarScorecard) {
      lines.push(
        `- ${pillarLabel(pillar.pillar)}: ${pillar.score}/${pillar.target} (${pillar.status})`,
      );
    }
    lines.push('');
    lines.push('Quick wins :');
    for (const qw of report.quickWins) {
      lines.push(`- ${qw.title} (${qw.effort}) — ${qw.businessImpact}`);
    }
    lines.push('');
    lines.push(`${report.cta.title} — ${report.cta.description}`);
    lines.push(`Action : ${report.cta.actionLabel}`);
    lines.push('');
    lines.push(
      input.pdfBuffer
        ? 'Le rapport complet est joint a cet email.'
        : 'Le rapport detaille vous sera envoye dans un second temps.',
    );
    return lines.join('\n');
  }

  private buildExpertReportHtml(input: ExpertReportMailInput): string {
    const expert = input.expertReport;
    const client = input.clientReport;
    const contactHtml =
      input.clientContact.method === 'PHONE'
        ? `<p style="margin:0 0 8px; padding:12px; background:#fff4e5; border-left:4px solid #f59e0b;"><strong>Contact TELEPHONE — appel requis :</strong> ${this.escapeHtml(input.clientContact.value)}</p>`
        : `<p style="margin:0 0 8px;"><strong>Contact EMAIL :</strong> ${this.escapeHtml(input.clientContact.value)}</p>`;

    const crossFindingsHtml = expert.crossPageFindings
      .slice(0, 5)
      .map(
        (finding) => `
          <li style="margin-bottom:10px;">
            <strong>[${this.escapeHtml(finding.severity.toUpperCase())}] ${this.escapeHtml(finding.title)}</strong><br/>
            <span><em>Root cause :</em> ${this.escapeHtml(finding.rootCause)}</span><br/>
            <span><em>Remediation :</em> ${this.escapeHtml(finding.remediation)}</span><br/>
            <span><em>Affected URLs :</em> ${this.escapeHtml(finding.affectedUrls.join(', ') || '—')}</span>
          </li>`,
      )
      .join('');

    const backlogHtml = expert.priorityBacklog
      .map(
        (item) => `
          <li style="margin-bottom:10px;">
            <strong>${this.escapeHtml(item.title)}</strong> — impact ${this.escapeHtml(item.impact)} / effort ${this.escapeHtml(item.effort)}<br/>
            <em>Acceptance :</em> ${this.escapeHtml(item.acceptanceCriteria.join(' | ') || '—')}
          </li>`,
      )
      .join('');

    const clientMatrixHtml = `
      <ul style="padding-left:20px; color:#333;">
        <li>Google : ${client.googleVsAiMatrix.googleVisibility.score}/100 — ${this.escapeHtml(client.googleVsAiMatrix.googleVisibility.summary)}</li>
        <li>IA : ${client.googleVsAiMatrix.aiVisibility.score}/100 — ${this.escapeHtml(client.googleVsAiMatrix.aiVisibility.summary)}</li>
      </ul>`;

    return `
      <div style="font-family: Arial, Helvetica, sans-serif; background:#f7f7f7; padding:24px;">
        <div style="max-width:760px; margin:0 auto; background:#ffffff; border-radius:8px; padding:24px;">
          <h2 style="margin-top:0;">[Audit Expert] ${this.escapeHtml(input.websiteName)}</h2>
          <p style="margin:0 0 8px;"><strong>Audit ID :</strong> ${this.escapeHtml(input.auditId)}</p>
          ${contactHtml}

          <h3 style="margin-top:20px;">Executive summary expert</h3>
          <p style="white-space:pre-line; color:#333;">${this.escapeHtml(expert.executiveSummary)}</p>

          <h3 style="margin-top:20px;">Synthese client (Google vs IA)</h3>
          ${clientMatrixHtml}

          <h3 style="margin-top:20px;">Draft mail client (a copier/coller)</h3>
          <div style="padding:16px; background:#f9fafb; border:1px dashed #cbd5e1; border-radius:6px;">
            <p style="margin:0 0 8px;"><strong>Subject :</strong> ${this.escapeHtml(expert.clientEmailDraft.subject)}</p>
            <pre style="margin:0; white-space:pre-wrap; font-family:inherit; color:#111;">${this.escapeHtml(expert.clientEmailDraft.body)}</pre>
          </div>

          <h3 style="margin-top:20px;">Internal notes</h3>
          <p style="white-space:pre-line; color:#333;">${this.escapeHtml(expert.internalNotes)}</p>

          <h3 style="margin-top:20px;">Cross-page findings (top 5)</h3>
          <ul style="padding-left:20px; color:#333;">
            ${crossFindingsHtml || '<li>Aucun.</li>'}
          </ul>

          <h3 style="margin-top:20px;">Priority backlog</h3>
          <ul style="padding-left:20px; color:#333;">
            ${backlogHtml || '<li>Aucun.</li>'}
          </ul>

          <p style="font-size:12px; color:#666; margin-top:24px;">PDF complet en piece jointe.</p>
        </div>
      </div>
    `;
  }

  private buildExpertReportText(input: ExpertReportMailInput): string {
    const expert = input.expertReport;
    const client = input.clientReport;
    const lines: string[] = [];
    lines.push(`[AUDIT EXPERT] ${input.websiteName}`);
    lines.push(`Audit ID : ${input.auditId}`);
    lines.push(
      input.clientContact.method === 'PHONE'
        ? `Contact TELEPHONE — appel requis : ${input.clientContact.value}`
        : `Contact EMAIL : ${input.clientContact.value}`,
    );
    lines.push('');
    lines.push('Executive summary expert :');
    lines.push(expert.executiveSummary);
    lines.push('');
    lines.push('Synthese client (Google vs IA) :');
    lines.push(
      `- Google : ${client.googleVsAiMatrix.googleVisibility.score}/100 — ${client.googleVsAiMatrix.googleVisibility.summary}`,
    );
    lines.push(
      `- IA : ${client.googleVsAiMatrix.aiVisibility.score}/100 — ${client.googleVsAiMatrix.aiVisibility.summary}`,
    );
    lines.push('');
    lines.push('--- Draft mail client (a copier/coller) ---');
    lines.push(`Subject : ${expert.clientEmailDraft.subject}`);
    lines.push('');
    lines.push(expert.clientEmailDraft.body);
    lines.push('--- fin draft ---');
    lines.push('');
    lines.push('Internal notes :');
    lines.push(expert.internalNotes);
    lines.push('');
    lines.push('Cross-page findings (top 5) :');
    for (const finding of expert.crossPageFindings.slice(0, 5)) {
      lines.push(
        `- [${finding.severity.toUpperCase()}] ${finding.title} — root cause : ${finding.rootCause} — remediation : ${finding.remediation}`,
      );
    }
    lines.push('');
    lines.push('Priority backlog :');
    for (const item of expert.priorityBacklog) {
      lines.push(
        `- ${item.title} (impact ${item.impact} / effort ${item.effort})`,
      );
    }
    lines.push('');
    lines.push('PDF complet en piece jointe.');
    return lines.join('\n');
  }

  private slugify(input: string): string {
    return (
      input
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60) || 'audit'
    );
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
