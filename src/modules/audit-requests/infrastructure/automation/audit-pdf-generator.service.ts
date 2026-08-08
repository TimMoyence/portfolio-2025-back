import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import puppeteer, { Browser } from 'puppeteer';
import type { AuditSnapshot } from '../../domain/AuditProcessing';
import type {
  ClientReportSynthesis,
  ExpertReportSynthesis,
} from '../../domain/AuditReportTiers';
import type { IAuditPdfGenerator } from '../../domain/IAuditPdfGenerator';
import { AuditReportHtmlRendererService } from './audit-report-html-renderer.service';

const PAGE_MARGINS = {
  top: '28mm',
  bottom: '24mm',
  left: '22mm',
  right: '22mm',
} as const;

// puppeteer : Chromium ne demarre pas dans un conteneur Docker sans ces args.
const CONTAINER_SAFE_CHROMIUM_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
];

@Injectable()
export class AuditPdfGeneratorService
  implements IAuditPdfGenerator, OnModuleDestroy
{
  private readonly logger = new Logger(AuditPdfGeneratorService.name);
  private browserPromise: Promise<Browser> | null = null;

  constructor(private readonly htmlRenderer: AuditReportHtmlRendererService) {}

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
        margin: PAGE_MARGINS,
        preferCSSPageSize: false,
      });
      return Buffer.from(pdf);
    } finally {
      await page.close();
    }
  }

  private async getBrowser(): Promise<Browser> {
    if (!this.browserPromise) {
      this.browserPromise = puppeteer.launch({
        headless: true,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
        args: CONTAINER_SAFE_CHROMIUM_ARGS,
      });
    }
    return this.browserPromise;
  }

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
