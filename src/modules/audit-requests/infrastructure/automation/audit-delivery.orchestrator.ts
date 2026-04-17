import { Inject, Injectable, Logger } from '@nestjs/common';
import type { AuditSnapshot } from '../../domain/AuditProcessing';
import type {
  ClientReportSynthesis,
  ExpertReportSynthesis,
} from '../../domain/AuditReportTiers';
import { detectBusinessType } from '../../domain/BusinessType';
import type { EngineCoverage, EngineScore } from '../../domain/EngineCoverage';
import type { IAuditNotifierPort } from '../../domain/IAuditNotifier.port';
import type { IAuditPdfGenerator } from '../../domain/IAuditPdfGenerator';
import { AUDIT_PDF_GENERATOR } from '../../domain/IAuditPdfGenerator';
import type { IAuditRequestsRepository } from '../../domain/IAuditRequests.repository';
import { AUDIT_NOTIFIER, AUDIT_REQUESTS_REPOSITORY } from '../../domain/token';
import type { AuditLocale } from '../../domain/audit-locale.util';
import type { DeepUrlAnalysisResult } from './deep-url-analysis.service';
import {
  ClientReportContext,
  ClientReportFinding,
  LangchainClientReportService,
} from './langchain-client-report.service';
import type { PageAiRecap } from './page-ai-recap.service';

/**
 * Parametres d'entree simplifies pour la phase de delivery, tels que
 * produits par le pipeline. L'orchestrateur se charge de recharger le
 * snapshot depuis le repository et de mapper les findings techniques.
 */
export interface RunDeliveryInput {
  readonly auditId: string;
  readonly locale: AuditLocale;
  readonly websiteName: string;
  readonly contactMethod: 'EMAIL' | 'PHONE';
  readonly contactValue: string;
  readonly normalizedUrl: string;
  readonly pillarScores: Record<string, number>;
  readonly quickWins: ReadonlyArray<string>;
  readonly pageRecaps: ReadonlyArray<PageAiRecap>;
  readonly expertReport: ExpertReportSynthesis | undefined;
  readonly deepFindings: DeepUrlAnalysisResult['findings'];
  /**
   * Stack technique detectee par {@link DeepUrlAnalysisService.inferTechFingerprint}
   * (P1.1). Utilisee pour deduire un {@link BusinessType} et contextualiser
   * le prompt client. `null` si le signal est insuffisant.
   */
  readonly primaryStack?: string | null;
}

/**
 * Contexte necessaire a la phase de delivery d'un audit : synthese LLM,
 * recaps par page, et meta du client. Le pipeline transmet ces donnees
 * a l'orchestrateur apres la synthese Langchain.
 */
export interface AuditDeliveryContext {
  readonly auditSnapshot: AuditSnapshot;
  readonly locale: AuditLocale;
  readonly websiteName: string;
  readonly normalizedUrl: string;
  readonly contactMethod: 'EMAIL' | 'PHONE';
  readonly contactValue: string;
  readonly pillarScores: Record<string, number>;
  readonly quickWins: ReadonlyArray<string>;
  readonly pageRecaps: ReadonlyArray<PageAiRecap>;
  readonly expertReport: ExpertReportSynthesis;
  readonly findings: ReadonlyArray<ClientReportFinding>;
  /** Stack technique detectee (P1.1) — propagee au contexte LLM client. */
  readonly primaryStack?: string | null;
}

/**
 * Orchestrateur de la phase finale du pipeline Growth Audit : produit le
 * rapport client (LLM), agrege la couverture multi-moteur, genere le PDF
 * (best-effort) et declenche les envois email fire-and-forget.
 *
 * Extrait du {@link AuditPipelineService} pour respecter le budget de
 * taille du pipeline principal (guardrails).
 */
@Injectable()
export class AuditDeliveryOrchestrator {
  private readonly logger = new Logger(AuditDeliveryOrchestrator.name);

  constructor(
    @Inject(AUDIT_REQUESTS_REPOSITORY)
    private readonly repo: IAuditRequestsRepository,
    @Inject(AUDIT_NOTIFIER)
    private readonly notifier: IAuditNotifierPort,
    @Inject(AUDIT_PDF_GENERATOR)
    private readonly pdfGenerator: IAuditPdfGenerator,
    private readonly clientReportService: LangchainClientReportService,
  ) {}

  /**
   * Point d'entree appele par le pipeline apres la synthese LLM. Recharge
   * le snapshot, mappe les findings techniques en findings client et
   * delegue a {@link deliver}. Ne leve jamais (toutes les erreurs sont
   * loggees).
   */
  async runForAudit(input: RunDeliveryInput): Promise<void> {
    if (!input.expertReport) {
      this.logger.warn(
        `Audit ${input.auditId}: expertSynthesis missing, skipping delivery phase.`,
      );
      return;
    }

    const latest = await this.repo.findById(input.auditId);
    if (!latest) {
      this.logger.warn(
        `Audit ${input.auditId}: not found before delivery phase.`,
      );
      return;
    }

    const findings: ClientReportFinding[] = input.deepFindings.map(
      (finding) => ({
        title: finding.title,
        description: finding.description,
        severity: this.normalizeFindingSeverity(finding.severity),
        impact: this.normalizeFindingImpact(finding.impact),
      }),
    );

    try {
      await this.deliver({
        auditSnapshot: latest,
        locale: input.locale,
        websiteName: input.websiteName,
        normalizedUrl: input.normalizedUrl,
        contactMethod: input.contactMethod,
        contactValue: input.contactValue,
        pillarScores: input.pillarScores,
        quickWins: input.quickWins,
        pageRecaps: input.pageRecaps,
        expertReport: input.expertReport,
        findings,
        primaryStack: input.primaryStack ?? null,
      });
    } catch (error) {
      this.logger.warn(
        `Delivery phase failed for audit ${input.auditId}: ${String(error)}`,
      );
    }
  }

  private normalizeFindingSeverity(
    severity: unknown,
  ): 'high' | 'medium' | 'low' {
    const value = typeof severity === 'string' ? severity.toLowerCase() : '';
    if (value === 'high' || value === 'critical') return 'high';
    if (value === 'low') return 'low';
    return 'medium';
  }

  private normalizeFindingImpact(
    impact: unknown,
  ): 'traffic' | 'indexation' | 'conversion' {
    const value = typeof impact === 'string' ? impact.toLowerCase() : '';
    if (value === 'indexation') return 'indexation';
    if (value === 'conversion') return 'conversion';
    return 'traffic';
  }

  /**
   * Execute la phase delivery pour un audit deja marque COMPLETED.
   *
   * Idempotence : si `auditSnapshot.clientReport` est deja defini, la phase
   * est un no-op complet (les mails ne sont pas renvoyes).
   */
  async deliver(context: AuditDeliveryContext): Promise<void> {
    const audit = context.auditSnapshot;
    if (audit.clientReport) {
      this.logger.log(
        `Audit ${audit.id}: clientReport already persisted, skipping delivery.`,
      );
      return;
    }

    const engineCoverage = this.aggregateEngineCoverage(context.pageRecaps);

    const clientReport = await this.generateClientReport(
      context,
      engineCoverage,
    );

    let pdfBuffer: Buffer | null = null;
    try {
      pdfBuffer = await this.pdfGenerator.generate(
        {
          ...audit,
          clientReport,
          expertReport: context.expertReport,
          engineCoverage,
        },
        clientReport,
        context.expertReport,
      );
    } catch (error) {
      this.logger.warn(
        `PDF generation failed for audit ${audit.id}: ${String(error)}`,
      );
      pdfBuffer = null;
    }

    try {
      await this.repo.updateState(audit.id, {
        clientReport,
        expertReport: context.expertReport,
        engineCoverage,
      });
    } catch (error) {
      this.logger.warn(
        `Audit ${audit.id}: failed to persist clientReport/expertReport: ${String(error)}`,
      );
    }

    this.dispatchEmails(context, clientReport, pdfBuffer);
  }

  private async generateClientReport(
    context: AuditDeliveryContext,
    engineCoverage: EngineCoverage,
  ): Promise<ClientReportSynthesis> {
    // P1.1 : detection du type d'activite depuis le techFingerprint produit
    // par le pipeline amont. Injecte dans le prompt LLM pour des recos
    // sectorielles plutot que generiques.
    const businessType = detectBusinessType(context.primaryStack ?? '');

    const clientContext: ClientReportContext = {
      locale: context.locale,
      websiteName: context.websiteName,
      normalizedUrl: context.normalizedUrl,
      pillarScores: context.pillarScores,
      findings: context.findings,
      quickWins: context.quickWins,
      aggregateAiSignals: null,
      engineCoverage,
      businessType,
    };
    try {
      return await this.clientReportService.generate(clientContext);
    } catch (error) {
      // LangchainClientReportService a son propre fallback interne et ne
      // devrait pas throw, mais on protege quand meme le pipeline.
      this.logger.warn(
        `Client report generation threw unexpectedly: ${String(error)}`,
      );
      throw error;
    }
  }

  private dispatchEmails(
    context: AuditDeliveryContext,
    clientReport: ClientReportSynthesis,
    pdfBuffer: Buffer | null,
  ): void {
    const audit = context.auditSnapshot;

    if (context.contactMethod === 'EMAIL') {
      void this.notifier
        .sendClientReport({
          to: context.contactValue,
          firstName: this.extractFirstName(context.contactValue),
          websiteName: context.websiteName,
          clientReport,
          pdfBuffer,
          bookingUrl: process.env.AUDIT_BOOKING_URL ?? null,
        })
        .catch((error) =>
          this.logger.warn(
            `Client report email failed for audit ${audit.id}: ${String(error)}`,
          ),
        );
    }

    // PDF obligatoire pour le rapport expert : si absent, on utilise un
    // buffer vide plutot que de bloquer l'envoi interne.
    const expertPdf = pdfBuffer ?? Buffer.from('');
    void this.notifier
      .sendExpertReport({
        websiteName: context.websiteName,
        auditId: audit.id,
        clientContact: {
          method: context.contactMethod,
          value: context.contactValue,
        },
        clientReport,
        expertReport: context.expertReport,
        pdfBuffer: expertPdf,
      })
      .catch((error) =>
        this.logger.warn(
          `Expert report email failed for audit ${audit.id}: ${String(error)}`,
        ),
      );
  }

  /**
   * Agrege les `engineScores` des recaps page-par-page en une
   * {@link EngineCoverage} site-wide. Strategie : moyenne des scores par
   * moteur, strengths/blockers/opportunities aplatis deduplique, indexable
   * agrege par OR logique.
   */
  private aggregateEngineCoverage(
    recaps: ReadonlyArray<PageAiRecap>,
  ): EngineCoverage {
    if (recaps.length === 0) {
      return this.buildEmptyCoverage();
    }

    return {
      google: this.averageEngine(
        recaps.map((r) => r.engineScores.google),
        'google',
      ),
      bingChatGpt: this.averageEngine(
        recaps.map((r) => r.engineScores.bingChatGpt),
        'bing_chatgpt',
      ),
      perplexity: this.averageEngine(
        recaps.map((r) => r.engineScores.perplexity),
        'perplexity',
      ),
      geminiOverviews: this.averageEngine(
        recaps.map((r) => r.engineScores.geminiOverviews),
        'gemini_overviews',
      ),
    };
  }

  private averageEngine(
    entries: ReadonlyArray<EngineScore>,
    engine: EngineScore['engine'],
  ): EngineScore {
    const total = entries.reduce((sum, entry) => sum + entry.score, 0);
    const avg = entries.length > 0 ? Math.round(total / entries.length) : 0;
    const indexable = entries.some((entry) => entry.indexable);
    const strengths = this.flattenUnique(entries.map((e) => e.strengths));
    const blockers = this.flattenUnique(entries.map((e) => e.blockers));
    const opportunities = this.flattenUnique(
      entries.map((e) => e.opportunities),
    );
    return {
      engine,
      score: avg,
      indexable,
      strengths,
      blockers,
      opportunities,
    };
  }

  private flattenUnique(
    entries: ReadonlyArray<ReadonlyArray<string>>,
  ): string[] {
    const set = new Set<string>();
    for (const sublist of entries) {
      for (const entry of sublist) {
        const trimmed = entry.trim();
        if (trimmed.length > 0) set.add(trimmed);
      }
    }
    return [...set].slice(0, 8);
  }

  private buildEmptyCoverage(): EngineCoverage {
    const empty = (engine: EngineScore['engine']): EngineScore => ({
      engine,
      score: 0,
      indexable: false,
      strengths: [],
      blockers: [],
      opportunities: [],
    });
    return {
      google: empty('google'),
      bingChatGpt: empty('bing_chatgpt'),
      perplexity: empty('perplexity'),
      geminiOverviews: empty('gemini_overviews'),
    };
  }

  /**
   * Deduit un prenom lisible depuis le local-part d'une adresse email
   * (`tim.moyence@outlook.fr` → `Tim`). Retourne null quand le format
   * n'est pas exploitable (numerique, trop court, ou valeur non-email).
   * Utilise pour personnaliser la salutation du mail client (P0.6).
   */
  private extractFirstName(contactValue: string): string | null {
    const trimmed = contactValue.trim();
    if (!trimmed.includes('@')) return null;
    const [localPart] = trimmed.split('@');
    if (!localPart) return null;

    const firstToken = localPart.split(/[._+-]/)[0]?.trim() ?? '';
    if (firstToken.length < 2) return null;
    if (/^\d+$/.test(firstToken)) return null;

    const normalized = firstToken.toLowerCase();
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  }
}
