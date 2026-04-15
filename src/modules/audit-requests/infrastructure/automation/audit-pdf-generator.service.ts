import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import puppeteer, { Browser } from 'puppeteer';
import type { AuditSnapshot } from '../../domain/AuditProcessing';
import type {
  ClientReportSynthesis,
  ExpertReportSynthesis,
} from '../../domain/AuditReportTiers';
import type { IAuditPdfGenerator } from '../../domain/IAuditPdfGenerator';
import { AuditReportHtmlRendererService } from './audit-report-html-renderer.service';

/**
 * Genere le PDF du rapport Growth Audit via Puppeteer (Chromium headless)
 * a partir d'un template HTML+CSS construit par
 * {@link AuditReportHtmlRendererService}.
 *
 * Reprend le pattern de {@link ToolkitPdfGeneratorService} (lead-magnets) :
 *  - Instance Chromium unique, lazy-init au premier appel
 *  - Fermeture propre au shutdown du module via {@link onModuleDestroy}
 *  - Options A4 + marges physiques uniformes, printBackground active
 *  - Args compatibles Docker (no-sandbox, disable-dev-shm-usage)
 *
 * La page Puppeteer est TOUJOURS fermee dans un bloc finally, meme en cas
 * d'erreur, pour eviter les fuites. En revanche, le browser reste en vie
 * apres une erreur de page pour ne pas penaliser les appels suivants.
 */
@Injectable()
export class AuditPdfGeneratorService
  implements IAuditPdfGenerator, OnModuleDestroy
{
  private readonly logger = new Logger(AuditPdfGeneratorService.name);
  private browserPromise: Promise<Browser> | null = null;

  constructor(private readonly htmlRenderer: AuditReportHtmlRendererService) {}

  /** Genere le PDF du rapport pour un audit donne. */
  async generate(
    audit: AuditSnapshot,
    clientReport: ClientReportSynthesis,
    expertReport: ExpertReportSynthesis,
  ): Promise<Buffer> {
    const html = this.htmlRenderer.render(audit, clientReport, expertReport);
    const browser = await this.getBrowser();
    const page = await browser.newPage();
    try {
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        // Marges physiques uniformes appliquees a TOUTES les pages physiques.
        // La cover utilise des marges negatives pour deborder et remplir
        // entierement la premiere page.
        margin: {
          top: '28mm',
          bottom: '24mm',
          left: '22mm',
          right: '22mm',
        },
        preferCSSPageSize: false,
      });
      return Buffer.from(pdf);
    } finally {
      await page.close();
    }
  }

  /** Lance Chromium une seule fois et retourne l'instance partagee. */
  private async getBrowser(): Promise<Browser> {
    if (!this.browserPromise) {
      this.browserPromise = puppeteer.launch({
        headless: true,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
        ],
      });
    }
    return this.browserPromise;
  }

  /** Ferme proprement Chromium lors du shutdown du module. */
  async onModuleDestroy(): Promise<void> {
    if (this.browserPromise) {
      try {
        const browser = await this.browserPromise;
        await browser.close();
      } catch (error) {
        this.logger.warn(
          `Echec lors de la fermeture du navigateur Puppeteer: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      } finally {
        this.browserPromise = null;
      }
    }
  }
}
