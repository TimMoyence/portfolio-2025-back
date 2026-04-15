import type { IAuditRequestsRepository } from '../../src/modules/audit-requests/domain/IAuditRequests.repository';
import type { IAuditNotifierPort } from '../../src/modules/audit-requests/domain/IAuditNotifier.port';
import type { IAuditQueuePort } from '../../src/modules/audit-requests/domain/IAuditQueue.port';
import { AuditRequest } from '../../src/modules/audit-requests/domain/AuditRequest';
import type { AuditSnapshot } from '../../src/modules/audit-requests/domain/AuditProcessing';
import type { AuditReportNotificationPayload } from '../../src/modules/audit-requests/infrastructure/AuditRequestMailer.service';

/** Construit un objet AuditRequest domaine avec des valeurs par defaut. */
export function buildAuditRequest(
  overrides?: Partial<AuditRequest>,
): AuditRequest {
  const request = new AuditRequest();
  request.id = 'audit-req-1';
  request.websiteName = 'example.com';
  request.contactMethod = 'EMAIL';
  request.contactValue = 'test@example.com';
  request.locale = 'fr';
  request.done = false;
  request.ip = null;
  request.userAgent = null;
  request.referer = null;
  return Object.assign(request, overrides);
}

/** Construit un AuditSnapshot avec des valeurs par defaut. */
export function buildAuditSnapshot(
  overrides?: Partial<AuditSnapshot>,
): AuditSnapshot {
  return {
    id: 'audit-1',
    requestId: 'req-1',
    websiteName: 'example.com',
    contactMethod: 'EMAIL',
    contactValue: 'test@example.com',
    locale: 'fr',
    done: false,
    processingStatus: 'RUNNING',
    progress: 50,
    step: 'crawling',
    error: null,
    normalizedUrl: 'https://example.com/',
    finalUrl: 'https://example.com/',
    redirectChain: [],
    keyChecks: {},
    quickWins: [],
    pillarScores: {},
    summaryText: null,
    fullReport: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    startedAt: new Date('2026-01-01T00:00:00Z'),
    finishedAt: null,
    ...overrides,
  };
}

/** Cree un mock complet du repository de demandes d'audit. */
export function createMockAuditRequestsRepo(): jest.Mocked<IAuditRequestsRepository> {
  return {
    create: jest.fn(),
    findById: jest.fn(),
    findSummaryById: jest.fn(),
    updateState: jest.fn(),
  };
}

/** Cree un mock du notifier d'audit. */
export function createMockAuditNotifier(): jest.Mocked<IAuditNotifierPort> {
  return {
    sendAuditNotification: jest.fn().mockResolvedValue(undefined),
    sendClientReport: jest.fn().mockResolvedValue(undefined),
    sendExpertReport: jest.fn().mockResolvedValue(undefined),
  };
}

/** Cree un mock du port de file d'attente des audits. */
export function createMockAuditQueue(): jest.Mocked<IAuditQueuePort> {
  return {
    enqueue: jest.fn(),
  };
}

/** Construit un payload de rapport d'audit avec des valeurs par defaut. */
export function buildAuditReportPayload(
  overrides?: Partial<AuditReportNotificationPayload>,
): AuditReportNotificationPayload {
  return {
    auditId: 'audit-001',
    websiteName: 'mon-site.fr',
    contactMethod: 'EMAIL',
    contactValue: 'client@example.com',
    locale: 'fr',
    summaryText: 'Resume du rapport de test.',
    fullReport: {
      locale: 'fr',
      llm: {
        reportExplanation: 'Explication du rapport.',
        executiveSummary: 'Resume executif.',
        diagnosticChapters: {
          conversionAndClarity: 'Analyse conversion.',
          speedAndPerformance: 'Analyse vitesse.',
          seoFoundations: 'Analyse SEO.',
          credibilityAndTrust: 'Analyse confiance.',
          techAndScalability: 'Analyse tech.',
          scorecardAndBusinessOpportunities: 'Scorecard.',
        },
        techFingerprint: {
          primaryStack: 'Next.js',
          confidence: 0.85,
          evidence: ['React hydration', 'Vercel headers'],
          unknowns: ['CDN provider'],
          alternatives: ['Gatsby'],
        },
        priorities: [
          {
            title: 'Corriger les meta descriptions',
            severity: 'high',
            whyItMatters: 'Impact SEO fort',
            recommendedFix: 'Ajouter meta unique par page',
            estimatedHours: 4,
          },
        ],
        implementationTodo: [
          {
            phase: 'Phase 1',
            objective: 'SEO basique',
            deliverable: 'Meta tags',
            estimatedHours: 8,
            dependencies: ['Design valide'],
          },
        ],
        whatToFixThisWeek: [
          {
            task: 'Meta descriptions',
            goal: 'Indexation amelioree',
            estimatedHours: 4,
            risk: 'Faible',
            dependencies: [],
          },
        ],
        whatToFixThisMonth: [
          {
            task: 'Refonte navigation',
            goal: 'UX amelioree',
            estimatedHours: 16,
            risk: 'Moyen',
            dependencies: ['Design'],
          },
        ],
        fastImplementationPlan: [
          {
            task: 'Fix title tags',
            priority: 'high',
            expectedImpact: 'CTR +15%',
            whyItMatters: 'Google snippet',
            implementationSteps: ['Audit titles', 'Rewrite', 'Deploy'],
            estimatedHours: 3,
          },
        ],
        implementationBacklog: [
          {
            task: 'Schema markup',
            priority: 'medium',
            details: 'Ajouter JSON-LD',
            estimatedHours: 6,
            dependencies: [],
            acceptanceCriteria: ['Rich snippets valides'],
          },
        ],
        invoiceScope: [
          {
            item: 'Lot SEO',
            description: 'Optimisation SEO complete',
            estimatedHours: 20,
          },
        ],
        costEstimate: {
          currency: 'EUR',
          totalEstimatedHours: 40,
          estimatedCostMin: 3200,
          estimatedCostMax: 4800,
          fastTrackHours: 20,
          fastTrackCostMin: 1600,
          fastTrackCostMax: 2400,
        },
        qualityGate: {
          valid: true,
          retried: false,
          fallback: false,
          reasons: ['All checks passed'],
        },
        clientMessageTemplate: 'Bonjour, voici les resultats.',
        clientLongEmail: 'Email long detaille pour le client.',
      },
      findings: [],
      scoring: { quickWins: [] },
    },
    ...overrides,
  };
}
